module.exports = function (
	logger,
	inherits,
	EventEmitter,
	net,
	ReadableStream,
	Receiver,
	ConnectRequest,
	Exists) {

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
		var cr = new ConnectRequest(0, 16000, 0, '00', false)
		this.send(cr)
		this.receiver.push(cr,
			function () {
				logger.info(
					'connect', this.timeout,
					'session', this.sessionId,
					'password', this.password,
					'readOnly', this.readOnly
				)
				self.emit('connect')
			}
		)
	}

	Client.prototype.exists = function (path) {
		var ex = new Exists(path, false, this.xid++)
		this.send(ex)
		this.receiver.push(ex,
			function(stat) {
				logger.info('stat', stat)
			}
		)
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
