var wrap = require('../');
var test = require('tape');
var defined = require('defined');

test('exclusive ranges', function (t) {
    t.plan(1);
    var params = { gt: 'sub', lt: 'sub\uffff' };
    var opts = wrap(params, {
        gte: function (x) { return [ 'post', defined(x, null) ] },
        lte: function (x) { return [ 'post', defined(x, undefined) ] }
    });
    t.deepEqual(opts, {
        gt: [ 'post', 'sub' ],
        lt: [ 'post', 'sub\uffff' ]
    });
});
