import * as net from "net";
import { SimpleResponseInterface } from "../src/Types";
import { SocketRequest } from "../src/SocketRequest";

let s: net.Socket = net.createConnection(process.env.HOME + "/Desktop/app.sock");

let req = new SocketRequest({
  method: "GET",
  path: "/brokerage/v2/assets/INVT001",
  socket: s
});
req.on("load", (res: SimpleResponseInterface): void => {
  console.log("Result Code: " + res.getResponseCode());
  console.log("Data: " + res.getData());
});
req.send();

req = new SocketRequest({
  method: "GET",
  path: "/brokerage/v2/assets/INVT001",
  socket: s
});
req.on("load", (res: SimpleResponseInterface): void => {
  console.log("Result Code: " + res.getResponseCode());
  console.log("Data: " + res.getData());
  s.destroy();
});
req.send();

