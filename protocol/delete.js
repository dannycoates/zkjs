module.exports = function (logger, ZKErrors) {

	function Delete(path, version, xid) {
		this.xid = xid
		this.type = 2
		this.path = path
		this.version = version
	}

	Delete.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + 4 + 4 + pathlen + 4)
		data.writeInt32BE(this.xid, 0)
		data.writeInt32BE(this.type, 4)
		data.writeInt32BE(pathlen, 8)
		data.write(this.path, 12)
		data.writeInt32BE(this.version, data.length - 4)
		return data
	}

	Delete.prototype.response = function (cb) {
		return new DeleteResponse(this.xid, cb)
	}

	function DeleteResponse(xid, cb) {
		this.xid = xid
		this.cb = cb
	}

	DeleteResponse.prototype.parse = function (errno, buffer) {
		return this.cb(ZKErrors.toError(errno))
	}

	return Delete
}
