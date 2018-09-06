import * as net from "net";

//let s: net.Socket = net.createConnection("/srv/local/dev.apis.cfx.private/app.sock");
let s: net.Socket = net.createConnection("/tmp/app.sock");

let reqs: string[] = [
  "GET\u001e/brokerage/v2/assets/SCI\0",
  "GET\u001e/brokerage/v2/assets/BAQUA\0",
  "GET\u001e/brokerage/v2/assets/BIOLIFE4D\0",
  "GET\u001e/brokerage/v2/assets/INVT001\0",
  "GET\u001e/brokerage/v2/assets/BCAP\0",
];

let currentRequest: number = 0;
let outstandingCalls: number = reqs.length;

let readCount = 0;
s.on("data", function(data:string) {
  data = data.toString();
  if (data.substring(data.length - 1) === "\0") {
    data = data.substring(0, data.length - 1);
  }
  console.log(++readCount, data);
  outstandingCalls--;
  /*
  let decrement: boolean = false;
  if (data.substring(data.length - 1) === "\0") {
    data = data.substring(0, data.length - 1);
    decrement = true;
  }
  let spl: string[] = data.split("\n");
  console.log(++readCount, spl[0], JSON.stringify(JSON.parse(spl[1]), null, 2));
  if (decrement) {
    outstandingCalls--;
  }
   */
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
  write();
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

/*
let j: any = setInterval(function() {
  if (currentRequest >= reqs.length) {
    clearInterval(j);
    return;
  }

  if (paused) {
    return;
  }

  if (s.write(reqs[currentRequest])) {
    console.log("Wrote " + reqs[currentRequest] + " (" + s.bytesWritten + " bytes written)");
    currentRequest++;
  } else {
    paused = true;
  }
}, 1);
 */
function write() {
  while(currentRequest < reqs.length && s.write(reqs[currentRequest])) {
    console.log("Wrote " + reqs[currentRequest] + " (" + s.bytesWritten + " bytes written)");
    currentRequest++;
  } 
}

write();

// Make sure to clean up
let i: any = setInterval(function() {
  if (outstandingCalls < 1) {
    console.log("Destroying");
    s.destroy();
    clearInterval(i);
  }
}, 50);

