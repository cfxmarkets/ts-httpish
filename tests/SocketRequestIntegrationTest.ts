import "mocha";
import { assert } from "chai";
import * as net from "net";
import { SimpleResponseInterface } from "../src/Types";
import { SocketRequest } from "../src/SocketRequest";

describe("Httpish SocketRequest", () => {
  let socketPath: string | undefined = process.env.CFX_APIS_SOCKET_PATH;
  if (socketPath === undefined) {
    socketPath = "/srv/local/dev.apis.cfx.private/app.sock";
  }

  it("should successfully get data from a socket connection", async () => {
    let req = new SocketRequest({
      method: "GET",
      path: "/brokerage/v2/assets/INVT001",
      socketPath: <string>socketPath
    });
    req.on("load", (res: SimpleResponseInterface): void => {
      assert(res.getResponseCode() === 200, "Response should be 200");
      assert(typeof res.getBody() === "string", "Response should be a string");
      assert(res.getBody().length > 0, "Response should have something in it.");

      let invt: any = (JSON.parse(res.getBody() as any)).data;
      assert.equal(invt.id, "INVT001");
    });
    req.send();

    req = new SocketRequest({
      method: "GET",
      path: "/brokerage/v2/assets/BCAP",
      socketPath: <string>socketPath
    });
    req.on("load", (res: SimpleResponseInterface): void => {
      assert(res.getResponseCode() === 200, "Response should be 200");
      assert(typeof res.getBody() === "string", "Response should be a string");
      assert(res.getBody().length > 0, "Response should have something in it.");

      let bcap: any = (JSON.parse(res.getBody() as any)).data;
      assert.equal(bcap.id, "BCAP");
    });
    req.send();
  });
});

