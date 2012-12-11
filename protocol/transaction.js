module.exports = function (logger, inherits, Request, Response, CheckVersion, Create, Delete, SetData, ZNodeStat, defaults) {

	function Transaction(session) {
		Request.call(this, Request.types.TRANSACTION, session.xid++, TransactionResponse)
		this.session = session
		this.ops = []
	}
	inherits(Transaction, Request)

	Transaction.prototype.create = function (path, data, flags, acls) {
		//TODO parameter shenanigans
		this.ops.push(
			new Create(
				this.session._chroot(path),
				data,
				acls,
				flags
			)
		)
		return this
	}

	Transaction.prototype.del = function (path, version) {
		this.ops.push(
			new Delete(
				this.session._chroot(path),
				version
			)
		)
		return this
	}

	Transaction.prototype.set = function (path, data, version) {
		this.ops.push(
			new SetData(
				this.session._chroot(path),
				data,
				version
			)
		)
		return this
	}

	Transaction.prototype.check = function (path, version) {
		this.ops.push(
			new CheckVersion(
				this.session._chroot(path),
				version
			)
		)
		return this
	}

	Transaction.prototype.commit = function (cb) {
		this.session._send(this, cb || defaults.transaction)
	}

	function multiRequest(op) {
		var data = op.toBuffer()
		var multi = new Buffer(4 + 1 + 4 + data.length)
		multi.writeInt32BE(op.type, 0)
		multi.writeUInt8(0, 4)
		multi.writeInt32BE(-1, 5)
		data.copy(multi, 9)
		return multi
	}

	function sumLength(total, buffer) {
		return total + buffer.length
	}

	Transaction.prototype.toBuffer = function () {
		var buffers = this.ops.map(multiRequest)
		var requestLength = buffers.reduce(sumLength, 0)
		var data = new Buffer(requestLength + 4 + 1 + 4)
		var x = 0
		for (var i = 0; i < buffers.length; i++) {
			var b = buffers[i]
			b.copy(data, x)
			x += b.length
		}
		data.writeInt32BE(-1, data.length - 9)
		data.writeUInt8(1, data.length - 5)
		data.writeInt32BE(-1, data.length - 4)
		return data
	}

	function TransactionResponse(xid, cb) {
		Response.call(this, xid, cb)
	}
	inherits(TransactionResponse, Response)

	TransactionResponse.prototype.parse = function (errno, buffer) {
		if (errno) {
			return this.cb(errno)
		}
		var results = []
		var done = false
		var type = 0
		var err = 0
		var x = 0
		while (!done) {
			type = buffer.readInt32BE(x)
			done = buffer.readUInt8(x += 4) > 0
			err = buffer.readInt32BE(x += 1)
			logger.info(type, done, x, buffer.length)
			switch (type) {
				case Request.types.CREATE:
					var len = buffer.readInt32BE(x += 4)
					results.push(buffer.toString('utf8', x += 4, x += len))
				case Request.types.DELETE:
					results.push(true)
					break;
				case Request.types.SETDATA:
					results.push(ZNodeStat.parse(buffer.slice(x += 4, x += 68)))
					break;
				case Request.types.CHECKVERSION:
					results.push(true)
					break;
				case -1: //error
					//var e = buffer.readInt32BE(x += 4)
					results.push(err)
					break;
			}
		}
		this.cb(null, results)
	}

	return Transaction
}
