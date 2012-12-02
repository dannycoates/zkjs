module.exports = function (
	logger,
	inherits,
	EventEmitter,
	net,
	ReadableStream,
	Receiver
) {

	function Client() {
		this.input = new ReadableStream()
		this.input.wrap(this)
		this.receiver = new Receiver(this.input)

		this.onPing = receiverPing.bind(this)
		this.onZxid = receiverZxid.bind(this)
		this.onWatch = receiverWatch.bind(this)

		this.receiver.on('ping', this.onPing)
		this.receiver.on('zxid', this.onZxid)
		this.receiver.on('watch', this.onWatch)

		net.Socket.call(this)
	}
	inherits(Client, net.Socket)

	Client.prototype.send = function (message, cb) {
		var data = message.toBuffer()
		var len = Buffer(4)
		len.writeInt32BE(data.length, 0)
		this.write(len)
		this.write(data)
		if (cb) {
			this.receiver.push(message, cb)
		}
	}

	function receiverPing() {
		//logger.info('ping')
	}

	function receiverZxid(zxid) {
		this.emit('zxid', zxid)
	}

	function receiverWatch(watch) {
		logger.info('watch %s', watch)
	}

	return Client
}
