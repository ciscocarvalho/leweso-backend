import { Socket } from "socket.io";
import { addNoteEditor, EditingInfo, getNoteEditors, NoteId, removeNoteEditor } from "../data/editing";

// Map from clientId to (Map from NoteId to Timeout)
// A client can edit multiple notes "at the same time" as long as they keep
// intersecting between notes before the timeout expires.
let timeoutMap: Record<string, Record<NoteId, NodeJS.Timeout | undefined>> = new Proxy(
  {},
  {
    get: (target: any, prop, receiver) => {
      return target[prop] ?? {};
    },
    set: (target: any, prop, value) => {
      if (!(prop in target)) {
        target[prop] = {};
      }

      target[prop] = value;
      return true;
    },
  },
);

let cleanupIntervalMap: Record<string, NodeJS.Timeout | undefined> = {};

const CLEANUP_INTERVAL_TIME = 5000;
const EDITING_TIMEOUT_TIME = 2500;

// cleanup others to prevent leaking
const cleanup = (socket: Socket) => {
  Object.entries(timeoutMap).forEach(([clientId, clientTimeoutMap]) => {
    if (socket.id !== clientId || socket.connected) {
      return;
    }

    Object.entries(clientTimeoutMap).forEach(([noteId, timeout]) => {
      if (timeout === undefined) {
        return;
      }

      socket.broadcast.emit("editing:stop", { noteId, editors: getNoteEditors(noteId) });
      clearTimeout(timeout);
      delete clientTimeoutMap[noteId];
    });
  });
};

export const registerEditingEvents = (socket: Socket) => {
  const broadcastStart = (noteId: NoteId) => {
    socket.broadcast.emit("editing:start", { noteId, editors: getNoteEditors(noteId) });
  };

  const broadcastStop = (noteId: NoteId) => {
    socket.broadcast.emit("editing:stop", { noteId, editors: getNoteEditors(noteId) });
  };

  const onStop = ({ noteId, username }: EditingInfo) => {
    const user = { clientId: socket.id, username: username ?? "" };
    removeNoteEditor(noteId, user);

    if (timeoutMap[user.clientId] !== undefined) {
      clearTimeout(timeoutMap[user.clientId][noteId]);
      delete timeoutMap[user.clientId][noteId];
    }

    broadcastStop(noteId);
  };

  socket.on("editing:start", ({ noteId, username }: EditingInfo) => {
    const user = { clientId: socket.id, username: username ?? "" };
    addNoteEditor(noteId, user);

    if (timeoutMap[user.clientId] !== undefined) {
      clearTimeout(timeoutMap[user.clientId][noteId]);
    }

    timeoutMap[user.clientId][noteId] = setTimeout(() => onStop({ noteId, username }), EDITING_TIMEOUT_TIME);

    broadcastStart(noteId);
  });

  socket.on("editing:stop", onStop);

  cleanupIntervalMap[socket.id] = setInterval(() => {
    clearInterval(cleanupIntervalMap[socket.id]);
    delete cleanupIntervalMap[socket.id];
    cleanup(socket);
  }, CLEANUP_INTERVAL_TIME);

  socket.on("disconnect", () => {
    delete cleanupIntervalMap[socket.id];
  });
};
