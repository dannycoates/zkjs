var logger = console

var inherits = require('util').inherits
var EventEmitter = require('events').EventEmitter
var net = require('net')
var ReadableStream = require('readable-stream')
var int53 = require('int53')
var State = require('./state')(inherits)
var Receiver = require('./receiver')(logger, inherits, EventEmitter, State)
var ZnodeStat = require('./protocol/znode-stat')(int53)
var Connect = require('./protocol/connect')()
var Exists = require('./protocol/exists')(ZnodeStat)

var Client = require('./client')(
	logger,
	inherits,
	EventEmitter,
	net,
	ReadableStream,
	Receiver,
	Connect,
	Exists)

module.exports = Client
