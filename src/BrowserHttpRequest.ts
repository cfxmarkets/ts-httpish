import {
  SimpleRequestInterface,
  SimpleResponseInterface,
  HttpRequestArgs
} from "./Types";
import { SimpleResponse } from "./SimpleResponse";

export class BrowserHttpRequest implements SimpleRequestInterface {
  protected req: XMLHttpRequest;
  protected res: SimpleResponseInterface;

  public constructor(opts: HttpRequestArgs) {
    this.res = new SimpleResponse();

    let uri: string = opts.protocol + "//" + opts.hostname;
    if (opts.port) {
      uri += ":" + opts.port;
    }
    uri += opts.path;

    this.req = new XMLHttpRequest();
    this.req.open(opts.method, uri, true);

    // Add headers
    if (opts.headers) {
      for (let key in opts.headers) {
        let header: string | number | string[] | undefined = opts.headers[key];
        if (Array.isArray(header)) {
          header = header.join(",");
        } else if (typeof header === "undefined") {
          header = "";
        } else {
          header = header.toString();
        }
        this.req.setRequestHeader(key, header as string);
      }
    }

    let t: BrowserHttpRequest = this;

    // Now add a load listener
    this.req.addEventListener("readystatechange", (ev: Event) => {
      let req: XMLHttpRequest = t.req;

      // Initialize the response when we get the headers
      if (req.readyState === req.HEADERS_RECEIVED) {
        let rawHeaders: string[] = req
          .getAllResponseHeaders()
          .trim()
          .split(/[\r\n]+/);
        let headers: { [key: string]: string } = {};
        rawHeaders.forEach(function(line: string) {
          let parts: string[] = line.split(": ");
          if (parts.length < 2) {
            throw new Error("Invalid header '"+line+"'");
          } else {
            let key: string = parts.shift() as string;
            let value: string = parts.join(": ");
            headers[key] = value;
          }
        });

        t.res.init(req.status, headers);

        // Then terminate it when the rest is in
      } else if (req.readyState === req.DONE) {
        t.res.aggregateData(req.responseText).end();
      }
    });
  }

  public send(payload?: string): SimpleRequestInterface {
    if (payload) {
      this.req.send(payload);
    } else {
      this.req.send();
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
