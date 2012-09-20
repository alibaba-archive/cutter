cutter
======

A cutter for head-body buffer.
Many network protocol will use packets composed of a fixed length "head" and a variable length "body", the "data" event emitted by node socket probably not a complete packet, but part of several packets. So this `cutter` will help to get packets.

## Usage   

```js
var Cutter = require('cutter');
var net = require('net');

/**
 * must return length of head + body
 */
function packetLength(data) {
  return 4 + data[0] + (data[1] << 8) + (data[2] << 16);
}

var server = net.createServer(function(socket) {
  var cutter = new Cutter(4, packetLength);
  cutter.on('packet', function(packet) {
    var head = packet.slice(0, 4);
    var body = packet.slice(4, packet.length);
  });
  socket.on('data',function(data) {
    cutter.emit('data', data);
  });
});

server.listen(12345);
```

## Install    
 * Clone from github   
 * Use `npm`   

 ```
 npm install cutter
 ```

 ## License   
 MIT