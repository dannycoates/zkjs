module.exports = function (
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
	Sync) {

	function noop() {}

	function Session() {
		this.client = null
		this.lastZxid = 0
		this.timeout = 10000
		this.id = 0
		this.password = null
		this.readOnly = false
		this.xid = 1
		this.pingTimer = null
		this.pinger = pingLoop.bind(this)

		this.onClientEnd = clientEnd.bind(this)
		this.onClientConnect = clientConnect.bind(this)
		this.onClientDrain = clientDrain.bind(this)
		this.onClientError = clientError.bind(this)
		this.onClientClose = clientClose.bind(this)

		this.onLogin = afterLogin.bind(this)
		EventEmitter.call(this)
	}
	inherits(Session, EventEmitter)

	Session.prototype.connect = function (host, port) {
		this.client = new Client()
		this.client.on('end', this.onClientEnd)
		this.client.on('connect', this.onClientConnect)
		this.client.on('drain', this.onClientDrain)
		this.client.on('error', this.onClientError)
		this.client.on('close', this.onClientClose)
		this.client.connect(port, host)
	}

	Session.prototype.close = function () {
		this.client.send(Close.instance, noop)
	}

	Session.prototype.create = function (path, data, flags, cb) {
		if(!Buffer.isBuffer(data)) {
			data = new Buffer(data.toString())
		}
		var cr = new Create(path, data, null, flags, this.xid++) //TODO: ACL
		this.client.send(cr, cb || defaultCreate)
	}

	Session.prototype.del = function (path, version, cb) {
		var d = new Delete(path, version, this.xid++)
		this.client.send(d, cb || defaultDel)
	}

	Session.prototype.exists = function (path, watch, cb) {
		var ex = new Exists(path, watch, this.xid++)
		this.client.send(ex, cb || defaultExists)
	}

	Session.prototype.get = function (path, watch, cb) {
		var g = new GetData(path, watch, this.xid++)
		this.client.send(g, cb || defaultGet)
	}

	Session.prototype.getACL = function (path, cb) {
		var g = new GetACL(path, this.xid++)
		this.client.send(g, cb || defaultGetACL)
	}

	Session.prototype.getChildren = function (path, watch, cb) {
		var gc = new GetChildren(path, watch, this.xid++)
		this.client.send(gc, cb || defaultGetChildren)
	}

	Session.prototype.login = function (
		lastZxid,
		timeout,
		sessionId,
		password,
		readOnly,
		cb) {
		var cr = new Connect(lastZxid, timeout, sessionId, password, readOnly)
		this.client.send(cr, cb)
	}

	Session.prototype.ping = function () {
		this.client.send(Ping.instance)
	}

	Session.prototype.set = function (path, data, version, cb) {
		if (!Buffer.isBuffer(data)) {
			data = new Buffer(data.toString())
		}
		var s = new SetData(path, data, version, this.xid++)
		this.client.send(s, cb || defaultSet)
	}

	Session.prototype.setACL = function (path, acls, version, cb) {
		var s = new SetACL(path, acls, version, this.xid++)
		this.client.send(s, cb)
	}

	Session.prototype.sync = function (path, cb) {
		var s = new Sync(path, this.xid++)
		this.client.send(s, cb)
	}

	function pingLoop() {
		this.pingTimer = setTimeout(this.pinger, this.timeout / 2)
		this.ping()
	}

	// Event handlers

	function clientConnect() {
		this.login(
			this.lastZxid,
			this.timeout,
			this.id,
			this.password,
			this.readOnly,
			this.onLogin)
	}

	function afterLogin(err, timeout, id, password, readOnly) {
		if (err) {
			//TODO
		}
		this.timeout = timeout
		this.id = id
		this.password = password
		this.readOnly = readOnly
		this.pinger()
		this.emit('connect')
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
