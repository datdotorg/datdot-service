var wrap = require('../');
var test = require('tape');
var defined = require('defined');

test('no opts', function (t) {
    t.plan(1);
    var params = { gt: 'sub', lt: 'sub\uffff' };
    var opts = wrap();
    t.deepEqual(opts, {});
});
