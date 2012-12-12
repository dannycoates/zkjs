module.exports = function (logger, inherits, Request, Response, ZnodeStat) {

	function GetData(path, watcher, xid) {
		Request.call(this, Request.types.GETDATA, xid, GetDataResponse)
		this.path = path
		this.watcher = watcher ? 1 : 0
	}
	inherits(GetData, Request)

	GetData.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + pathlen + 1)
		data.writeInt32BE(pathlen, 0)
		data.write(this.path, 4)
		data.writeUInt8(this.watcher, data.length - 1)
		return data
	}

	function GetDataResponse(xid, cb) {
		Response.call(this, xid, cb)
		this.data = null
		this.znodeStat = null
	}
	inherits(GetDataResponse, Response)

	GetDataResponse.prototype.parse = function (errno, buffer) {
		if (errno) {
			return this.cb(errno)
		}
		var len = buffer.readInt32BE(0)
		this.data = buffer.slice(4, len + 4)
		this.znodeStat = ZnodeStat.parse(buffer.slice(len + 4))
		this.cb(null, this.data, this.znodeStat)
	}

	return GetData
}
