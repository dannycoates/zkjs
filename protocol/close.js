module.exports = function (inherits, Request, Response) {

	function Close() {
		Request.call(this, Request.types.CLOSE, -11, CloseResponse)
		this.data = new Buffer(0)
	}
	inherits(Close, Request)

	Close.prototype.toBuffer = function () {
		return this.data
	}

	Close.instance = new Close()

	function CloseResponse(xid, cb) {
		Response.call(this, xid, cb)
	}
	inherits(CloseResponse, Response)

	return Close
}
