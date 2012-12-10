module.exports = function (logger, inherits, Request, Response) {

	function Delete(path, version, xid) {
		Request.call(this, 2, xid, DeleteResponse)
		this.path = path
		this.version = version
	}
	inherits(Delete, Request)

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

	function DeleteResponse(xid, cb) {
		Response.call(this, xid, cb)
	}
	inherits(DeleteResponse, Response)

	DeleteResponse.prototype.parse = function (errno, buffer) {
		return this.cb(errno)
	}

	return Delete
}
