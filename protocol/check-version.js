module.exports = function (logger) {

	function CheckVersion(path, version) {
		this.type = 13
		this.path = path
		this.version = version
	}

	CheckVersion.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + pathlen + 4)
		data.writeInt32BE(pathlen, 0)
		data.write(this.path, 4)
		data.writeInt32BE(this.version, data.length - 4)
		return data
	}

	return CheckVersion
}
