module.exports = function () {

	function Ping() {
		this.type = 11
		this.data = new Buffer(8)
		this.data.writeInt32BE(0, 0)
		this.data.writeInt32BE(this.type, 4)
	}

	Ping.prototype.toBuffer = function () {
		return this.data
	}

	Ping.instance = new Ping()

	return Ping
}
