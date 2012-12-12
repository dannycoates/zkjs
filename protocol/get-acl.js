module.exports = function (logger, inherits, Request, Response, ZnodeStat, ACL) {

	function GetACL(path, xid) {
		Request.call(this, Request.types.GETACL, xid, GetACLResponse)
		this.path = path
	}
	inherits(GetACL, Request)

	GetACL.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + pathlen)
		data.writeInt32BE(pathlen, 0)
		data.write(this.path, 4)
		return data
	}

	function GetACLResponse(xid, cb) {
		Response.call(this, xid, cb)
	}
	inherits(GetACLResponse, Response)

	GetACLResponse.prototype.parse = function (errno, buffer) {
		if (errno) {
			return this.cb(errno)
		}
		var count = buffer.readInt32BE(0)
		if (count === -1) {
			return this.cb(null, [])
		}
		var acls = []
		var x = 4
		for (var i = 0; i < count; i++) {
			var acl = ACL.parse(buffer.slice(x))
			acls.push(acl)
			x += acl.byteLength()
		}
		var stat = ZnodeStat.parse(buffer.slice(x))
		this.cb(null, acls, stat)
	}

	return GetACL
}
