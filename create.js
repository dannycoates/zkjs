module.exports = function () {

	function Create(path, data, acl, flags) {
		this.path = path
		this.data = data
		this.acl = acl
		this.flags = flags
	}

	Create.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + pathlen + this.data.length)
		data.writeInt32BE(pathlen, 0)
		data.write(this.path, 4)
		this.data.copy(data, 4 + pathlen)
	}

	return Create
}