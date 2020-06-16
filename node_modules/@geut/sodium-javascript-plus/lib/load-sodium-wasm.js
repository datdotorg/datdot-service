const modules = require('../sodium-modules')
const createImport = require('./create-import')
const loadSync = require('./load-sync')

const binaries = {
  core_hchacha20: Buffer.from(require('../build/core_hchacha20'), 'base64'),
  stream_chacha20: Buffer.from(require('../build/stream_chacha20'), 'base64'),
  onetimeauth_poly1305: Buffer.from(require('../build/onetimeauth_poly1305'), 'base64'),
  aead_chacha20poly1305: Buffer.from(require('../build/aead_chacha20poly1305'), 'base64'),
  aead_xchacha20poly1305: Buffer.from(require('../build/aead_xchacha20poly1305'), 'base64'),
  crypto_kx: Buffer.from(require('../build/crypto_kx'), 'base64')
}

function loadSodiumWasm (sodiumJS, heap) {
  const sodium = {
    _original: {}
  }

  const importObj = createImport(sodiumJS, heap)
  const { env } = importObj

  modules.forEach(({ name, functions = [], constants = {} }) => {
    try {
      const binary = binaries[name]
      // const binary = require('fs').readFileSync(`${__dirname}/../build/${name}.wasm`)
      const wasmModule = loadSync(binary, importObj)

      functions.forEach(fn => {
        sodium[fn] = wasmModule[fn]
        env[fn] = wasmModule[fn]
        sodium._original[fn] = wasmModule[fn]
      })

      Object.keys(constants).forEach(constant => {
        sodium[constants[constant]] = wasmModule[constant]()
        sodiumJS[constants[constant]] = wasmModule[constant]()
        env[constant] = wasmModule[constant]
      })
    } catch (err) {
      throw new Error(`Error loading: ${name} - ${err.message}`)
    }
  })

  sodiumJS.sodium_memzero = (buffer) => {
    if (!(buffer instanceof Uint8Array)) {
      throw new Error('Only Uint8Array instances accepted')
    }
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = 0
    }
  }

  sodiumJS.sodium_memcmp = (b1, b2) => {
    if (!(b1 instanceof Uint8Array && b2 instanceof Uint8Array)) {
      throw new Error('Only Uint8Array instances can be compared')
    }
    if (b1.length !== b2.length) {
      throw new Error(
        'Only instances of identical length can be compared'
      )
    }
    for (var d = 0 | 0, i = 0 | 0, j = b1.length; i < j; i++) {
      d |= b1[i] ^ b2[i]
    }
    return d === 0
  }

  sodiumJS.sodium_is_zero = (buffer) => {
    if (!(buffer instanceof Uint8Array)) {
      throw new TypeError('Only Uint8Array instances can be checked')
    }
    var d = 0 | 0
    for (var i = 0 | 0, j = buffer.length; i < j; i++) {
      d |= buffer[i]
    }
    return d === 0
  }

  sodiumJS.sodium_increment = (buffer) => {
    if (!(buffer instanceof Uint8Array)) {
      throw new TypeError('Only Uint8Array instances can be incremented')
    }
    var c = 1 << 8
    for (var i = 0 | 0, j = buffer.length; i < j; i++) {
      c >>= 8
      c += buffer[i]
      buffer[i] = c & 0xff
    }
  }

  sodiumJS.sodium_free = () => {} // noop
  sodiumJS.crypto_stream_xor_STATEBYTES = 136

  // some functions in C expect unsigned long long types (u64 in wasm)
  // because js cannot understand that type we provide bindings to cast u64 into u32
  const bindingC = loadSync(Buffer.from(require('../build/binding-c'), 'base64'), {
    env: {
      memory: heap.memory,
      abort: (msg, file, line, colm) => {
        throw new Error(`bindingC abort line=${line} colm=${colm}`)
      }
    },
    'sodium-c': sodium._original
  })

  heap.setRuntime(bindingC)

  sodium.crypto_aead_chacha20poly1305_ietf_encrypt = bindingC.crypto_aead_chacha20poly1305_ietf_encrypt
  sodium.crypto_aead_chacha20poly1305_ietf_decrypt = bindingC.crypto_aead_chacha20poly1305_ietf_decrypt
  sodium.crypto_aead_xchacha20poly1305_ietf_encrypt = bindingC.crypto_aead_xchacha20poly1305_ietf_encrypt
  sodium.crypto_aead_xchacha20poly1305_ietf_decrypt = bindingC.crypto_aead_xchacha20poly1305_ietf_decrypt

  return sodium
}

module.exports = loadSodiumWasm
