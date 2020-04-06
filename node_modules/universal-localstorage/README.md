# universal-localstorage
localstorage that works in node and the browser

[![Build Status](https://img.shields.io/codeship/3bfffde0-1184-0133-460e-76104088809d.svg)](https://codeship.com/projects/92304)
[![Dependency Status](https://img.shields.io/david/eddiemoore/universal-localstorage.svg)](https://david-dm.org/eddiemoore/universal-localstorage)
[![Dev Dependency Status](https://img.shields.io/david/dev/eddiemoore/universal-localstorage.svg)](https://david-dm.org/eddiemoore/universal-localstorage#info=devDependencies)
[![Code Coverage](https://img.shields.io/codecov/c/github/eddiemoore/universal-localstorage.svg)](https://codecov.io/github/eddiemoore/universal-localstorage)

On node it will use [node-localstorage](https://www.npmjs.com/package/node-localstorage).
On web if localstorage is available it will use the browsers version of localstorage.
If the browser doesn't have localstorage it will use [Remy Sharp's pollyfill](https://gist.github.com/remy/350433)


## Testing
```shell
npm test
```
