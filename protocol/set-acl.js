module.exports = function (logger, ZKErrors, ZnodeStat, ACL) {

	function SetACL(path, acls, version, xid) {
		this.xid = xid
		this.type = 7
		this.path = path
		this.acls = acls || ACL.OPEN
		this.version = version
	}

	SetACL.prototype.toBuffer = function () {
		var pathlen = Buffer.byteLength(this.path)
		var aclsBuffers = this.acls.map(
			function (acl) {
				return acl.toBuffer()
			}
		)
		var aclslen = aclsBuffers.reduce(function (total, acl) { return total + acl.length }, 0)
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
		this.xid = xid
		this.cb = cb
	}

	SetACLResponse.prototype.parse = function (errno, buffer) {
		if (errno) {
			return this.cb(ZKErrors.toError(errno))
		}
		var stat = ZnodeStat.parse(buffer)
		this.cb(null, stat)
	}

	return SetACL
}
