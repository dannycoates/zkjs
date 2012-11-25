module.exports = function () {

	function CheckVersion(path, version, xid) {
		this.xid = xid
		this.type = 13
		this.path = path
		this.version = version
	}

	CheckVersion.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + 4 + 4 + pathlen + 4)
		data.writeUInt32BE(this.xid, 0)
		data.writeUInt32BE(this.type, 4)
		data.writeUInt32BE(pathlen, 8)
		data.write(this.path, 12)
		data.writeUInt32BE(this.version, data.length - 4)
	}

	CheckVersion.prototype.response = function (cb) {

	}

	return CheckVersion
}
