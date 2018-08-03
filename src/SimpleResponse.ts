import { IncomingHttpHeaders } from "http";
import {
  SimpleResponseInterface,
  SimpleResponseLoadHandler,
  SimpleResponseStatus
} from "./Types";

export class SimpleResponse implements SimpleResponseInterface {
  protected initialized: boolean = false;
  protected status: SimpleResponseStatus = "waiting";
  protected returnCode: number = 0;
  protected headers: IncomingHttpHeaders = {};
  protected data: string = "";
  protected handlers: { load: SimpleResponseLoadHandler[] } = {
    load: []
  };

  /**
   * This method is to be called when the underlying response object returns with a status code and headers.
   *
   * This is to allow certain types of processing before the full body has been received, and to set status
   * to "receiving" to allow us to properly handle slow buffers and premature requests for data.
   */
  public init(
    returnCode: number,
    headers?: IncomingHttpHeaders
  ): SimpleResponseInterface {
    this.initialized = true;
    this.status = "receiving";
    this.returnCode = returnCode;
    if (typeof headers !== "undefined") {
      this.headers = headers;
    }
    return this;
  }

  /**
   * This function is to be called by the callback registered with the underlying request object to aggregate
   * data from a stream response. In the case of non-streamed responses (as in browser XHR), the function can
   * simply be called once and then the "end" function called.
   */
  public aggregateData(data: string): SimpleResponseInterface {
    this.data += data;
    return this;
  }

  /**
   * This function is to be called when the last of the data has been collected and the response can be considered
   * complete. In the case of browser XHR, this will be called immediately following aggregateData.
   */
  public end(): SimpleResponseInterface {
    let t: SimpleResponseInterface = this;
    this.status = "complete";
    if (this.handlers.load) {
      this.handlers.load.forEach(function(val: SimpleResponseLoadHandler) {
        val(t);
      });
    }
    return this;
  }

  /**
   * Register a listener for this response.
   *
   * At the time of this writing, this is used exclusively to handle onload events, allowing us to trigger
   * a callback when all data has been loaded.
   */
  public on(
    ev: "load",
    cb: (res: SimpleResponseInterface) => void
  ): SimpleResponseInterface {
    if (ev === "load") {
      this.handlers.load.push(cb);
      if (this.status === "complete") {
        cb(this);
      }
    } else {
      throw new Error("Don't know how to handle events of type " + ev);
    }
    return this;
  }

  // Public Getters

  /**
   * Get the response status (waiting, receiving, complete)
   */
  public getStatus(): SimpleResponseStatus {
    return this.status;
  }

  /**
   * Get the status code from the response.
   *
   * Throws an exception if the response has not been properly initialized
   */
  public getResponseCode(): number {
    if (!this.initialized) {
      throw Error(
        "This response has not yet been initialized! This is probably a programmer error. SimpleResponses need to be initialized with status code and response headers as soon as the underlying response object makes those properties available."
      );
    }
    return this.returnCode;
  }

  /**
   * Get the headers for this response.
   *
   * Throws an exception if the response has not been properly initialized
   */
  public getHeaders(): IncomingHttpHeaders {
    if (!this.initialized) {
      throw Error(
        "This response has not yet been initialized! This is probably a programmer error. SimpleResponses need to be initialized with status code and response headers as soon as the underlying response object makes those properties available."
      );
    }
    return this.headers;
  }

  /**
   * Get the string body from this response.
   *
   * Throws an exception if the response has not been properly initialized or if it's still receiving data
   */
  public getBody(): string {
    if (!this.initialized) {
      throw Error(
        "This response has not yet been initialized! This is probably a programmer error. SimpleResponses need to be initialized with status code and response headers as soon as the underlying response object makes those properties available."
      );
    } else if (this.status === "receiving") {
      throw Error(
        "Can't get data; this response is still receiving data from the server."
      );
    }
    return this.data;
  }
}
