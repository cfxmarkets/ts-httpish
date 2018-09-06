import { IncomingHttpHeaders, OutgoingHttpHeaders, ClientRequest } from "http";

export type Verb = "GET" | "POST" | "PATCH" | "DELETE";

/**
 * Http Requests contain the connection configuration along with the request configuration
 */
export interface HttpRequestArgs {
  protocol: string;
  hostname: string;
  port?: number | string;
  headers?: OutgoingHttpHeaders;
  method: string;
  path: string;
}

/**
 * Socket requests have a subset of the arguments that http requests have
 */
export interface SocketRequestArgs {
  socketPath: string;
  method: Verb;
  path: string;
}

/**
 * SimpleRequestInterface is a simplification of https://nodejs.org/api/http.html#http_http_request_options_callback
 * designed to allow for a unified abstraction between node and browser environments and http and socket requests.
 */
export interface SimpleRequestInterface {
  send(payload?: string): SimpleRequestInterface;
  on(
    ev: "load",
    cb: (res: SimpleResponseInterface) => void
  ): SimpleRequestInterface;
}

/**
 * A SimpleResponseInterface allows us to handle http requests and socket requests in node or the browser in the same
 * way.
 *
 * It is intended to be the counterpart of a SimpleRequest, and should be created at the same time. Then, as the request
 * data returns (first status and headers, then body), the SimpleResponse will be initialized and the data aggregated in
 * in it.
 */
export type SimpleResponseStatus = "waiting" | "receiving" | "complete";
export interface SimpleResponseInterface {
  init(
    returnCode: number,
    headers?: IncomingHttpHeaders
  ): SimpleResponseInterface;
  aggregateData(data: string): SimpleResponseInterface;
  end(): SimpleResponseInterface;
  getStatus(): SimpleResponseStatus;
  getResponseCode(): number;
  getHeaders(): IncomingHttpHeaders;
  getBody(): string;
  on(
    ev: "load",
    cb: (res: SimpleResponseInterface) => void
  ): SimpleResponseInterface;
}

export interface SimpleResponseLoadHandler {
  (res: SimpleResponseInterface): void;
}

/**
 * A StubRequest extends node's native ClientRequest and adds some methods to make it easier to test.
 */
export interface StubRequest extends ClientRequest {
  beginReturn(code: number, headers: IncomingHttpHeaders): void;
  pushData(chunk: string): void;
  finishRequest(): void;
}
