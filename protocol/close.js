module.exports = function () {

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

	function noop() {}

	Close.prototype.response = function () {
		return { xid: this.xid, parse: noop }
	}

	Close.instance = new Close()

	return Close
}
