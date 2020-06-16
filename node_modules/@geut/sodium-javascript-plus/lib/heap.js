const INITIAL_INITIAL_MEMORY = 16777216
const WASM_PAGE_SIZE = 65536
const TOTAL_MEMORY = INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE

module.exports = class Heap {
  constructor () {
    this.memory = new WebAssembly.Memory({
      initial: TOTAL_MEMORY
    })
    this._toRelease = []
    this._buffer = Buffer.from(this.memory.buffer)
  }

  get buffer () {
    if (this._buffer.length === 0) {
      this._buffer = Buffer.from(this.memory.buffer)
    }
    return this._buffer
  }

  setRuntime (runtime) {
    this._runtime = runtime
  }

  alloc (length) {
    const address = this._runtime.__retain(this._runtime.__alloc(length))
    this._toRelease.push(address)
    return address
  }

  set (bytes) {
    const address = this.alloc(bytes.length)
    this.buffer.set(bytes, address)
    return address
  }

  slice (start, end) {
    return this.buffer.slice(start, start + end)
  }

  release () {
    const toRelease = this._toRelease
    const len = toRelease.length
    for (let i = 0; i < len; i++) {
      this._runtime.__release(toRelease[i])
    }
    this._toRelease = []
  }

  copy (to, address, len) {
    for (let i = 0; i < len; i++) {
      to[i] = this.buffer[address + i]
    }
  }
}
