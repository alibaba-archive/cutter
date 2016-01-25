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

  after(function() {
    cutter.destroy();
  });

  it('cutter buf ok', function() {
    var buf = new Buffer(10);
    buf[0] = 10;
    var times = 0;
    cutter.on('packet', function (packet) {
      packet.length.should.equal(10);
      times++;
    });
    for (var i = 0; i < 10; ++i) {
      cutter.handleData(buf);
    }
    times.should.equal(10);
    cutter.removeAllListeners('packet');
  });

  it('cutter buf head body ok', function() {
    var head = new Buffer([10]);
    var body = new Buffer(9);
    var times = 0;
    cutter.on('packet', function(packet) {
      packet.length.should.equal(10);
      times++;
    });
    for (var i = 0; i < 10; ++i) {
      cutter.handleData(head);
      cutter.handleData(body);
    }
    times.should.equal(10);
    cutter.removeAllListeners('packet');
  });

  it('cutter buf content ok', function() {
    var head = new Buffer(5);
    head[0] = 10;
    var body = new Buffer(5);
    var times = 0;
    cutter.on('packet', function (packet) {
      packet.length.should.equal(10);
      times++;
    });
    for (var i = 0; i < 10; ++i) {
      cutter.handleData(head);
      cutter.handleData(body);
    }
    times.should.equal(10);
    cutter.removeAllListeners('packet');
  });

  it('cutter buf content more complete ok', function() {
    var head = new Buffer(100);
    head[0] = 50;
    head[50] = 150;
    var body = new Buffer(200);
    body[100] = 100;
    var times = 0;
    cutter.on('packet', function(packet) {
      times++;
    });
    for (var i = 0; i < 10; ++i) {
      cutter.handleData(head);
      cutter.handleData(body);
    }
    times.should.equal(30);
    cutter.removeAllListeners('packet');
  });

  it('cutter ok when random', function(done) {
    var bufs = [];
    for (var i = 0; i < 10000; i++) {
      var len1 = Math.ceil((Math.random() * 200)) + 4;
      var len2 = Math.ceil((Math.random() * 200)) + 4;
      var buf = new Buffer(len1 + len2);
      buf[0] = len1;
      buf[len1] = len2;
      bufs.push(buf);
    }
    var times = 0;
    cutter.on('packet', function(packet) {
      packet.length.should.below(205);
      times++;
      if (times === 20000) {
        done();
      }
    });
    for (var i = 0; i < 10000; i++) {
      (function(j) {
        process.nextTick(function() {
          cutter.handleData(bufs[j]);
        });
      })(i);
    }
  });
});

describe('test in head body buffers', function() {
  function packetLength(data) {
    return 4 + data[0] + (data[1] << 8) + (data[2] << 16);
  }
  var cutter = new Cutter(4, packetLength);
  var packet = new Buffer(4 + 258);

  before(function() {
    var COM_QUERY = 3;
    var TEST_SQL = "select * from t"
    //packet: head(4)+body(1+n_string)
    packet.writeUInt8(0x02, 0);
    packet.writeUInt8(0x01, 1);
    packet.writeUInt8(0x00, 2);
    packet.writeUInt8(0x00, 3);
    packet.writeUInt8(COM_QUERY, 4);
    packet.fill(" ", 5);
    packet.write(TEST_SQL, 5);
    cutter.on('packet', function (packet) {
      var head = packet.slice(0, 4);
      var body = packet.slice(4);
      packet[0].should.equal(0x02);
      body[0].should.equal(COM_QUERY);
      packet.length.should.equal(packetLength(head));
      body.toString(null, 1, 1+TEST_SQL.length).should.equal(TEST_SQL);
    });
  });

  after(function() {
    cutter.destroy();
  });

  it('should single buffer ok', function() {
    cutter.handleData(packet);
  });

  it('should single buffer ok', function() {
    cutter.handleData(packet.slice(0, 4));
    cutter.handleData(packet.slice(4));
  });

  it('should pieces buffer ok', function () {
    var buff = null;
    buff = packet.slice(0, 2);
    cutter.handleData(buff);

    buff = packet.slice(2, 2+2);
    cutter.handleData(buff);

    buff = packet.slice(4, 4+1);
    cutter.handleData(buff);

    buff = packet.slice(5);
    cutter.handleData(buff);
  });

  it('test pieces random ok', function () {
    var times = 10000;
    var times_for_log = times;
    while (--times) {
      var two_packets = new Buffer(2*packet.length);
      packet.copy(two_packets);
      packet.copy(two_packets, packet.length);
      var pos1 = Math.floor(Math.random()*(two_packets.length));
      while (1) {
          var pos2 = Math.floor(Math.random()*(two_packets.length));
          if (pos2 != pos1) {
              break;
          };
      };
      var slice_1 = Math.min(pos1, pos2);
      var slice_2 = Math.max(pos1, pos2);

      var buff1 = two_packets.slice(0, slice_1);
      var buff2 = two_packets.slice(slice_1, slice_2);
      var buff3 = two_packets.slice(slice_2);
      cutter.handleData(buff1);
      cutter.handleData(buff2);
      cutter.handleData(buff3);
    }
  });
});

describe('error buf', function() {
  function getLength(buf) {
    return buf[0];
  }
  var cutter = new Cutter(4, getLength);

  after(function() {
    cutter.destroy();
  });

  it('should emit error ok', function (done) {
    var onPacket = function(packet) {
      should.not.exist(packet);
    }
    cutter.on('packet', onPacket);
    cutter.on('error', function (err) {
      should.exist(err);
      done();
    });
    cutter.handleData(new Buffer([4, 0, 0, 0]));
    cutter.removeAllListeners('packet');
    cutter.removeAllListeners('error');
  });
});
