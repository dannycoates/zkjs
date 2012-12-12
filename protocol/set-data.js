module.exports = function (logger, inherits, Request, Response, ZnodeStat) {

	function SetData(path, data, version, xid) {
		Request.call(this, Request.types.SETDATA, xid, SetDataResponse)
		if (!Buffer.isBuffer(data)) {
			data = new Buffer(data.toString())
		}
		this.path = path
		this.data = data
		this.version = version
	}
	inherits(SetData, Request)

	SetData.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + pathlen + 4 + this.data.length + 4)
		data.writeInt32BE(pathlen, 0)
		data.write(this.path, 4)
		data.writeInt32BE(this.data.length, 4 + pathlen)
		this.data.copy(data, 8 + pathlen)
		data.writeInt32BE(this.version, data.length - 4)
		return data
	}

	function SetDataResponse(xid, cb) {
		Response.call(this, xid, cb)
		this.znodeStat = null
	}
	inherits(SetDataResponse, Response)

	SetDataResponse.prototype.parse = function (errno, buffer) {
		if (errno) {
			return this.cb(errno)
		}
		this.znodeStat = ZnodeStat.parse(buffer)
		this.cb(null, this.znodeStat)
	}

	return SetData
}
