const INITIAL_INITIAL_MEMORY = 16777216
const WASM_PAGE_SIZE = 65536
const TOTAL_MEMORY = INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE
const MEMORY_BASE = 3632

module.exports = class Heap {
  constructor () {
    this.memory = new WebAssembly.Memory({
      initial: TOTAL_MEMORY,
      maximum: TOTAL_MEMORY
    })
    this.buffer = Buffer.from(this.memory.buffer)

    this._nextAddress = MEMORY_BASE
  }

  alloc (length) {
    const address = this._nextAddress
    this._nextAddress = address + length
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

  clear () {
    this._nextAddress = MEMORY_BASE
  }

  copy (to, address, len) {
    for (let i = 0; i < len; i++) {
      to[i] = this.buffer[address + i]
    }
  }
}
