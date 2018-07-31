import {
  SimpleRequestInterface,
  SimpleResponseInterface,
  SocketRequestArgs
} from "./Types";
import { SimpleResponse } from "./SimpleResponse";
import * as net from "net";

export abstract class AbstractSocketRequest implements SimpleRequestInterface {
  protected res: SimpleResponseInterface;
  protected socket: net.Socket;

  public constructor(opts: SocketRequestArgs, socket: net.Socket) {
    this.socket = socket;
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
      payload = '\0';
    } else {
      payload += '\0';
    }
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

  protected abstract readData(data: string): void;

  protected abstract handleConnectionError(data: string): void;

  protected end(): void {
    this.socket.removeListener("data", this.readData);
    this.socket.removeListener("error", this.handleConnectionError);
    this.res.end();
  }
}
