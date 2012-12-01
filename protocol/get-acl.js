module.exports = function (logger, ZKErrors, ZnodeStat, ACL) {

	function GetACL(path, xid) {
		this.xid = xid
		this.type = 6
		this.path = path
	}

	GetACL.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var data = new Buffer(4 + 4 + 4 + pathlen)
		data.writeInt32BE(this.xid, 0)
		data.writeInt32BE(this.type, 4)
		data.writeInt32BE(pathlen, 8)
		data.write(this.path, 12)
		return data
	}

	GetACL.prototype.response = function (cb) {
		return new GetACLResponse(this.xid, cb)
	}

	function GetACLResponse(xid, cb) {
		this.xid = xid
		this.cb = cb
	}

	GetACLResponse.prototype.parse = function (errno, buffer) {
		if (errno) {
			return this.cb(ZKErrors.toError(errno))
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
