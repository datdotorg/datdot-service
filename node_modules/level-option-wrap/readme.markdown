# level-option-wrap

wrap `opts.{{g,l}{t,e,te},start,end}` arguments with functions

With this package you can expose familiar `db.createReadStream()` options like
from leveldb but without leaking information about your internal key
representations.

[![build status](https://secure.travis-ci.org/substack/level-option-wrap.png)](http://travis-ci.org/substack/level-option-wrap)

# example

For example, suppose you have a list of users using a bytewise keyEncoding and
you want to let api consumers constrain the output. If you pass through
`opts.gt`/`opts.lt` arguments directly, you must communicate to api consumers
the internal structure of your keys, which breaks encapsulation.

However, implementing `opts.{{g,l}{t,e,te},start,end}` yourself inside your library
or application code is madness! This library lets you do that: 

``` js
var wrap = require('level-option-wrap');
var minimist = require('minimist');
var defined = require('defined');

var argv = minimist(process.argv.slice(2));
var opts = wrap(argv, {
    gt: function (x) { return [ 'user', defined(x, null) ] },
    lt: function (x) { return [ 'user', defined(x, undefined) ] }
});
console.log(opts);
```

Now to get all users `>= 'mafintosh'` and `< 'maxogden'` we can just do:

```
$ node example/prefix.js --gte mafintosh --lt maxogden
{ gte: [ 'user', 'mafintosh' ], lt: [ 'user', 'maxogden' ] }
```

This works even though we only specified `gt` and `lt` as our prefix functions,
because narrower ranges take precedence.

# methods

``` js
var wrap = require('level-option-wrap')
```

## var newOpts = wrap(opts, fns)

Generate `newOpts` given some leveldb createReadStream-style options `opts` and
an object `fns` mapping key contraints `{g,l}{t,e,te}` to functions. Each
function gets the relevant constraint (whether exclusive or not) and should
return the new key bound. Exclusivity for each key is determined by the
corresponding `opts` key.

`opts.limit` values will be passed through and can be modified by defining an
`fns.limit(n)` function.

# install

With [npm](https://npmjs.org) do:

```
npm install level-option-wrap
```

# license

MIT
