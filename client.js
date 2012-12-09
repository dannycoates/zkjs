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
		this.onReceiverEnd = receiverEnd.bind(this)

		this.receiver.on('ping', this.onPing)
		this.receiver.on('zxid', this.onZxid)
		this.receiver.on('watch', this.onWatch)
		this.receiver.on('end', this.onReceiverEnd)

		net.Socket.call(this)
	}
	inherits(Client, net.Socket)

	Client.prototype.send = function (message) {
		var data = message.toBuffer()
		var len = Buffer(4)
		len.writeInt32BE(data.length, 0)
		this.write(len)
		this.write(data)
		this.receiver.push(message)
	}

	function receiverPing() {
		//logger.info('ping')
	}

	function receiverZxid(zxid) {
		this.emit('zxid', zxid)
	}

	function receiverWatch(watch) {
		this.emit('watch', watch)
	}

	function receiverEnd() {
		this.emit('receiverEnd')
	}

	return Client
}
