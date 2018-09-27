import {
  SimpleRequestInterface,
  SimpleResponseInterface,
  HttpRequestArgs
} from "./Types";
import { SimpleResponse } from "./SimpleResponse";
import * as http from "http";
import * as https from "https";

export class NodeHttpRequest implements SimpleRequestInterface {
  protected req: http.ClientRequest;
  protected res: SimpleResponseInterface;

  public constructor(opts: HttpRequestArgs) {
    this.res = new SimpleResponse();

    let createRequest: (
      options: http.RequestOptions | string | URL,
      callback?: (res: http.ClientResponse) => void
    ) => http.ClientRequest;
    if (opts.protocol && opts.protocol === "https:") {
      createRequest = https.request;
    } else {
      createRequest = http.request;
    }

    this.req = createRequest(opts, (res: http.ClientResponse) => {
      this.res.init(res.statusCode || -1, res.headers);
      res.on("data", chunk => {
        this.res.aggregateData(chunk.toString());
      });
      res.on("end", () => {
        this.res.end();
      });
    });
  }

  public send(payload?: string): SimpleRequestInterface {
    if (payload) {
      // Calling end instead of write is necessary for making node set the Content-Length header
      // instead of using chunked encoding (which is incompatible with PHP over FCGI)
      this.req.end(payload);
    } else {
      this.req.end();
    }
    return this;
  }

  public on(
    ev: "load",
    cb: (res: SimpleResponseInterface) => void
  ): SimpleRequestInterface {
    this.res.on(ev, cb);
    return this;
  }
}
