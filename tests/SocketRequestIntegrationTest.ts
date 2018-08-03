import "mocha";
import * as assert from "power-assert";
import * as net from "net";
import { SimpleResponseInterface } from "../src/Types";
import { SocketRequest } from "../src/SocketRequest";

describe("Httpish SocketRequest", () => {
  let socketPath: string | undefined = process.env.CFX_APIS_SOCKET_PATH;
  if (socketPath === undefined) {
    socketPath = "/srv/local/dev.apis.cfx.private/app.sock";
  }
  let s: net.Socket = net.createConnection(socketPath);
  let outstandingCalls: number = 0;

  it("should successfully get data from a socket connection", async () => {
    let req = new SocketRequest({
      method: "GET",
      path: "/brokerage/v2/assets/INVT001",
      socket: s
    });
    req.on("load", (res: SimpleResponseInterface): void => {
      assert(res.getResponseCode() === 200, "Response should be 200");
      assert(typeof res.getBody() === "string", "Response should be a string");
      assert(res.getBody().length > 0, "Response should have something in it.");
      outstandingCalls--;
    });
    outstandingCalls++;
    req.send();

    req = new SocketRequest({
      method: "GET",
      path: "/brokerage/v2/assets/INVT001",
      socket: s
    });
    req.on("load", (res: SimpleResponseInterface): void => {
      assert(res.getResponseCode() === 200, "Response should be 200");
      assert(typeof res.getBody() === "string", "Response should be a string");
      assert(res.getBody().length > 0, "Response should have something in it.");
      outstandingCalls--;
    });
    outstandingCalls++;
    req.send();
  });

  // Make sure to clean up
  let i: any;
  i = setInterval(function() {
    if (outstandingCalls < 1) {
      s.destroy();
      clearInterval(i);
    }
  }, 50);
});

