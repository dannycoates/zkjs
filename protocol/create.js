var createFlags = {
	NONE: 0,
	EPHEMERAL: 1,
	SEQUENCE: 2,
	EPHEMERAL_SEQUENCE: 3
}

function CreateModule(logger, inherits, Request, Response, ACL) {

	function Create(path, data, acls, flags, xid) {
		Request.call(this, Request.types.CREATE, xid, CreateResponse)
		if(!Buffer.isBuffer(data)) {
			data = new Buffer(data.toString())
		}
		this.path = path
		this.data = data
		this.acls = acls || ACL.OPEN
		this.flags = flags
	}
	inherits(Create, Request)

	Create.flags = createFlags

	Create.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var aclsBuffers = this.acls.map(
			function (acl) {
				return acl.toBuffer()
			}
		)
		var aclslen = aclsBuffers.reduce(function (total, acl) { return total + acl.length }, 0)
		var data = new Buffer(4 + pathlen + 4 + this.data.length + 4 + aclslen + 4)
		data.writeInt32BE(pathlen, 0)
		data.write(this.path, 4)
		data.writeInt32BE(this.data.length, 4 + pathlen)
		this.data.copy(data, 8 + pathlen)
		data.writeInt32BE(aclsBuffers.length, data.length - aclslen - 8)
		var x = data.length - aclslen - 4
		for (var i = 0; i < aclsBuffers.length; i++) {
			aclsBuffers[i].copy(data, x)
			x += aclsBuffers[i].length
		}
		data.writeInt32BE(this.flags, data.length - 4)
		return data
	}

	function CreateResponse(xid, cb) {
		Response.call(this, xid, cb)
		this.path = ''
	}
	inherits(CreateResponse, Response)

	CreateResponse.prototype.parse = function (errno, buffer) {
		if (errno) {
			return this.cb(errno)
		}
		var len = buffer.readInt32BE(0)
		this.path = buffer.toString('utf8', 4, 4 + len)
		return this.cb(null, this.path)
	}

	return Create
}
CreateModule.flags = createFlags

module.exports = CreateModule
