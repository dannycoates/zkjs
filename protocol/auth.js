module.exports = function (inherits, Request, Response) {

	function Auth(authType, id) {
		Request.call(this, Request.types.AUTH, -4, AuthResponse)
		this.authType = authType
		this.id = id
	}
	inherits(Auth, Request)

	Auth.prototype.toBuffer = function () {
		var idData = this.id.toBuffer()
		var data = new Buffer(4 + 4 + 4 + idData.length)
		data.writeInt32BE(this.authType, 0)
		idData.copy(data, 4)
		return data
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
