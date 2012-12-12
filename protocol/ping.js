module.exports = function (inherits, Request) {

	function Ping() {
		Request.call(this, Request.types.PING, -2)
		this.data = new Buffer(0)
	}
	inherits(Ping, Request)

	Ping.prototype.toBuffer = function () {
		return this.data
	}

	Ping.instance = new Ping()

	return Ping
}
