module.exports = function (logger, inherits, EventEmitter, State, Watch) {

	var CONNECT = 0
	var WATCH = -1
	var PING = -2
	var AUTH = -4

	function HeaderLength(NextState) {
		this.NextState = NextState
		State.call(this, 4)
	}
	inherits(HeaderLength, State)

	HeaderLength.prototype.next = function () {
		var length = this.buffer.readInt32BE(0)
		return new this.NextState(length)
	}

	function Body(length) {
		this.length = length
		this.xid = 0
		this.zxid = 0
		this.errno = 0
		this.data = null
		State.call(this, length)
	}
	inherits(Body, State)

	Body.prototype.parse = function () {
		this.xid = this.buffer.readInt32BE(0)
		this.zxid = this.buffer.readDoubleBE(4)
		this.errno = this.buffer.readInt32BE(12)
		this.data = this.buffer.slice(16)
	}

	Body.prototype.next = function () {
		this.parse()
		return State.done
	}

	Body.prototype.body = function () {
		return this.data
	}

	function Receiver(stream) {
		var self = this
		this.stream = stream
		this.onStreamReadable = streamReadable.bind(this)
		this.onStreamEnd = streamEnd.bind(this)
		this.onStreamError = streamError.bind(this)

		this.stream.on('readable', this.onStreamReadable)
		this.stream.on('end', this.onStreamEnd)
		this.stream.on('error', this.onStreamError)

		this.state = new HeaderLength(Body)
		this.queue = []
		this.closed = false
		EventEmitter.call(this)
	}
	inherits(Receiver, EventEmitter)

	Receiver.prototype.read = function () {
		while (this.state.read(this.stream)) {
			var next = this.state.next()
			if (next === State.done) {
				var data = null
				this.done = true
				//logger.info('xid', this.state.xid)
				if (this.state.xid === CONNECT) {
					data = this.state.buffer
				}
				else {
					if (this.state.xid === PING) {
						this.emit('ping')
					}
					else if (this.state.xid === WATCH) {
						this.emit('watch', Watch.parse(this.state.data))
					}
					else {
						data = this.state.data
					}
					this.emit('zxid', this.state.zxid)
				}
				if (data) {
					var response = this.queue.shift()
					if (response.xid !== this.state.xid) {
						response.error(this.state.xid)
					}
					else {
						response.parse(this.state.errno, data)
					}
				}
				this.state = new HeaderLength(Body)
			}
			else {
				this.state = next
			}
		}
	}

	Receiver.prototype.push = function (request, cb) {
		if (this.closed) { return false } // or something
		var response = request.response(cb)
		if (response) {
			this.queue.push(response)
		}
		return true
	}

	function streamReadable() {
		this.read()
	}

	function streamEnd() {
		logger.info(
			'receiver', 'ended',
			'queue', this.queue.map(function(x) { return x.constructor.name })
		)
		while (this.queue.length > 0) {
			this.queue.shift().abort()
		}
		this.closed = true
		this.stream.removeListener('readable', this.onStreamReadable)
		this.stream.removeListener('end', this.onStreamEnd)
		this.stream.removeListener('error', this.onStreamError)
		this.emit('end')
	}

	function streamError(err) {
		logger.info('receiver error', err.message)
	}

	return Receiver
}
