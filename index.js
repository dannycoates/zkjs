var logger = console
var crypto = require('crypto')
var format = require('util').format
var inherits = require('util').inherits
var EventEmitter = require('events').EventEmitter
var net = require('net')
var ReadableStream = require('readable-stream')
var int53 = require('int53')

var State = require('./state')(inherits)
var ZKErrors = require('./protocol/zk-errors')()
var ACL = require('./acl')(format, crypto)
var ZnodeStat = require('./protocol/znode-stat')(format, int53)
var Close = require('./protocol/close')()
var Connect = require('./protocol/connect')(logger, ZKErrors)
var Create = require('./protocol/create')(logger, ACL, ZKErrors)
var Delete = require('./protocol/delete')(logger)
var Exists = require('./protocol/exists')(logger, ZKErrors, ZnodeStat)
var GetACL = require('./protocol/get-acl')(logger, ZKErrors, ZnodeStat, ACL)
var GetChildren = require('./protocol/get-children')(logger, ZKErrors, ZnodeStat)
var GetData = require('./protocol/get-data')(logger, ZKErrors, ZnodeStat)
var Ping = require('./protocol/ping')()
var SetACL = require('./protocol/set-acl')(logger, ZKErrors, ZnodeStat, ACL)
var SetData = require('./protocol/set-data')(logger, ZKErrors, ZnodeStat)
var Sync = require('./protocol/sync')(logger)
var Watch = require('./protocol/watch')(format)

var Receiver = require('./receiver')(logger, inherits, EventEmitter, State, Watch)

var Client = require('./client')(
	logger,
	inherits,
	EventEmitter,
	net,
	ReadableStream,
	Receiver
)

var Session = require('./session')(
	logger,
	inherits,
	EventEmitter,
	Client,
	Close,
	Connect,
	Create,
	Delete,
	Exists,
	GetACL,
	GetChildren,
	GetData,
	Ping,
	SetACL,
	SetData,
	Sync)

module.exports = Session
