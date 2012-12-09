module.exports = function (inherits, Request, Response) {

	function Close() {
		Request.call(this, -11, -11)
		this.data = new Buffer(8)
		this.data.writeInt32BE(this.xid, 0)
		this.data.writeInt32BE(this.type, 4)
	}
	inherits(Close, Request)

	Close.prototype.toBuffer = function () {
		return this.data
	}

	Close.prototype.response = function () {
		return new CloseResponse(this.xid, this.responseCallback())
	}

	Close.instance = new Close()

	function CloseResponse(xid, cb) {
		Response.call(this, xid, cb)
	}
	inherits(CloseResponse, Response)

	return Close
}
