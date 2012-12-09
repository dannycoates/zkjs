module.exports = function (inherits, Request) {

	function Ping() {
		Request.call(this, 11, 0)
		this.data = new Buffer(8)
		this.data.writeInt32BE(this.xid, 0)
		this.data.writeInt32BE(this.type, 4)
	}
	inherits(Ping, Request)

	Ping.prototype.toBuffer = function () {
		return this.data
	}

	Ping.instance = new Ping()

	return Ping
}
