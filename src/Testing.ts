import { SimpleResponse } from "./SimpleResponse";
import { NodeHttpRequest } from "./NodeHttpRequest";
import { BrowserHttpRequest } from "./BrowserHttpRequest";
import {
  SimpleResponseInterface,
  StubRequest
} from "./Types";
import * as http from "http";
import * as https from "https";
import * as sinon from "sinon";

export class TestSimpleResponse extends SimpleResponse {
  /**
   * Allows the tester to probe the response's internal state to verify that it is indeed
   * being updated correctly by the given abstraction (NodeHttpRequest or BrowserHttpRequest)
   * in response to the various lifecycle events of an HTTP request.
   */
  public getInternalState(which: string): any {
    return (this as any)[which];
  }
}

export class TestNodeHttpRequest extends NodeHttpRequest {
  /**
   * Returns the raw underlying http request (an official node http(s).ClientRequest object)
   * that the given NodeHttpRequest is an abstraction for. This is only useful when the user
   * stubs out raw requests using `requestStub` (see below), as it then allows the user to
   * call methods on the raw request like `beginReturn`, `pushData`, and `finishRequest` that
   * cause the response to progress through its lifecycle.
   */
  public getReq(): http.ClientRequest {
    return this.req;
  }

  /**
   * Returns the SimpleResponse object being prepared by this NodeHttpRequest abstraction.
   *
   * This is useful for testing that the class is indeed updating the response in response to
   * specific events on the raw underlying request (see above).
   */
  public getRes(): SimpleResponseInterface {
    return this.res;
  }
}

export class TestBrowserHttpRequest extends BrowserHttpRequest {
  /**
   * Returns the raw underlying http request (an official XMLHttpRequest object) that the
   * given BrowserHttpRequest is an abstraction for. This is only useful when the user stubs
   * out raw requests using `requestStub` (see below), as it then allows the user to call
   * methods on the raw request like `beginReturn`, `pushData`, and `finishRequest` that cause
   * the response to progress through its lifecycle.
   */
  public getReq(): XMLHttpRequest {
    return this.req;
  }

  /**
   * Returns the SimpleResponse object being prepared by this BrowserHttpRequest abstraction.
   *
   * This is useful for testing that the class is indeed updating the response in response to
   * specific events on the raw underlying request (see above).
   */
  public getRes(): SimpleResponseInterface {
    return this.res;
  }
}

/**
 * This function is used to stub out `global.http.request`. You'll typically do this by storing the original function (`const httpRequestOrig = global.http.request`), subbing this stub request method in (`global.http.request = requestStub`), then restoring the original after the test is run (`global.http.request = httpRequestOrig`).
 * 
 * When this stub is in place, it will return a stubbed `http.ClientRequest` object that allows you to precisely control the lifecycle and data of the request. You would do this like so:
 * 
 * const r: http.ClientRequest = global.http.request(reqOpts, (res: http.ClientResponse) => {
 *     // Handle response here
 * });
 *
 * // Signal that the request has started to return:
 * r.beginReturn(400, { "content-type": "application/json" });
 * 
 * // Now push a chunk of data
 * r.pushData('{"data":"some data"}');
 * 
 * // Finally, fire the callback by signalling that the respose is complete
 * r.finishRequest();
 * @param reqOpts 
 * @param reqCb 
 */
export function requestStub(reqOpts: http.RequestOptions | https.RequestOptions, reqCb?: (res: http.ClientResponse) => void): StubRequest {
  let r: any = sinon.createStubInstance(http.ClientRequest);

  // TS complaining about non-existing connection property, so fixing
  r.connection = null;

  /**
   * Simulate the beginning of an HTTP response. This calls the callback that was given on request create, passing
   * it a fake http ClientResponse object.
   */
  r.beginReturn = function(code: number, headers: http.IncomingHttpHeaders): void {
    let res: any = sinon.createStubInstance(http.IncomingMessage);
    r.response = res;

    res.statusCode = code;
    res.headers = headers;
    res.responseData = "";
    res.httpHandlers = {
      "data": [],
      "end": []
    };

    res.on.restore();
    sinon.stub(res, "on").callsFake((ev: "data" | "end", cb: Function) => {
      (res as any).httpHandlers[ev].push(cb);
    });

    if (reqCb) {
      reqCb(res);
    }
  }

  /**
   * Simulate an "on data" event, causing the response to indicate that it has received a chunk of data.
   */
  r.pushData = function(chunk: string) {
    r.response.responseData += chunk;
    r.response.httpHandlers.data.forEach(function(cb: Function) {
      cb(chunk);
    })
  };

  /**
   * Simulate an "on end" event, i.e., the end of the response.
   */
  r.finishRequest = function() {
    r.response.httpHandlers.end.forEach(function(cb: Function) {
      cb();
    });
  };

  return r;
};
