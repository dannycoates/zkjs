module.exports = function (ZnodeStat) {

	function Exists(path, watcher, xid) {
		this.xid = xid
		this.type = 3
		this.path = path
		this.watcher = watcher ? 1 : 0
	}

	Exists.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + 4 + 4 + pathlen + 1)
		data.writeUInt32BE(this.xid, 0)
		data.writeUInt32BE(this.type, 4)
		data.writeUInt32BE(pathlen, 8)
		data.write(this.path, 12)
		data.writeUInt8(this.watcher, data.length - 1)
		return data
	}

	Exists.prototype.response = function (cb) {
		return new ExistsResponse(this.xid, cb)
	}

	function ExistsResponse(xid, cb) {
		this.xid = xid
		this.cb = cb
		this.znodeStat = null
	}

	ExistsResponse.prototype.data = function (buffer) {
		this.znodeStat = ZnodeStat.parse(buffer)
		this.cb(this.znodeStat)
	}

	return Exists
}
