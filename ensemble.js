module.exports = function (
	logger,
	inherits,
	EventEmitter,
	Client,
	RequestBuffer,
	Ping,
	ZKErrors) {

	function Ensemble(session) {
		this.session = session
		this.client = null
		this.connected = false
		this.reconnectAttempts = 0
		this.reconnectTimer = null
		this.current = Math.floor(Math.random() * this.session.hosts.length)
		this.requestBuffer = new RequestBuffer(this)
		this.pingTimer = null
		this.startPinger = pingLoop.bind(this)
		this.maxReconnectAttmpts = session.maxReconnectAttmpts

		this.onClientConnect = clientConnect.bind(this)
		this.onClientEnd = clientEnd.bind(this)
		this.onClientDrain = clientDrain.bind(this)
		this.onClientError = clientError.bind(this)
		this.onClientClose = clientClose.bind(this)
		this.onClientZxid = clientZxid.bind(this)
		this.onClientWatch = clientWatch.bind(this)

		this.onLogin = onLogin.bind(this)
		this.onLoginComplete = onLoginComplete.bind(this)

		EventEmitter.call(this)
	}
	inherits(Ensemble, EventEmitter)

	Ensemble.prototype.connect = function () {
		if (!this.session) {
			return
		}
		this.current = (this.current + 1) % this.session.hosts.length
		var addressPort = this.session.hosts[this.current].split(':')
		this.client = new Client()
		this.client.on('end', this.onClientEnd)
		this.client.on('connect', this.onClientConnect)
		this.client.on('drain', this.onClientDrain)
		this.client.on('error', this.onClientError)
		this.client.on('close', this.onClientClose)
		this.client.on('zxid', this.onClientZxid)
		this.client.on('watch', this.onClientWatch)
		logger.info('connecting', addressPort)
		this.client.connect(+(addressPort[1]), addressPort[0])
	}

	Ensemble.prototype.send = function (message, cb) {
		message.responseCallback(cb)
		return this.requestBuffer.push(message)
	}

	Ensemble.prototype.write = function (message) {
		this.client.send(message)
	}

	Ensemble.prototype._ping = function () {
		if (this.connected) {
			//bypass requestBuffer
			this.client.send(Ping.instance)
		}
	}

	Ensemble.prototype._reconnect = function () {
		if (this.reconnectAttempts > this.maxReconnectAttmpts) {
			return this.emit('maxReconnectAttempts')
		}
		if (this.reconnectAttempts) {
			this.reconnectTimer = setTimeout(
				this.connect.bind(this),
				Math.min(exponentialBackoff(this.reconnectAttempts), 10000)
			)
		}
		else {
			this.connect()
		}
		this.reconnectAttempts++
	}

	function exponentialBackoff(attempt) {
		return Math.floor(
			Math.random() * Math.pow(2, attempt) * 100
		)
	}

	function pingLoop() {
		clearTimeout(this.pingTimer)
		this.pingTimer = setTimeout(this.startPinger, this.session.timeout / 2)
		this._ping()
	}

	function onLogin(err, timeout, id, password, readOnly) {
		if (err) {
			if (err === ZKErrors.SESSIONEXPIRED) {
				this.session = null
				return this.emit('expired')
			}
			else if (err === ZKErrors.ABORTED) {
				logger.info('connect aborted')
				return
			}
		}
		if (readOnly && !this.session.readOnly) {
			//TODO fuck you, close & reconnect ???
		}
		this.reconnectAttempts = 0
		this.session.setParameters(id, password, timeout, readOnly)
		this.session.sendCredentials(this.onLoginComplete)
	}

	function onLoginComplete(err) {
		if (!err) {
			this.session.setWatches()
			this.startPinger()
			logger.info('draining', this.requestBuffer.purgatory.length, 'messages')
			this.requestBuffer.drain()
		}
		this.emit('connected', err)
	}

	function clientConnect() {
		logger.info('connected', this.session.hosts[this.current])
		this.connected = true
		this.session.login(this.onLogin)
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

	function clientZxid(zxid) {
		this.emit('zxid', zxid)
	}

	function clientWatch(watch) {
		this.emit('watch', watch)
	}

	function clientClose(hadError) {
		logger.info('client closed. with error', hadError)
		this.client.removeListener('end', this.onClientEnd)
		this.client.removeListener('connect', this.onClientConnect)
		this.client.removeListener('drain', this.onClientDrain)
		this.client.removeListener('error', this.onClientError)
		this.client.removeListener('close', this.onClientClose)
		this.client.removeListener('zxid', this.onClientZxid)
		this.client.removeListener('watch', this.onClientWatch)
		clearTimeout(this.pingTimer)
		this.pingTimer = null
		this.client = null
		this.connected = false
		this.emit('disconnected')
		clearTimeout(this.reconnectTimer)
		if (!this.session.closed) {
			this._reconnect()
		}
	}

	return Ensemble
}
