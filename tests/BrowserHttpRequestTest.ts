import "mocha";
import * as assert from "power-assert";
import { TestBrowserHttpRequest } from "../src/Testing";
import {
  SimpleResponseInterface,
  HttpRequestArgs
} from "../src/Types";
import "../src/global-browser-stubs";


let args: HttpRequestArgs = {
  method: "get",
  protocol: "https",
  hostname: "dev.apis.cfxtrading.com",
  port: 443,
  path: "/brokerage/v2/assets",
  headers: {
    "content-type": "application/json",
    "authorization": "Bearer abcde12345"
  }
};


describe("BrowserHttpRequest", () => {


  it("should populate response values correctly on state changes", () => {
    // Create request
    let r = new TestBrowserHttpRequest(args);

    let statusCode = null;
    let responseText = null;
    let xhr: any = r.getReq();
    let simpleResponse: SimpleResponseInterface = r.getRes();

    // Add onload listener
    r.on("load", (res: SimpleResponseInterface): void => {
      statusCode = res.getResponseCode();
      responseText = res.getData();
    });

    // The onload event shouldn't have fired yet
    assert.strictEqual(statusCode, null);
    assert.strictEqual(responseText, null);

    // Send request
    r.send('{"what":"test payload"}');

    // The onload event STILL shouldn't have fired
    assert.strictEqual(statusCode, null);
    assert.strictEqual(responseText, null);

    // Still no....
    xhr.setStatusCode(200);
    xhr.changeState(xhr.HEADERS_RECEIVED);
    assert.strictEqual(statusCode, null);
    assert.strictEqual(responseText, null);
    assert.strictEqual(simpleResponse.getResponseCode(), 200);
    assert.notStrictEqual(simpleResponse.getHeaders(), args.headers);

    // Still no....
    xhr.changeState(xhr.SENT);
    assert.strictEqual(statusCode, null);
    assert.strictEqual(responseText, null);

    // NOW the onload should have fired and we should have populated our values
    xhr.changeState(xhr.DONE);
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(responseText, '{"what":"test payload"}');
  });


});
