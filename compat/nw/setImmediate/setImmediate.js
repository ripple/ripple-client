if ("object" === typeof global &&
    "function" === typeof global.setImmediate &&
    "object" === typeof process &&
    "object" === typeof window &&
    "undefined" === typeof window.setImmediate) {
  // Special shim for node-webkit
  // See: https://github.com/rogerwang/node-webkit/issues/897
  window.setImmediate = global.setImmediate;
}
