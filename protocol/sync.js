module.exports = function () {

	function Sync(path) {
		this.path = path
	}

	Sync.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + pathlen)
		data.writeUInt32BE(pathlen, 0)
		data.write(this.path, 4)
	}

	return Sync
}