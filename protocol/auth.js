module.exports = function (inherits, Request, Response) {

	function Auth(authType, id) {
		Request.call(this, 100, -4)
		this.authType = authType
		this.id = id
	}
	inherits(Auth, Request)

	Auth.prototype.toBuffer = function () {
		var idData = this.id.toBuffer()
		var data = new Buffer(4 + 4 + 4 + idData.length)
		data.writeInt32BE(this.xid, 0)
		data.writeInt32BE(this.type, 4)
		data.writeInt32BE(this.authType, 8)
		idData.copy(data, 12)
		return data
	}

	Auth.prototype.response = function () {
		return new AuthResponse(this.xid, this.responseCallback())
	}

	function AuthResponse(xid, cb) {
		Response.call(this, xid, cb)
	}
	inherits(AuthResponse, Response)

	AuthResponse.prototype.parse = function (errno, buffer) {
		return this.cb(errno)
	}

	return Auth
}
