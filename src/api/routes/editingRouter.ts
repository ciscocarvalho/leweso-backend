import { Router } from "express";
import { getNoteEditors } from "../../data/editing";
import { UNKNOWN_ERROR } from "../errors";

const router = Router();

router.get("/:noteId", async (req, res) => {
  try {
    const { noteId } = req.params;
    const editors = getNoteEditors(noteId);
    res.status(200).json({ data: { editors } });
  } catch (e) {
    console.error(e);
    res.status(404).json({ errors: [UNKNOWN_ERROR] });
  }
});

export default router;
