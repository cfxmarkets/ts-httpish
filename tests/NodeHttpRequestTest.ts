import "mocha";
import * as assert from "power-assert";
import { TestNodeHttpRequest, requestStub } from "../src/Testing";
import {
  SimpleResponseInterface,
  HttpRequestArgs
} from "../src/Types";
import * as http from "http";
import * as https from "https";


describe("NodeHttpRequest", () => {

  let args: HttpRequestArgs = {
    method: "get",
    protocol: "https:",
    hostname: "dev.apis.cfxtrading.com",
    port: 443,
    path: "/brokerage/v2/assets",
    headers: {
      "content-type": "application/json",
      "authorization": "Bearer abcde12345"
    }
  };

  let httpReqOrig = http.request;
  let httpsReqOrig = https.request;

  before(function() {
    (http as any).request = requestStub;
    (https as any).request = requestStub;
  });

  after(function() {
    (http as any).request = httpReqOrig;
    (https as any).request = httpsReqOrig;
  });


  it("should populate response values correctly on state changes", () => {

    // Create request
    let r = new TestNodeHttpRequest(args);

    let statusCode = null;
    let responseText = null;
    let nodeReq: any = r.getReq();
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
    let testData: string = '{"what":"test payload"}';
    r.send(testData);

    // The onload event STILL shouldn't have fired
    assert.strictEqual(statusCode, null);
    assert.strictEqual(responseText, null);

    // Pretend to start returning
    nodeReq.beginReturn(200, { "content-type": "application/json" });

    // Still no....
    assert.strictEqual(statusCode, null);
    assert.strictEqual(responseText, null);
    assert.strictEqual(simpleResponse.getResponseCode(), 200);
    assert.notStrictEqual(simpleResponse.getHeaders(), { "content-type": "application/json" });

    // Still no....
    nodeReq.pushData(testData);
    assert.strictEqual(statusCode, null);
    assert.strictEqual(responseText, null);

    // NOW the onload should have fired and we should have populated our values
    nodeReq.finishRequest();
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(responseText, testData);

  });


});
