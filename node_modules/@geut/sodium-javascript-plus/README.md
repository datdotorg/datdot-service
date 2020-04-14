# sodium-javascript-plus

[![Build Status](https://travis-ci.com/geut/sodium-javascript-plus.svg?branch=master)](https://travis-ci.com/geut/sodium-javascript-plus)
[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> **Experimental** :microscope: sodium-javascript with support for xchacha20 and kx

## <a name="install"></a> Install

```
$ npm install @geut/sodium-javascript-plus
```

## <a name="usage"></a> Usage

```javascript
const message = Buffer.from('some secret message')
const ad = Buffer.from('50515253c0c1c2c3c4c5c6c7', 'hex')
const nonce = Buffer.from('404142434445464748494a4b4c4d4e4f5051525354555657', 'hex')
const key = Buffer.from('808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f', 'hex')
const cipher = Buffer.alloc(message.length + sodium.crypto_aead_xchacha20poly1305_ietf_ABYTES)

sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
  cipher,
  message,
  ad,
  null,
  nonce,
  key
)

const decrypted = Buffer.alloc(message.length)

sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
  decrypted,
  null,
  cipher,
  ad,
  nonce,
  key
)

console.log(message.equals(decrypted), 'same message')
```

### You can extend your sodium instance

```javascript
const extend = require('@geut/sodium-javascript-plus/extend')
const sodium = extend(require('sodium-javascript'))

// ...
```

## <a name="issues"></a> Issues

:bug: If you found an issue we encourage you to report it on [github](https://github.com/geut/sodium-javascript-plus/issues). Please specify your OS and the actions to reproduce it.

## <a name="contribute"></a> Contributing

:busts_in_silhouette: Ideas and contributions to the project are welcome. You must follow this [guideline](https://github.com/geut/sodium-javascript-plus/blob/master/CONTRIBUTING.md).

## License

MIT © A [**GEUT**](http://geutstudio.com/) project
