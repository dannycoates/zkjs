var inherits = require('util').inherits
var EventEmitter = require('events').EventEmitter
var net = require('net')
var ReadableStream = require('readable-stream')
var int53 = require('int53')
var State = require('./state')()
var NullState = require('./nullstate')()
var ResponseHeader = require('./response-header')(inherits, State)
var Response = require('./response')(ResponseHeader)
var Receiver = require('./receiver')(NullState)
var ConnectRequest = require('./connect-request')(inherits, State, int53, Response)

var Client = require('./client')(
	inherits,
	EventEmitter,
	net,
	ReadableStream,
	Receiver,
	ConnectRequest)

module.exports = Client