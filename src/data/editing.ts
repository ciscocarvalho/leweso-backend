export type NoteId = string;
export type EditingInfo = { noteId: NoteId; username?: string };
export type User = { clientId: string; username: string };

export const noteEditorsMap: Record<NoteId, User[]> = {};

const makeNoteEditorCallback = <T>(callback: (noteId: NoteId, user?: User) => T) => {
  return (noteId: NoteId, user?: User) => {
    if (noteEditorsMap[noteId] === undefined) {
      noteEditorsMap[noteId] = [];
    }

    return callback(noteId, user);
  };
};

export const getNoteEditors = makeNoteEditorCallback((noteId) => noteEditorsMap[noteId]);

export const removeNoteEditor = makeNoteEditorCallback((noteId, user) => {
  noteEditorsMap[noteId] = noteEditorsMap[noteId].filter((editor) => editor.clientId !== user!.clientId);
});

export const addNoteEditor = makeNoteEditorCallback((noteId, user) => {
  removeNoteEditor(noteId, user!);
  noteEditorsMap[noteId].push(user!);
});
