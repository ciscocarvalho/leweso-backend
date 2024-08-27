import { Server } from "socket.io";
import { registerEditingEvents } from "./editing";

const registerEvents = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("A user connected");

    registerEditingEvents(socket);
  });
};

export default registerEvents;
