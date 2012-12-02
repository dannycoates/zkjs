module.exports = function (format, crypto) {

	function Id(scheme, credential) {
		this.scheme = scheme
		this.credential = credential
	}

	Id.create = function (name, password) {
		var namePassword = name + ':' + password
		var hash = crypto.createHash('sha1')
		hash.update(namePassword)
		return new Id('digest', namePassword + ':' + hash.digest('base64'))
	}

	Id.prototype.toString = function () {
		return format(
			'Id(scheme: %s credential: %s)',
			this.scheme,
			this.credential
		)
	}

	Id.prototype.toBuffer = function () {
		var schemelen = Buffer.byteLength(this.scheme)
		var credlen = Buffer.byteLength(this.credential)
		var data = new Buffer(4 + schemelen + 4 + credlen)
		data.writeInt32BE(schemelen, 0)
		data.write(this.scheme, 4)
		data.writeInt32BE(credlen, 4 + schemelen)
		data.write(this.credential, 8 + schemelen)
		return data
	}

	Id.ANYONE = new Id('world', 'anyone')
	Id.CREATOR = new Id('auth', '')

	function ACL(permissions, id) {
		this.permissions = permissions
		this.id = id
	}

	ACL.prototype.toBuffer = function () {
		var idData = this.id.toBuffer()
		var data = new Buffer(4 + idData.length)
		data.writeInt32BE(this.permissions, 0)
		idData.copy(data, 4)
		return data
	}

	ACL.prototype.byteLength = function () {
		return 4 + this.id.toBuffer().length
	}

	ACL.prototype.toString = function () {
		var permissions = []
		if ((this.permissions & 1) > 0) permissions.push('read')
		if ((this.permissions & 2) > 0) permissions.push('write')
		if ((this.permissions & 4) > 0) permissions.push('create')
		if ((this.permissions & 8) > 0) permissions.push('delete')
		if ((this.permissions & 16) > 0) permissions.push('admin')
		if ((this.permissions & 31) > 0) permissions.push('all')
		return format(
			'ACL(id: %s permissions: [%s])',
			this.id,
			permissions.join(',')
		)
	}

	ACL.Id = Id

	ACL.Permissions = {
		READ: 1,
		WRITE: 2,
		CREATE: 4,
		DELETE: 8,
		ADMIN: 16,
		ALL: 31
	}

	ACL.OPEN = [new ACL(ACL.Permissions.ALL, Id.ANYONE)]
	ACL.READ = [new ACL(ACL.Permissions.READ, Id.ANYONE)]
	ACL.CREATOR = [new ACL(ACL.Permissions.ALL, Id.CREATOR)]

	ACL.digestAcl = function (name, password, permissions) {
		permissions = permissions || ACL.Permissions.ALL
		return new ACL(permissions, Id.create(name, password))
	}

	ACL.parse = function (buffer) {
		var permissions = buffer.readInt32BE(0)
		var schemelen = buffer.readInt32BE(4)
		var scheme = buffer.toString('utf8', 8, schemelen + 8)
		var credlen = buffer.readInt32BE(schemelen + 8)
		var credential = buffer.toString('utf8', schemelen + 12, schemelen + 12 + credlen)
		return new ACL(permissions, new Id(scheme, credential))
	}

	return ACL
}
