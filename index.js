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
var Response = require('./protocol/response')(logger, ZKErrors)

var protocol = {
	Auth: require('./protocol/auth')(inherits, Response, ZKErrors),
	Close: require('./protocol/close')(inherits, Response),
	Connect: require('./protocol/connect')(logger, inherits, Response, ZKErrors),
	Create: require('./protocol/create')(logger, inherits, Response, ACL, ZKErrors),
	Delete: require('./protocol/delete')(logger, inherits, Response, ZKErrors),
	Exists: require('./protocol/exists')(logger, inherits, Response, ZKErrors, ZnodeStat),
	GetACL: require('./protocol/get-acl')(logger, inherits, Response, ZKErrors, ZnodeStat, ACL),
	GetChildren: require('./protocol/get-children')(logger, inherits, Response, ZKErrors, ZnodeStat),
	GetData: require('./protocol/get-data')(logger, inherits, Response, ZKErrors, ZnodeStat),
	SetACL: require('./protocol/set-acl')(logger, inherits, Response, ZKErrors, ZnodeStat, ACL),
	SetData: require('./protocol/set-data')(logger, inherits, Response, ZKErrors, ZnodeStat),
	SetWatches: require('./protocol/set-watches')(logger, inherits, Response, ZKErrors),
	Sync: require('./protocol/sync')(logger, inherits, Response, ZKErrors)
}

var defaults = require('./default-callbacks')(logger)

var Ping = require('./protocol/ping')()
var Watch = require('./protocol/watch')(format)

var Receiver = require('./receiver')(logger, inherits, EventEmitter, State, Watch)
var RequestBuffer = require('./request-buffer')()
var Watcher = require('./watcher')(logger, Watch)

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
	Ping
)

var Session = require('./session')(
	logger,
	assert,
	format,
	inherits,
	EventEmitter,
	path,
	Ensemble,
	Watcher,
	protocol,
	defaults
)

module.exports = Session
