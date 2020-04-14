const loadSync = require('./load-sync')

module.exports = (sodiumJS, heap) => {
  const blakeStates = new Map()

  const bindingJS = loadSync(Buffer.from(require('../build/binding-js'), 'base64'), {
    'sodium-js': {
      crypto_generichash (out, outlen, inn, innlen, key, keylen) {
        let keyBuffer
        if (keylen !== 0) {
          keyBuffer = heap.slice(key, keylen)
        }
        sodiumJS.crypto_generichash(
          heap.slice(out, outlen),
          heap.slice(inn, innlen),
          keyBuffer
        )
        return 0
      },
      crypto_generichash_update (state, key, keylen) {
        blakeStates.get(state).update(heap.slice(key, keylen))
        return 0
      }
    }
  })

  return {
    env: {
      memory: heap.memory,
      crypto_verify_16 (x, y) {
        const n = 16
        const buf = heap.buffer
        let i; let d = 0
        for (i = 0; i < n; i++) d |= buf[x + i] ^ buf[y + i]
        return (1 & ((d - 1) >>> 8)) - 1
      },
      sodium_misuse () {
        console.error('sodium_misuse')
      },
      sodium_memzero (address, length) {
        const buffer = heap.slice(address, length)
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] = 0
        }
      },
      randombytes_buf (address, length) {
        const buffer = heap.slice(address, length)
        sodiumJS.randombytes_buf(buffer)
      },
      crypto_scalarmult (q, n, p) {
        return sodiumJS.crypto_scalarmult(
          heap.slice(q, sodiumJS.crypto_scalarmult_BYTES),
          heap.slice(n, sodiumJS.crypto_scalarmult_SCALARBYTES),
          heap.slice(p, sodiumJS.crypto_scalarmult_BYTES)
        )
      },
      crypto_scalarmult_base (q, n) {
        return sodiumJS.crypto_scalarmult_base(
          heap.slice(q, sodiumJS.crypto_scalarmult_BYTES),
          heap.slice(n, sodiumJS.crypto_scalarmult_SCALARBYTES)
        )
      },
      crypto_generichash_init (state, key, keylen, outlen) {
        let keyBuffer
        if (keylen !== 0) {
          keyBuffer = heap.slice(key, keylen)
        }
        blakeStates.set(state, sodiumJS.crypto_generichash_instance(keyBuffer, outlen))
        return 0
      },
      crypto_generichash_final (state, out, outlen) {
        blakeStates.get(state).final(heap.slice(out, outlen))
        blakeStates.delete(state)
        return 0
      },

      // BINDING-JS for i64 types
      // the @assemblyscript/loader override the original methods (we don't want to use those here)
      crypto_generichash: bindingJS.crypto_generichash,
      crypto_generichash_update: bindingJS.crypto_generichash_update
    },
    wasi_snapshot_preview1: {
      proc_exit (code) {
        process.exit(code)
      }
    }
  }
}
