import "mocha";
import * as assert from "power-assert";
import { SimpleResponse } from "../src/SimpleResponse";
import { TestSimpleResponse } from "../src/Testing";


let r: TestSimpleResponse;

describe("SimpleResponse Test", () => {

  beforeEach(() => {
    r = new TestSimpleResponse();
  });


  it("should throw errors on getters when uninitialized", () => {
    ([ "getResponseCode", "getHeaders", "getData" ] as any).forEach((method: string) => {
      assert.throws(() => {
        (r as any)[method]();
      }, /.*This response has not yet been initialized!.*/);
    });
  });


  it("should throw error on getData when not complete", () => {
    r.init(201, {});
    assert.throws(() => {
      r.getData();
    }, /^Error: Can't get data; this response is still receiving data from the server.$/);
  });


  it("should return status code and headers after initialized", () => {
    let h: any = { "content-type": "application/json" };
    r.init(200, h);
    assert.equal(r.getResponseCode(), 200);
    assert.equal(r.getHeaders(), h);
  });


  it("should aggregate data correctly", () => {
    r.init(200, { "content-type": "application/json" });
    r
      .aggregateData("One ")
      .aggregateData("two ")
      .aggregateData("three")
      .end()
    ;
    assert.equal(r.getData(), "One two three");
  });



  it("should transition state properly", () => {
    assert.equal(r.getInternalState("initialized"), false);
    assert.equal(r.getInternalState("status"), "waiting");
    assert.equal(r.getInternalState("data"), "");

    r.init(201, {
      "content-type": "application/json"
    });

    assert.equal(r.getInternalState("initialized"), true);
    assert.equal(r.getInternalState("status"), "receiving");
    assert.equal(r.getResponseCode(), 201);
    assert.equal(r.getHeaders()["content-type"], "application/json");
    assert.equal(r.getInternalState("data"), "");

    r.aggregateData("This is some data");

    assert.equal(r.getInternalState("initialized"), true);
    assert.equal(r.getInternalState("status"), "receiving");
    assert.equal(r.getInternalState("data"), "This is some data");

    r.end();

    assert.equal(r.getInternalState("initialized"), true);
    assert.equal(r.getInternalState("status"), "complete");
    assert.equal(r.getInternalState("data"), "This is some data");
  });


});
