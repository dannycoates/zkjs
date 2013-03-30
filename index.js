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
var retry = require('./retry')
var RequestBuffer = require('./request-buffer')()
var createModule = require('./protocol/create')

var noop = function () {}
var nullLogger = {}
Object.keys(console).forEach(function (f) { nullLogger[f] = noop })

function setLogger(logger) {
	if (logger) {
		var required = Object.keys(console)
		assert.ok(
			required.every(
				function (f) {
					return typeof(logger[f] === 'function')
				}
			),
			'logger must implement the global.console interface'
		)
		return logger
	}
	else {
		return nullLogger
	}
}

function ZK(options) {
	options = options || {}
	var logger = setLogger(options.logger)
	var Request = require('./protocol/request')(logger)
	var Response = require('./protocol/response')(logger, ZKErrors)

	var protocol = {
		Auth: require('./protocol/auth')(inherits, Request, Response),
		Close: require('./protocol/close')(inherits, Request, Response),
		CheckVersion: require('./protocol/check-version')(logger, Request),
		Connect: require('./protocol/connect')(logger, inherits, Response, ZKErrors),
		Create: createModule(logger, inherits, Request, Response, ACL),
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

	protocol.Transaction = require('./protocol/transaction')(logger, assert, inherits, Request, Response, protocol.CheckVersion, protocol.Create, protocol.Delete, protocol.SetData, ZnodeStat, ZKErrors, defaults)


	var Ping = require('./protocol/ping')(inherits, Request)
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

	return new Session(options)
}

ZK.errors = ZKErrors
ZK.ACL = ACL
ZK.retry = retry
ZK.create = createModule.flags

module.exports = ZK
