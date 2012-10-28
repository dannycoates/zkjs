module.exports = function () {

	function Delete(path, version) {
		this.path = path
		this.version = version
	}

	Delete.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + pathlen + 4)
		data.writeUInt32BE(pathlen, 0)
		data.write(this.path, 4)
		data.writeUInt32BE(this.version, data.length - 4)
	}

	return Delete
}