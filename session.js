module.exports = function (
	logger,
	inherits,
	EventEmitter,
	Client,
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
	Sync) {

	function Session(options) {
		options = options || {}
		options.timeout = options.timeout || 10000
		options.readOnly = options.readOnly || false

		this.options = options
		this.client = null
		this.lastZxid = 0
		this.timeout = options.timeout
		this.id = 0
		this.password = null
		this.readOnly = options.readOnly
		this.xid = 1
		this.pingTimer = null
		this.startPinger = pingLoop.bind(this)
		this.credentials = options.credentials || []

		this.onClientConnect = clientConnect.bind(this)
		this.onClientEnd = clientEnd.bind(this)
		this.onClientDrain = clientDrain.bind(this)
		this.onClientError = clientError.bind(this)
		this.onClientClose = clientClose.bind(this)

		this.onLogin = onLogin.bind(this)
		this.onLoginComplete = onLoginComplete.bind(this)
		this.onClose = onClose.bind(this)
		EventEmitter.call(this)
	}
	inherits(Session, EventEmitter)

	Session.createFlags = Create.flags

	//API

	Session.prototype.connect = function (host, port) {
		this.client = new Client()
		this.client.on('end', this.onClientEnd)
		this.client.on('connect', this.onClientConnect)
		this.client.on('drain', this.onClientDrain)
		this.client.on('error', this.onClientError)
		this.client.on('close', this.onClientClose)
		this.client.connect(port, host)
	}

	Session.prototype.auth = function (id, cb) {
		this.client.send(new Auth(0, id), cb)
	}

	Session.prototype.close = function () {
		this.client.send(Close.instance, this.onClose)
	}

	Session.prototype.create = function (path, data, flags, acls, cb) {
		if(!Buffer.isBuffer(data)) {
			data = new Buffer(data.toString())
		}
		//optional parameter shenanigans
		if (cb === undefined) {
			if (acls === undefined) {
				if (flags === undefined) {
					cb = defaultCreate
					flags = Create.flags.NONE
					acls = null
				}
				else if (Array.isArray(flags)) {
					cb = defaultCreate
					acls = flags
					flags = Create.flags.NONE
				}
				else if (typeof(flags) === 'function') {
					cb = flags
					flags = Create.flags.NONE
					acls = null
				}
				else {
					cb = defaultCreate
					acls = null
				}
			}
			else if (Array.isArray(flags)) {
				acls = flags
				cb = acls
				flags = Create.flags.NONE
			}
			else if (Array.isArray(acls)) {
				cb = defaultCreate
			}
			else {
				cb = acls
				acls = null
			}
		}
		this.client.send(new Create(path, data, acls, flags, this.xid++), cb)
	}

	Session.prototype.del = function (path, version, cb) {
		this.client.send(new Delete(path, version, this.xid++), cb || defaultDel)
	}

	Session.prototype.exists = function (path, watch, cb) {
		if (cb === undefined) {
			if (watch === undefined) {
				cb = defaultExists
				watch = false
			}
			else if (typeof(watch) === 'function') {
				cb = watch
				watch = false
			}
			else {
				cb = defaultExists
			}
		}
		this.client.send(new Exists(path, watch, this.xid++), cb)
	}

	Session.prototype.get = function (path, watch, cb) {
		if (cb === undefined) {
			if (watch === undefined) {
				cb = defaultGet
				watch = false
			}
			else if (typeof(watch) === 'function') {
				cb = watch
				watch = false
			}
			else {
				cb = defaultGet
			}
		}
		this.client.send(new GetData(path, watch, this.xid++), cb)
	}

	Session.prototype.getACL = function (path, cb) {
		this.client.send(new GetACL(path, this.xid++), cb || defaultGetACL)
	}

	Session.prototype.getChildren = function (path, watch, cb) {
		if (cb === undefined) {
			if (watch === undefined) {
				cb = defaultGetChildren
				watch = false
			}
			else if (typeof(watch) === 'function') {
				cb = watch
				watch = false
			}
			else {
				cb = defaultGetChildren
			}
		}
		this.client.send(new GetChildren(path, watch, this.xid++), cb)
	}

	Session.prototype.set = function (path, data, version, cb) {
		if (!Buffer.isBuffer(data)) {
			data = new Buffer(data.toString())
		}
		this.client.send(
			new SetData(path, data, version, this.xid++),
			cb || defaultSet
		)
	}

	Session.prototype.setACL = function (path, acls, version, cb) {
		this.client.send(new SetACL(path, acls, version, this.xid++), cb)
	}

	Session.prototype.sync = function (path, cb) {
		this.client.send(new Sync(path, this.xid++), cb)
	}

	// internal API

	Session.prototype._login = function (
		lastZxid,
		timeout,
		sessionId,
		password,
		readOnly,
		cb) {
		this.client.send(
			new Connect(lastZxid, timeout, sessionId, password, readOnly),
			cb
		)
	}

	Session.prototype._ping = function () {
		this.client.send(Ping.instance)
	}

	Session.prototype._reset = function () {
		this.timeout = this.options.timeout
		this.id = 0
		this.password = null
		this.readOnly = this.options.readOnly
	}


	Session.prototype._sendCredentials = function (cb) {
		this._chain(
			this.credentials.map(
				function (id) {
					return new Auth(0, id)
				}
			),
			cb
		)
	}

	Session.prototype._chain = function (requests, cb) {
		var request = requests.pop()
		if (request) {
			this.send(
				request,
				function onResponse(err) {
					if (err) {
						return cb(err)
					}
					this._chain(requests, cb);
				}.bind(this)
			)
		}
		else {
			cb()
		}
	}

	function pingLoop() {
		this.pingTimer = setTimeout(this.startPinger, this.timeout / 2)
		this._ping()
	}

	// Event handlers

	function clientConnect() {
		this._login(
			this.lastZxid,
			this.timeout,
			this.id,
			this.password,
			this.readOnly,
			this.onLogin
		)
	}

	function onLogin(err, timeout, id, password, readOnly) {
		if (err) {
			this._reset()
			return this.emit('expired')
		}
		this.timeout = timeout
		this.id = id
		this.password = password
		this.readOnly = readOnly
		if (this.credentials.length > 0) {
			this._sendCredentials(this.onLoginComplete)
		}
		else {
			this.onLoginComplete()
		}
	}

	function onLoginComplete(err) {
		if (!err) {
			this.startPinger()
		}
		this.emit('connect', err)
	}

	function onClose() {
		this._reset()
	}

	function clientEnd() {
		logger.info('client end')
	}

	function clientDrain() {
		//logger.info('client', 'drain')
	}

	function clientError(err) {
		logger.info('client error', err.message)
	}

	function clientClose(hadError) {
		logger.info('client closed. with error', hadError)
		this.client.removeListener('end', this.onClientEnd)
		this.client.removeListener('connect', this.onClientConnect)
		this.client.removeListener('drain', this.onClientDrain)
		this.client.removeListener('error', this.onClientError)
		this.client.removeListener('close', this.onClientClose)
		clearTimeout(this.pingTimer)
		this.client = null
	}

	// Default callbacks

	function defaultCreate(err, path) {
		if (err) {
			return logger.error(err.message)
		}
		logger.info('created', path)
	}

	function defaultDel(err) {
		if (err) {
			return logger.error(err.message)
		}
		logger.info('deleted')
	}

	function defaultGet(err, data, stat) {
		if (err) {
			return logger.error(err.message)
		}
		logger.info(
			'length: %d data: %s stat: %s',
			data.length,
			data.toString('utf8', 0, Math.min(data.length, 256)),
			stat
		)
	}

	function defaultGetACL(err, acls, stat) {
		if (err) {
			return logger.error(err.message)
		}
		logger.info(
			'acls: [%s] stat: %s',
			acls.join(','),
			stat
		)
	}

	function defaultGetChildren(err, children, stat) {
		if (err) {
			return logger.error(err.message)
		}
		logger.info(
			'children: [%s] stat: %s',
			children.join(','),
			stat
		)
	}

	function defaultSet(err, stat) {
		if (err) {
			return logger.error(err.message)
		}
		logger.info(
			'set stat: %s',
			stat
		)
	}

	function defaultExists(err, exists, stat) {
		if (err) {
			return logger.error(err.message)
		}
		if (!exists) {
			logger.info('does not exist')
		}
		else {
			logger.info(stat)
		}
	}

	return Session
}
