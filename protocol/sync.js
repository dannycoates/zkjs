module.exports = function (logger, inherits, Request, Response) {

	function Sync(path, xid) {
		Request.call(this, Request.types.SYNC, xid, SyncResponse)
		this.path = path
	}
	inherits(Sync, Request)

	Sync.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + pathlen)
		data.writeInt32BE(pathlen, 0)
		data.write(this.path, 4)
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
