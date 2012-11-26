module.exports = function (
	logger,
	inherits,
	EventEmitter,
	net,
	ReadableStream,
	Receiver,
	Connect,
	Create,
	Delete,
	Exists,
	GetACL,
	GetChildren,
	GetData,
	SetACL,
	SetData,
	Sync) {

	function Client() {
		var self = this
		this.connection = net.connect({
			port: 2181,
			host: "localhost"
		})
		this.connection.on(
			'connect',
			function () {
				self.connect()
			}
		)
		this.input = new ReadableStream()
		this.input.wrap(this.connection)
		this.output = this.connection
		this.receiver = new Receiver(this.input)

		this.onPing = receiverPing.bind(this)
		this.onZxid = receiverZxid.bind(this)
		this.onAuth = receiverAuth.bind(this)
		this.onWatch = receiverWatch.bind(this)

		this.receiver.on('ping', this.onPing)
		this.receiver.on('zxid', this.onZxid)
		this.receiver.on('auth', this.onAuth)
		this.receiver.on('watch', this.onWatch)

		this.last_zxid = 0
		this.timeout = 16000
		this.sessionId = 0
		this.password = '\0'
		this.readOnly = false
		this.xid = 1
	}
	inherits(Client, EventEmitter)

	Client.prototype.send = function (something) {
		var data = something.toBuffer()
		var len = Buffer(4)
		len.writeInt32BE(data.length, 0)
		this.output.write(len)
		this.output.write(data)
	}

	Client.prototype.connect = function () {
		var self = this
		var cr = new Connect(
			this.last_zxid,
			this.timeout,
			this.sessionId,
			this.password,
			this.readOnly
		)
		this.send(cr)
		this.receiver.push(cr,
			function () {
				logger.info(
					'connect', this.timeout,
					'session', this.sessionId,
					'password', this.password,
					'readOnly', this.readOnly
				)
				self.sessionId = this.sessionId
				self.password = this.password
				self.timeout = this.timeout
				self.readOnly = this.readOnly
				self.emit('connect')
			}
		)
	}

	Client.prototype.create = function (path, data, flags, cb) {
		if(!Buffer.isBuffer(data)) {
			data = new Buffer(data.toString())
		}
		var cr = new Create(path, data, null, flags, this.xid++)
		this.send(cr)
		this.receiver.push(cr, cb)
	}

	Client.prototype.del = function (path, version, cb) {
		var d = new Delete(path, version, this.xid++)
		this.send(d)
		this.receiver.push(d, cb)
	}

	Client.prototype.exists = function (path, watch, cb) {
		var ex = new Exists(path, watch, this.xid++)
		this.send(ex)
		this.receiver.push(ex, cb)
	}

	Client.prototype.get = function (path, watch, cb) {
		var g = new GetData(path, watch, this.xid++)
		this.send(g)
		this.receiver.push(g, cb)
	}

	Client.prototype.getACL = function (path, cb) {
		var g = new GetACL(path, this.xid++)
		this.send(g)
		this.receiver.push(g, cb)
	}

	Client.prototype.getChildren = function (path, watch, cb) {
		var gc = new GetChildren(path, watch, this.xid++)
		this.send(gc)
		this.receiver.push(gc, cb)
	}

	Client.prototype.set = function (path, data, version, cb) {
		if (!Buffer.isBuffer(data)) {
			data = new Buffer(data.toString())
		}
		var s = new SetData(path, data, version, this.xid++)
		this.send(s)
		this.receiver.push(s, cb)
	}

	Client.prototype.setACL = function (path, acls, version, cb) {
		var s = new SetACL(path, acls, version, this.xid++)
		this.send(s)
		this.receiver.push(s, cb)
	}

	Client.prototype.sync = function (path, cb) {
		var s = new Sync(path, this.xid++)
		this.send(s)
		this.receiver.push(s, cb)
	}
	function receiverPing() {
		logger.info('ping')
	}

	function receiverZxid(zxid) {
		this.last_zxid = zxid
		logger.info('zxid', zxid)
	}

	function receiverAuth() {
		logger.info('auth')
	}

	function receiverWatch() {
		logger.info('watch')
	}

	return Client
}
