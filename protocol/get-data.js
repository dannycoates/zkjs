module.exports = function () {

	function GetData(path, watcher) {
		this.path = path
		this.watcher = watcher ? 1 : 0
	}

	GetData.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + pathlen + 1)
		data.writeUInt32BE(pathlen, 0)
		data.write(this.path, 4)
		data.writeUInt8(this.watcher, data.length - 1)
	}

	return GetData
}