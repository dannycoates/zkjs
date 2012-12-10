module.exports = function (logger, inherits, Request, Response) {

	function Sync(path, xid) {
		Request.call(this, 9, xid, SyncResponse)
		this.path = path
	}
	inherits(Sync, Request)

	Sync.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + 4 + 4 + pathlen)
		data.writeInt32BE(this.xid, 0)
		data.writeInt32BE(this.type, 4)
		data.writeInt32BE(pathlen, 8)
		data.write(this.path, 12)
		return data
	}

	function SyncResponse(xid, cb) {
		Response.call(this, xid, cb)
	}
	inherits(SyncResponse, Response)

	SyncResponse.prototype.parse = function (errno, buffer) {
		if (errno) {
			return this.cb(errno)
		}
		var len = buffer.readInt32BE(0)
		var path = buffer.toString('utf8', 4, len + 4)
		this.cb(null, path)
	}

	return Sync
}
