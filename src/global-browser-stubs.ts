(global as any).btoa = function(ascii: string): string {
  return "passed '" + ascii + "' to btoa";
};
(global as any).atob = function(b64: string): string {
  return "passed '" + b64 + "' to atob";
};
(global as any).XMLHttpRequest = function() {
  this.method = null;
  this.url = null;
  this.requestHeaders = [];
  this.async = true;
  this.status = null;
  this.handlers = {
    "readystatechange": []
  };

  this.UNSENT = 0;
  this.OPENED = 1;
  this.HEADERS_RECEIVED = 2;
  this.LOADING = 3;
  this.DONE = 4;
  this.readyState = this.UNSENT;

  this.responseText = "";
};
(global as any).XMLHttpRequest.prototype = {
  open: function(method: string, url: string, async: boolean = true): void {
    this.method = method;
    this.url = url;
    this.async = async;
  },

  setRequestHeader: function(key: string, val: string): void {
    this.requestHeaders[key] = val;
  },

  send: function(payload?: string): void {
    this.responseText = payload;
  },

  addEventListener: function(ev: "readystatechange", cb: () => void): void {
    this.handlers[ev].push(cb);
  },

  getAllResponseHeaders: function(): string {
    let headers: string = "";
    for (let key in this.requestHeaders) {
      headers += key + ": " + this.requestHeaders[key] + "\r\n";
    }
    return headers;
  },



  // Testing methods

  changeState: function(state: 0 | 1 | 2 | 3 | 4): void {
    this.readyState = state;
    this.handlers.readystatechange.forEach(function(val: () => void) {
      val();
    });
  },

  setStatusCode: function(code: number): void {
    this.status = code;
  },

  setResponseText: function(text: string): void {
    this.responseText = text;
  }
};


