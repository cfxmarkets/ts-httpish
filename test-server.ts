import * as net from "net";

let s: net.Server = net.createServer();
s.setNoDelay(true);
s.listen("/tmp/app.sock", () => {
  console.log("Server listening");
});

let buffer: string = "";
s.on("connection", function(socket: net.Socket) {
  socket.on("data", function(data:string) {
    buffer += data.toString();
    let records: string[] = buffer.split("\0");
    let last: string|undefined = records.pop();
    buffer = (typeof last === "string") ? last : "";
    for (let i = 0; i < records.length; i++) {
      console.log("Received data: ", records[i]);
      socket.write(records[i]);
    }
  });
});
s.on("error", function(err: Error) {
  console.log("SOCKET ERROR: ", err);
});
s.on("close", function(hadError: boolean) {
  if (hadError) {
    console.log("Closed with error");
  } else {
    console.log("Closed without error");
  }
});
s.on("connect", function() {
  console.log("Connected");
});
s.on("drain", function() {
  console.log("buffer emptied");
});
s.on("end", function() {
  console.log("ended");
});
s.on("lookup", function() {
  console.log("hostname resolved");
});
s.on("timeout", function() {
  console.log("Timed out");
});
s.on("ready", function() {
  console.log("Ready for writing");
});

