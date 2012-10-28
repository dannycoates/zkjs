module.exports = function () {

	function SetData(path, data, version) {
		this.path = path
		this.data = data
		this.version = version
	}

	SetData.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + pathlen + this.data.length + 4)
		data.writeUInt32BE(pathlen, 0)
		data.write(this.path, 4)
		this.data.copy(data, 4 + pathlen)
		data.writeUInt32BE(this.watcher, data.length - 4)
	}

	return SetData
}