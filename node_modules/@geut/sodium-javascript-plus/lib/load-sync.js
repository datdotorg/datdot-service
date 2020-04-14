module.exports = function loadSync (binary, importObj) {
  const instance = new WebAssembly.Instance(new WebAssembly.Module(binary), importObj)
  return instance.exports
}
