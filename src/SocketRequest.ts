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

  public constructor(opts: SocketRequestArgs) {
    this.config = opts;
    this.socket = opts.socket;
    this.res = new SimpleResponse();

    this.readData = this.readData.bind(this);
    this.handleConnectionError = this.handleConnectionError.bind(this);

    // Handle incoming data
    this.socket.on("data", this.readData);

    // Handle errors
    this.socket.on("error", this.handleConnectionError);
  }

  public send(payload?: string): SimpleRequestInterface {
    if (!payload) {
      payload = "\0";
    } else {
      payload = "\u001e" + payload + "\0";
    }
    payload = this.config.method + "\u001e" + this.config.path + payload;
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

  protected readData(data: string): void {
    data = data.toString();
    let parsed: string[] = data.split("\n");
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
    if (parsed.length > 0) {
      data = parsed.join("\n");
      if (data.substring(data.length - 1) === "\0") {
        this.res.aggregateData(data.substring(0, data.length -1));
        this.end();
      } else {
        this.res.aggregateData(data);
      }
    }
  }

  protected handleConnectionError(data: string): void {
    throw new SocketConnectionError("Socket connection error: " + data);
  }

  protected end(): void {
    this.socket.removeListener("data", this.readData);
    this.socket.removeListener("error", this.handleConnectionError);
    this.res.end();
  }
}
