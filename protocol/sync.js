module.exports = function (logger, inherits, Response, ZKErrors) {

	function Sync(path, xid) {
		this.xid = xid
		this.type = 9
		this.path = path
	}

	Sync.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + 4 + 4 + pathlen)
		data.writeInt32BE(this.xid, 0)
		data.writeInt32BE(this.type, 4)
		data.writeInt32BE(pathlen, 8)
		data.write(this.path, 12)
		return data
	}

	Sync.prototype.response = function (cb) {
		return new SyncResponse(this.xid, cb)
	}

	function SyncResponse(xid, cb) {
		Response.call(this, xid, cb)
	}
	inherits(SyncResponse, Response)

	SyncResponse.prototype.parse = function (errno, buffer) {
		if (errno) {
			return this.cb(ZKErrors.toError(errno))
		}
		var len = buffer.readInt32BE(0)
		var path = buffer.toString('utf8', 4, len + 4)
		this.cb(null, path)
	}

	return Sync
}
