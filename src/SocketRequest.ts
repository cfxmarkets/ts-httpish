import {
  SimpleRequestInterface,
  SimpleResponseInterface,
  SocketRequestArgs
} from "./Types";
import { SimpleResponse } from "./SimpleResponse";
import * as net from "net";
import { SocketConnectionError } from "./Errors";

export class SocketRequest implements SimpleRequestInterface {
  protected res: SimpleResponseInterface;
  protected socket: net.Socket;
  protected config: SocketRequestArgs;
  protected socketRetries: number = 0;
  protected errorRetries: number = 0;
  protected payload: string|null = null;
  private resultBuffer: string = "";

  public constructor(opts: SocketRequestArgs) {
    this.config = opts;
    this.res = new SimpleResponse();

    this.readData = this.readData.bind(this);
    this.handleConnectionError = this.handleConnectionError.bind(this);

    this.socket = this.newSocket();
  }

  public send(payload?: string): SimpleRequestInterface {
    if (!payload) {
      payload = "\0";
    } else {
      payload = "\u001e" + payload + "\0";
    }
    payload = this.config.method + "\u001e" + this.config.path + payload;
    this.payload = payload;
    this.socket.write(payload);
    return this;
  }

  public on(
    ev: "load",
    cb: (res: SimpleResponseInterface) => void
  ): SimpleRequestInterface {
    this.res.on(ev, cb);
    return this;
  }

  protected readData(sockBuffer: string): void {
    let records = this.getRecords(sockBuffer);

    // We should only be receiving one record per request, so get it and then push other records back onto the socket
    if (records.length > 0) {
      let parsed: string[] = (records.shift() as string).split("\n");

      // Put the rest back
      if (records.length > 0) {
        this.socket.unshift(records.join("\0") + "\0");
      }

      // If the response is in waiting state, then the first line is the response code with which to initialize it
      if (this.res.getStatus() === "waiting") {
        const firstLine = parsed.shift();
        if (firstLine) {
          const returnCode: number = +firstLine.trim();
          if (returnCode === 0) {
            throw new Error("Socket protocol error: Should have returned status code as first line, but didn't. (Returned '" + firstLine + "' instead.)");
          }
          this.res.init(returnCode, {});
        }
      }

      let data: string = parsed.join("\n");
      this.res.aggregateData(data);
      this.end();
    }
  }

  protected newSocket(): net.Socket {
    const socket = net.createConnection(this.config.socketPath);
    socket.on("data", this.readData);
    socket.on("error", this.handleConnectionError);
    return socket;
  }

  private getRecords(sockBuffer: string): string[] {
    let buffer = this.resultBuffer + sockBuffer.toString();
    let records: string[] = buffer.split("\0");
    let last: string|undefined = records.pop();
    this.resultBuffer = (typeof last === "string") ? last : "";
    return records;
  }

  protected handleConnectionError(e: NodeJS.ErrnoException): void {
    const t = this;
    const retryDelay = e.code === "EAGAIN" ? 100 : 2000;
    const maxRetries = e.code === "EAGAIN" ? (this.config.maxRetries || 1000) : 120;
    const socketRetries = e.code === "EAGAIN" ? "socketRetries" : "errorRetries";
    if (t[socketRetries] < maxRetries) {
      this.socket.destroy();
      setTimeout(function() {
        t.socket = t.newSocket();
        t[socketRetries]++;
        if (t.payload) {
          t.socket.write(t.payload);
        }
      }, this.config.retryDelay || retryDelay);
    } else {
      throw new SocketConnectionError("Socket connection failed after " + t[socketRetries] + " retries. Error: " + e);
    }
  }

  protected end(): void {
    this.socket.destroy();
    this.res.end();
  }
}
