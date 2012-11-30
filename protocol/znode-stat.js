module.exports = function (format, int53) {
	function ZnodeStat() {
		this.czxid = 0
		this.mzxid = 0
		this.ctime = 0
		this.mtime = 0
		this.version = 0
		this.cversion = 0
		this.aversion = 0
		this.ephemeralOwner = 0
		this.dataLength = 0
		this.numChildren = 0
		this.pzxid = 0
	}

	ZnodeStat.parse = function (buffer) {
		var zs = new ZnodeStat()
		zs.czxid = buffer.readDoubleBE(0)
		zs.mzxid = buffer.readDoubleBE(8)
		zs.ctime = new Date(int53.readInt64BE(buffer, 16))
		zs.mtime = new Date(int53.readInt64BE(buffer, 24))
		zs.version = buffer.readInt32BE(32)
		zs.cversion = buffer.readInt32BE(36)
		zs.aversion = buffer.readInt32BE(40)
		zs.ephemeralOwner = buffer.readDoubleBE(44)
		zs.dataLength = buffer.readInt32BE(52)
		zs.numChildren = buffer.readInt32BE(56)
		zs.pzxid = buffer.readDoubleBE(60)
		return zs
	}

	ZnodeStat.prototype.toString = function () {
		return format(
			'(created: %s modified: %s version: %d cversion: %d aversion: %d length: %d children: %d)',
			this.ctime,
			this.mtime,
			this.version,
			this.cversion,
			this.aversion,
			this.dataLength,
			this.numChildren
		)
	}

	return ZnodeStat
}
