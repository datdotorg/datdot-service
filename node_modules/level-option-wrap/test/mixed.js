var wrap = require('../');
var test = require('tape');
var defined = require('defined');

test('mixed gte/lt', function (t) {
    t.plan(1);
    var params = { gte: 'sub', lt: 'sub\uffff' };
    var opts = wrap(params, {
        gt: function (x) { return [ 'post', defined(x, null) ] },
        lt: function (x) { return [ 'post', defined(x, undefined) ] }
    });
    t.deepEqual(opts, {
        gte: [ 'post', 'sub' ],
        lt: [ 'post', 'sub\uffff' ]
    });
});

test('mixed gt/lte', function (t) {
    t.plan(1);
    var params = { gt: 'sub', lte: 'sub\uffff' };
    var opts = wrap(params, {
        gt: function (x) { return [ 'post', defined(x, null) ] },
        lt: function (x) { return [ 'post', defined(x, undefined) ] }
    });
    t.deepEqual(opts, {
        gt: [ 'post', 'sub' ],
        lte: [ 'post', 'sub\uffff' ]
    });
});

test('mixed ge/lt', function (t) {
    t.plan(1);
    var params = { ge: 'sub', lt: 'sub\uffff' };
    var opts = wrap(params, {
        gt: function (x) { return [ 'post', defined(x, null) ] },
        lt: function (x) { return [ 'post', defined(x, undefined) ] }
    });
    t.deepEqual(opts, {
        gte: [ 'post', 'sub' ],
        lt: [ 'post', 'sub\uffff' ]
    });
});

test('mixed gt/le', function (t) {
    t.plan(1);
    var params = { gt: 'sub', le: 'sub\uffff' };
    var opts = wrap(params, {
        gt: function (x) { return [ 'post', defined(x, null) ] },
        lt: function (x) { return [ 'post', defined(x, undefined) ] }
    });
    t.deepEqual(opts, {
        gt: [ 'post', 'sub' ],
        lte: [ 'post', 'sub\uffff' ]
    });
});

test('mixed ge/le', function (t) {
    t.plan(1);
    var params = { ge: 'sub', le: 'sub\uffff' };
    var opts = wrap(params, {
        gt: function (x) { return [ 'post', defined(x, null) ] },
        lt: function (x) { return [ 'post', defined(x, undefined) ] }
    });
    t.deepEqual(opts, {
        gte: [ 'post', 'sub' ],
        lte: [ 'post', 'sub\uffff' ]
    });
});

test('mixed gte/lte gte/lte', function (t) {
    t.plan(1);
    var params = { gte: 'sub', lte: 'sub\uffff' };
    var opts = wrap(params, {
        gte: function (x) { return [ 'post', defined(x, null) ] },
        lte: function (x) { return [ 'post', defined(x, undefined) ] }
    });
    t.deepEqual(opts, {
        gte: [ 'post', 'sub' ],
        lte: [ 'post', 'sub\uffff' ]
    });
});
