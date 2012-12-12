module.exports = function (logger, assert, inherits, Request, Response, CheckVersion, Create, Delete, SetData, ZNodeStat, ZKErrors, defaults) {

	function Transaction(session) {
		Request.call(this, Request.types.TRANSACTION, session.xid++, TransactionResponse)
		this.session = session
		this.ops = []
	}
	inherits(Transaction, Request)

	Transaction.prototype.create = function (path, data, flags, acls) {
		assert(typeof(path) === 'string', 'path is required')
		assert(data !== undefined, 'data is required')

		if (acls === undefined) {
			if (flags === undefined) {
				// path, data
				acls = null
				flags = Create.flags.NONE
			}
			else if (Array.isArray(flags)) {
				// path, data, acls
				flags = Create.flags.NONE
			}
			else {
				// path, data, flags
				acls = null
			}
		}
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
		assert(typeof(path) === 'string', 'path is required')
		assert(typeof(version) === 'number', 'version is required')

		this.ops.push(
			new Delete(
				this.session._chroot(path),
				version
			)
		)
		return this
	}

	Transaction.prototype.set = function (path, data, version) {
		assert(typeof(path) === 'string', 'path is required')
		assert(data !== undefined, 'data is required')
		assert(typeof(version) === 'number', 'version is required')

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
		assert(typeof(path) === 'string', 'path is required')
		assert(typeof(version) === 'number', 'version is required')

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
		var x = 0
		do {
			var type = buffer.readInt32BE(x)
			var done = buffer.readUInt8(x += 4) > 0
			var err = buffer.readInt32BE(x += 1)
			if (done) break;

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
					var e = buffer.readInt32BE(x += 4) || ZKErrors.ROLLEDBACK
					results.push(err)
					break;
			}
		} while (!done)
		this.cb(e, results)
	}

	return Transaction
}
