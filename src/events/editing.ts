import { Socket } from "socket.io";

type NoteId = string;
type EditingInfo = { noteId: NoteId; username?: string };
type User = { clientId: string; username: string };

const noteEditorsMap: Record<NoteId, User[]> = {};

const makeNoteEditorCallback = <T>(callback: (noteId: NoteId, user?: User) => T) => {
  return (noteId: NoteId, user?: User) => {
    if (noteEditorsMap[noteId] === undefined) {
      noteEditorsMap[noteId] = [];
    }

    return callback(noteId, user);
  };
};

const getNoteEditors = makeNoteEditorCallback((noteId) => noteEditorsMap[noteId]);

const removeNoteEditor = makeNoteEditorCallback((noteId, user) => {
  noteEditorsMap[noteId] = noteEditorsMap[noteId].filter((editor) => editor.clientId !== user!.clientId);
});

const addNoteEditor = makeNoteEditorCallback((noteId, user) => {
  removeNoteEditor(noteId, user!);
  noteEditorsMap[noteId].push(user!);
});

export const registerEditingEvents = (socket: Socket) => {
  socket.on("editing:start", ({ noteId, username }: EditingInfo) => {
    const user = { clientId: socket.id, username: username ?? "" };
    addNoteEditor(noteId, user);
    socket.broadcast.emit("editing:start", { noteId, editors: getNoteEditors(noteId) });
  });

  socket.on("editing:stop", ({ noteId, username }: EditingInfo) => {
    const user = { clientId: socket.id, username: username ?? "" };
    removeNoteEditor(noteId, user);
    socket.broadcast.emit("editing:stop", { noteId, editors: getNoteEditors(noteId) });
  });
};
