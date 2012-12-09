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
var Request = require('./protocol/request')(logger)
var Response = require('./protocol/response')(logger, ZKErrors)

var protocol = {
	Auth: require('./protocol/auth')(inherits, Request, Response),
	Close: require('./protocol/close')(inherits, Request, Response),
	Connect: require('./protocol/connect')(logger, inherits, Response, ZKErrors),
	Create: require('./protocol/create')(logger, inherits, Request, Response, ACL),
	Delete: require('./protocol/delete')(logger, inherits, Request, Response),
	Exists: require('./protocol/exists')(logger, inherits, Request, Response, ZKErrors, ZnodeStat),
	GetACL: require('./protocol/get-acl')(logger, inherits, Request, Response, ZnodeStat, ACL),
	GetChildren: require('./protocol/get-children')(logger, inherits, Request, Response, ZnodeStat),
	GetData: require('./protocol/get-data')(logger, inherits, Request, Response, ZnodeStat),
	SetACL: require('./protocol/set-acl')(logger, inherits, Request, Response, ZnodeStat, ACL),
	SetData: require('./protocol/set-data')(logger, inherits, Request, Response, ZnodeStat),
	SetWatches: require('./protocol/set-watches')(logger, inherits, Request, Response),
	Sync: require('./protocol/sync')(logger, inherits, Request, Response)
}

var defaults = require('./default-callbacks')(logger, ZKErrors)

var Ping = require('./protocol/ping')(inherits, Request)
var Watch = require('./protocol/watch')(format)

var Receiver = require('./receiver')(logger, inherits, EventEmitter, State, Watch)
var RequestBuffer = require('./request-buffer')()
var Watcher = require('./watcher')(logger, Watch)

var retry = require('./retry')

var Client = require('./client')(
	logger,
	inherits,
	EventEmitter,
	net,
	ReadableStream,
	Receiver
)

var Ensemble = require('./ensemble')(
	logger,
	inherits,
	EventEmitter,
	Client,
	RequestBuffer,
	Ping,
	ZKErrors
)

var Session = require('./session')(
	logger,
	assert,
	format,
	inherits,
	EventEmitter,
	path,
	ACL,
	Ensemble,
	Watcher,
	protocol,
	defaults,
	retry,
	ZKErrors
)

module.exports = Session
