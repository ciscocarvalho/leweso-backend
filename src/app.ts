import "dotenv/config";
import express from "express";
import cors from "cors";
import { FRONTEND_URL, PORT } from "./constants";
import { createServer } from "node:http";
import { Server } from "socket.io";
import registerEvents from "./events";

const app = express();
const server = createServer(app);
const io = new Server(server);

const corsMiddleware = cors({ origin: FRONTEND_URL });

app.use(corsMiddleware);

app.get("/", (req, res) => {
  res.status(200).send("<h1>It works!</h1>");
});

io.engine.use(corsMiddleware);

registerEvents(io);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

export default server;
