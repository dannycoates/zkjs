module.exports = function (logger, inherits, Response, ZnodeStat, ACL) {

	function SetACL(path, acls, version, xid) {
		this.xid = xid
		this.type = 7
		this.path = path
		this.acls = acls || ACL.OPEN
		this.version = version
	}

	function acl2buffer(acl) { return acl.toBuffer() }
	function sumLength(total, buffer) { return total + buffer.length }

	SetACL.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var aclsBuffers = this.acls.map(acl2buffer)
		var aclslen = aclsBuffers.reduce(sumLength, 0)
		var data = new Buffer(4 + 4 + 4 + pathlen + 4 + aclslen + 4)
		data.writeInt32BE(this.xid, 0)
		data.writeInt32BE(this.type, 4)
		data.writeInt32BE(pathlen, 8)
		data.write(this.path, 12)
		data.writeInt32BE(aclsBuffers.length, data.length - aclslen - 8)
		var x = data.length - aclslen - 4
		for (var i = 0; i < aclsBuffers.length; i++) {
			aclsBuffers[i].copy(data, x)
			x += aclsBuffers[i].length
		}
		data.writeInt32BE(this.version, data.length - 4)
		return data
	}

	SetACL.prototype.response = function (cb) {
		return new SetACLResponse(this.xid, cb)
	}

	function SetACLResponse(xid, cb) {
		Response.call(this, xid, cb)
	}
	inherits(SetACLResponse, Response)

	SetACLResponse.prototype.parse = function (errno, buffer) {
		if (errno) {
			return this.cb(errno)
		}
		var stat = ZnodeStat.parse(buffer)
		this.cb(null, stat)
	}

	return SetACL
}
