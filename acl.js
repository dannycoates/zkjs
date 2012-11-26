module.exports = function (crypto) {

	function Id(scheme, credential) {
		this.scheme = scheme
		this.credential = credential
	}

	Id.ANYONE = new Id('world', 'anyone')

	function ACL(permissions, id) {
		this.permissions = permissions
		this.id = id
	}

	ACL.prototype.toBuffer = function () {
		var schemelen = Buffer.byteLength(this.id.scheme)
		var credlen = Buffer.byteLength(this.id.credential)
		var data = new Buffer(4 + 4 + schemelen + 4 + credlen)
		data.writeInt32BE(this.permissions, 0)
		data.writeInt32BE(schemelen, 4)
		data.write(this.id.scheme, 8)
		data.writeInt32BE(credlen, 8 + schemelen)
		data.write(this.id.credential, 12 + schemelen)
		return data
	}

	ACL.Permissions = {
		READ: 1,
		WRITE: 2,
		CREATE: 4,
		DELETE: 8,
		ADMIN: 16,
		ALL: 31
	}

	ACL.OPEN = [new ACL(ACL.Permissions.ALL, Id.ANYONE)]

	function credential(name, password) {
		var namePassword = name + ':' + password
		var hash = crypto.createHash('sha1')
		hash.update(namePassword)
		return namePassword + ':' + hash.digest('base64')
	}

	ACL.digestAcl = function (name, password, permissions) {
		permissions = permissions || ACL.Permissions.ALL
		return new ACL(permissions, new Id('digest', credential(name, password)))
	}

	return ACL
}
