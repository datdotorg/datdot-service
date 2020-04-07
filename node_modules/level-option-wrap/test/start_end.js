var wrap = require('../');
var test = require('tape');
var defined = require('defined');

test('start/end prefix', function (t) {
    t.plan(1);
    var params = { gt: 'sub', lt: 'sub\uffff' };
    var opts = wrap(params, {
        start: function (x) { return [ 'post', defined(x, null) ] },
        end: function (x) { return [ 'post', defined(x, undefined) ] }
    });
    t.deepEqual(opts, {
        gt: [ 'post', 'sub' ],
        lt: [ 'post', 'sub\uffff' ]
    });
});

test('start/end opts', function (t) {
    t.plan(1);
    var params = { start: 'sub', end: 'sub\uffff' };
    var opts = wrap(params, {
        gt: function (x) { return [ 'post', defined(x, null) ] },
        lt: function (x) { return [ 'post', defined(x, undefined) ] }
    });
    t.deepEqual(opts, {
        gte: [ 'post', 'sub' ],
        lte: [ 'post', 'sub\uffff' ]
    });
});
