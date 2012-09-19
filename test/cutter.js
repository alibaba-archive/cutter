var should = require('should');
var Cutter = require('../');

function getLength(data) {
  return data[0];
}

describe('Cutter', function() {
  var cutter;
  before(function() {
    cutter = Cutter.create(1, getLength);
  });

  it('cutter buf ok', function() {
    var buf = new Buffer(10);
    buf[0] = 10;
    var times = 0;
    cutter.on('packet', function(packet) {
      packet.length.should.equal(10);
      times++;
    });
    for (var i = 0; i < 10; ++i) {
      cutter.emit('data', buf);
    }
    times.should.equal(10);
  });

  it('cutter buf head body ok', function() {
    var head = new Buffer(1);
    head[0] = 10;
    var body = new Buffer(9);
    var times = 0;
    cutter.on('packet', function(packet) {
      packet.length.should.equal(10);
      times++;
    });
    for (var i = 0; i < 10; ++i) {
      cutter.emit('data', head);
      cutter.emit('data', body);
    }
    times.should.equal(10);
  });

  it('cutter buf content ok')
});