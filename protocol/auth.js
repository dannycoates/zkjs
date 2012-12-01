module.exports = function (ZKErrors) {

	function Auth(authType, id) {
		this.xid = -4
		this.type = 100
		this.authType = authType
		this.id = id
	}

	Auth.prototype.toBuffer = function () {
		var idData = this.id.toBuffer()
		var data = new Buffer(4 + 4 + 4 + idData.length)
		data.writeInt32BE(this.xid, 0)
		data.writeInt32BE(this.type, 4)
		data.writeInt32BE(this.authType, 8)
		idData.copy(data, 12)
		return data
	}

	Auth.prototype.response = function (cb) {
		return new AuthResponse(this.xid, cb)
	}

	function AuthResponse(xid, cb) {
		this.xid = xid
		this.cb = cb
	}

	AuthResponse.prototype.parse = function (errno, buffer) {
		return this.cb(ZKErrors.toError(errno))
	}

	return Auth
}
