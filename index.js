var logger = console

var crypto = require('crypto')
var inherits = require('util').inherits
var EventEmitter = require('events').EventEmitter
var net = require('net')
var ReadableStream = require('readable-stream')
var int53 = require('int53')
var State = require('./state')(inherits)
var ZKErrors = require('./protocol/zk-errors')()
var ACL = require('./acl')(crypto)
var Receiver = require('./receiver')(logger, inherits, EventEmitter, State)
var ZnodeStat = require('./protocol/znode-stat')(int53)
var Connect = require('./protocol/connect')(logger)
var Create = require('./protocol/create')(logger, ACL, ZKErrors)
var Exists = require('./protocol/exists')(logger, ZKErrors, ZnodeStat)
var GetChildren = require('./protocol/get-children')(logger, ZKErrors, ZnodeStat)
var GetData = require('./protocol/get-data')(logger, ZKErrors, ZnodeStat)
var SetData = require('./protocol/set-data')(logger, ZKErrors, ZnodeStat)

var Client = require('./client')(
	logger,
	inherits,
	EventEmitter,
	net,
	ReadableStream,
	Receiver,
	Connect,
	Create,
	Exists,
	GetChildren,
	GetData,
	SetData
)

module.exports = Client
