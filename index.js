var logger = console
var assert = require('assert')
var crypto = require('crypto')
var format = require('util').format
var inherits = require('util').inherits
var EventEmitter = require('events').EventEmitter
var net = require('net')
var path = require('path')
var ReadableStream = require('readable-stream')
var int53 = require('int53')

var State = require('./state')(inherits)
var ZKErrors = require('./protocol/zk-errors')()
var ACL = require('./acl')(format, crypto)
var ZnodeStat = require('./protocol/znode-stat')(format, int53)
var Response = require('./protocol/response')(ZKErrors)

var Auth = require('./protocol/auth')(inherits, Response, ZKErrors)
var Close = require('./protocol/close')(inherits, Response)
var Connect = require('./protocol/connect')(logger, inherits, Response, ZKErrors)
var Create = require('./protocol/create')(logger, inherits, Response, ACL, ZKErrors)
var Delete = require('./protocol/delete')(logger, inherits, Response, ZKErrors)
var Exists = require('./protocol/exists')(logger, inherits, Response, ZKErrors, ZnodeStat)
var GetACL = require('./protocol/get-acl')(logger, inherits, Response, ZKErrors, ZnodeStat, ACL)
var GetChildren = require('./protocol/get-children')(logger, inherits, Response, ZKErrors, ZnodeStat)
var GetData = require('./protocol/get-data')(logger, inherits, Response, ZKErrors, ZnodeStat)
var SetACL = require('./protocol/set-acl')(logger, inherits, Response, ZKErrors, ZnodeStat, ACL)
var SetData = require('./protocol/set-data')(logger, inherits, Response, ZKErrors, ZnodeStat)
var SetWatches = require('./protocol/set-watches')(logger, inherits, Response, ZKErrors)
var Sync = require('./protocol/sync')(logger, inherits, Response, ZKErrors)
var defaults = require('./default-callbacks')(logger)

var Ping = require('./protocol/ping')()
var Watch = require('./protocol/watch')(format)

var Receiver = require('./receiver')(logger, inherits, EventEmitter, State, Watch)
var Watcher = require('./watcher')(logger, Watch)

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
	assert,
	format,
	inherits,
	EventEmitter,
	path,
	Client,
	Watcher,
	Auth,
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
	SetWatches,
	Sync,
	defaults)

module.exports = Session
