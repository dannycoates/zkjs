module.exports = function (logger, ZKErrors, ZnodeStat) {

	function GetChildren(path, watcher, xid) {
		this.xid = xid
		this.type = 12
		this.path = path
		this.watcher = watcher ? 1 : 0
	}

	GetChildren.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + 4 + 4 + pathlen + 1)
		data.writeInt32BE(this.xid, 0)
		data.writeInt32BE(this.type, 4)
		data.writeInt32BE(pathlen, 8)
		data.write(this.path, 12)
		data.writeUInt8(this.watcher, data.length - 1)
		return data
	}

	GetChildren.prototype.response = function (cb) {
		return new GetChildrenResponse(this.xid, cb)
	}

	function GetChildrenResponse(xid, cb) {
		this.xid = xid
		this.cb = cb
	}

	GetChildrenResponse.prototype.parse = function (errno, buffer) {
		logger.info('get children response', errno)
		var count = buffer.readInt32BE(0)
		if (count === -1) {
			return this.cb(null, [])
		}
		var children = []
		var x = 4
		for (var i = 0; i < count; i++) {
			var len = buffer.readInt32BE(x)
			var path = buffer.toString('utf8', x + 4, x + 4 + len)
			x += len + 4
			children.push(path)
		}
		var stat = ZnodeStat.parse(buffer.slice(x))
		this.cb(null, children, stat)
	}

	return GetChildren
}
