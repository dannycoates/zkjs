module.exports = function (
	inherits,
	EventEmitter,
	net,
	ReadableStream,
	Receiver,
	ConnectRequest) {

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
				self.emit('connect')
			}
		)
	}

	return Client
}