/*!
 * cutter - lib/cutter.js
 * Copyright(c) 2012 dead-horse<dead_horse@qq.com>
 */

/**
 * Module dependencies.
 */
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var assert = require('assert');

/**
 * Cutter for buffer
 * @param  {Number}      headLength
 * @param  {Function}    getLength 
 */
var Cutter = function(headLength, getLength) {
  this.getLength = getLength;
  this.headLength = headLength;
  assert(typeof this.getLength === 'function', 'getLength must be type of Function!');
  assert(typeof this.headLength === 'number', 'headLength must be type of Number!');
  EventEmitter.call(this);
  this.on('data', this.handleData);
  this.buf = null;
  this.packetSize = 0;
}

util.inherits(Cutter, EventEmitter);

/**
 * handle data events
 * @param  {Buffer} data 
 */
Cutter.prototype.handleData = function(data) {
  if (!this.buf) {
    this.buf = data;
  } else {
    var tmpBuffer = new Buffer(this.buf.length + data.length);
    this.buf.copy(tmpBuffer, 0, 0, this.buf.length);
    data.copy(tmpBuffer, this.buf.length, 0, data.length);
    this.buf = tmpBuffer;
  }
  this.handlePacket();
};

Cutter.prototype.handlePacket = function() {
  if (!this.buf || this.buf.length < this.headLength) {
    return;
  }
  //get packet size
  if (this.packetSize <= 0) {
    this.packetSize = this.getLength(this.buf);
  }
  var packetSize = this.packetSize;
  // if packet size error
  if (packetSize <= this.headLength) {
    this.buf = null;
    this.packetSize = 0;
    return;
  }
  //if already get packet
  if (this.buf.length > packetSize) {
    this.emit('packet', this.buf.slice(0, packetSize));
    this.buf = this.buf.slice(packetSize, this.buf.length);
    this.packetSize = 0;
    this.handlePacket();
  } else if (this.buf.length === packetSize) {
    this.emit('packet', this.buf);
    this.buf = null;
    this.packetSize = 0;
  }
}

/**
 * destroy the cutter
 */
Cutter.prototype.destroy = function() {
  this.removeAllListeners();
  this.buf = null;
}

Cutter.create = function(headLength, getLength) {
  return new Cutter(headLength, getLength);
}

module.exports = Cutter;