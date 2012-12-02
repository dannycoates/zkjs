module.exports = function (inherits, Response) {

	function Close() {
		this.type = -11
		this.xid = -11
		this.data = new Buffer(8)
		this.data.writeInt32BE(this.xid, 0)
		this.data.writeInt32BE(this.type, 4)
	}

	Close.prototype.toBuffer = function () {
		return this.data
	}

	Close.prototype.response = function (cb) {
		return new CloseResponse(this.xid, cb)
	}

	Close.instance = new Close()

	function CloseResponse(xid, cb) {
		Response.call(this, xid, cb)
	}
	inherits(CloseResponse, Response)

	return Close
}
