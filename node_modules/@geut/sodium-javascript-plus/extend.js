const Heap = require('./lib/heap')
const loadSodiumWasm = require('./lib/load-sodium-wasm')

module.exports = (sodiumJS) => {
  const heap = new Heap()

  const sodiumWasm = loadSodiumWasm(sodiumJS, heap)

  sodiumJS.crypto_aead_chacha20poly1305_ietf_encrypt = function (out, m, ad, nsec, nonce, key) {
    const cipherLength = m.length + sodiumJS.crypto_aead_chacha20poly1305_ietf_ABYTES
    const _out = heap.alloc(cipherLength)

    sodiumWasm.crypto_aead_chacha20poly1305_ietf_encrypt(
      _out,
      null,
      heap.set(m),
      m.length,
      ad ? heap.set(ad) : null,
      ad ? ad.length : null,
      nsec ? heap.set(nsec) : null,
      heap.set(nonce),
      heap.set(key)
    )

    heap.copy(out, _out, cipherLength)
    heap.release()
    return cipherLength
  }

  sodiumJS.crypto_aead_chacha20poly1305_ietf_decrypt = function (out, nsec, c, ad, nonce, key) {
    const messageLength = c.length - sodiumJS.crypto_aead_chacha20poly1305_ietf_ABYTES
    const _out = heap.alloc(messageLength)

    sodiumWasm.crypto_aead_chacha20poly1305_ietf_decrypt(
      _out,
      null,
      nsec ? heap.set(nsec) : null,
      heap.set(c),
      c.length,
      ad ? heap.set(ad) : null,
      ad ? ad.length : null,
      heap.set(nonce),
      heap.set(key)
    )

    heap.copy(out, _out, messageLength)
    heap.release()
    return messageLength
  }

  sodiumJS.crypto_aead_xchacha20poly1305_ietf_encrypt = function (out, m, ad, nsec, nonce, key) {
    const cipherLength = m.length + sodiumJS.crypto_aead_xchacha20poly1305_ietf_ABYTES
    const _out = heap.alloc(cipherLength)

    sodiumWasm.crypto_aead_xchacha20poly1305_ietf_encrypt(
      _out,
      null,
      heap.set(m),
      m.length,
      ad ? heap.set(ad) : null,
      ad ? ad.length : null,
      nsec ? heap.set(nsec) : null,
      heap.set(nonce),
      heap.set(key)
    )

    heap.copy(out, _out, cipherLength)
    heap.release()
    return cipherLength
  }

  sodiumJS.crypto_aead_xchacha20poly1305_ietf_decrypt = function (out, nsec, c, ad, nonce, key) {
    const messageLength = c.length - sodiumJS.crypto_aead_xchacha20poly1305_ietf_ABYTES
    const _out = heap.alloc(messageLength)

    sodiumWasm.crypto_aead_xchacha20poly1305_ietf_decrypt(
      _out,
      null,
      nsec ? heap.set(nsec) : null,
      heap.set(c),
      c.length,
      ad ? heap.set(ad) : null,
      ad ? ad.length : null,
      heap.set(nonce),
      heap.set(key)
    )

    heap.copy(out, _out, messageLength)
    heap.release()
    return messageLength
  }

  sodiumJS.crypto_kx_keypair = function (pk, sk) {
    const _pk = heap.alloc(pk.length)
    const _sk = heap.alloc(pk.length)

    sodiumWasm.crypto_kx_keypair(
      _pk,
      _sk
    )

    heap.copy(pk, _pk, pk.length)
    heap.copy(sk, _sk, sk.length)
    heap.release()
  }

  sodiumJS.crypto_kx_seed_keypair = function (pk, sk, seed) {
    const _pk = heap.alloc(pk.length)
    const _sk = heap.alloc(pk.length)

    sodiumWasm.crypto_kx_seed_keypair(
      _pk,
      _sk,
      heap.set(seed)
    )

    heap.copy(pk, _pk, pk.length)
    heap.copy(sk, _sk, sk.length)
    heap.release()
  }

  sodiumJS.crypto_kx_client_session_keys = function (clientRx, clientTx, clientPk, clientSk, serverPk) {
    const _clientRx = heap.alloc(clientRx.length)
    const _clientTx = heap.alloc(clientTx.length)

    sodiumWasm.crypto_kx_client_session_keys(
      _clientRx,
      _clientTx,
      heap.set(clientPk),
      heap.set(clientSk),
      heap.set(serverPk)
    )

    heap.copy(clientRx, _clientRx, clientRx.length)
    heap.copy(clientTx, _clientTx, clientTx.length)
    heap.release()
  }

  sodiumJS.crypto_kx_server_session_keys = function (serverRx, serverTx, serverPk, serverSk, clientPk) {
    const _serverRx = heap.alloc(serverRx.length)
    const _serverTx = heap.alloc(serverTx.length)

    sodiumWasm.crypto_kx_server_session_keys(
      _serverRx,
      _serverTx,
      heap.set(serverPk),
      heap.set(serverSk),
      heap.set(clientPk)
    )

    heap.copy(serverRx, _serverRx, serverRx.length)
    heap.copy(serverTx, _serverTx, serverTx.length)
    heap.release()
  }

  return sodiumJS
}
