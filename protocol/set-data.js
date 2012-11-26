module.exports = function (logger, ZKErrors, ZnodeStat) {

	function SetData(path, data, version, xid) {
		this.xid = xid
		this.type = 5
		this.path = path
		this.data = data
		this.version = version
	}

	SetData.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + 4 + 4 + pathlen + 4 + this.data.length + 4)
		data.writeInt32BE(this.xid, 0)
		data.writeInt32BE(this.type, 4)
		data.writeInt32BE(pathlen, 8)
		data.write(this.path, 12)
		data.writeInt32BE(this.data.length, 12 + pathlen)
		this.data.copy(data, 16 + pathlen)
		data.writeInt32BE(this.version, data.length - 4)
		return data
	}

	SetData.prototype.response = function (cb) {
		return new SetDataResponse(this.xid, cb)
	}

	function SetDataResponse(xid, cb) {
		this.xid = xid
		this.cb = cb
		this.znodeStat = null
	}

	SetDataResponse.prototype.parse = function (errno, buffer) {
		logger.info('set response', errno)
		this.znodeStat = ZnodeStat.parse(buffer)
		this.cb(null, this.znodeStat)
	}

	return SetData
}
