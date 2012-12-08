module.exports = function (logger, inherits, Response) {

	function SetWatches(zxid, watchPaths) {
		this.xid = -8
		this.type = 101
		this.zxid = zxid
		this.childWatches = watchPaths.child
		this.dataWatches = watchPaths.data
		this.existsWatches = watchPaths.exists
	}

	function string2buffer(string) {
		var len = Buffer.byteLength(string)
		var data = new Buffer(4 + len)
		data.writeInt32BE(len, 0)
		data.write(string, 4)
		return data
	}

	function sumLength(total, buffer) {
		return total + buffer.length
	}

	function writeBuffers(data, buffers, offset) {
		for (var i = 0; i < buffers.length; i++) {
			var b = buffers[i]
			b.copy(data, offset)
			offset += b.length
		}
		return offset
	}

	SetWatches.prototype.toBuffer = function () {
		var childBuffers = this.childWatches.map(string2buffer)
		var dataBuffers = this.dataWatches.map(string2buffer)
		var existsBuffers = this.existsWatches.map(string2buffer)

		var childLength = childBuffers.reduce(sumLength, 0)
		var dataLength = dataBuffers.reduce(sumLength, 0)
		var existsLength = existsBuffers.reduce(sumLength, 0)

		var data = new Buffer(4 + 4 + 8 + 4 + dataLength + 4 + existsLength + 4 + childLength)
		data.writeInt32BE(this.xid, 0)
		data.writeInt32BE(this.type, 4)
		data.writeDoubleBE(this.zxid, 8)
		data.writeInt32BE(dataBuffers.length, 16)
		var x = 20
		x = writeBuffers(data, dataBuffers, x)
		data.writeInt32BE(existsBuffers.length, x)
		x += 4
		x = writeBuffers(data, existsBuffers, x)
		data.writeInt32BE(childBuffers.length, x)
		x += 4
		writeBuffers(data, childBuffers, x)
		return data
	}

	SetWatches.prototype.response = function (cb) {
		return new SetWatchesResponse(this.xid, cb)
	}

	function SetWatchesResponse(xid, cb) {
		Response.call(this, xid, cb)
	}
	inherits(SetWatchesResponse, Response)

	SetWatchesResponse.prototype.parse = function (errno, buffer) {
		return this.cb(errno)
	}

	return SetWatches
}
