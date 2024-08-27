import { Router } from "express";
import editingRouter from "./editingRouter";

const router = Router();

router.use("/editing", editingRouter);

export default router;
