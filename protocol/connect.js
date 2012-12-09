module.exports = function (logger, inherits, Response, ZKErrors) {


	var BLANK_PASSWORD = new Buffer(16)
	BLANK_PASSWORD.fill(0)
	// NOTE: lastZxid and sessionId are supposed to be 64bit integers,
	// however as long as we treat them as opaque blobs we can use doubles.
	function ConnectRequest(
		lastZxid,
		timeout,
		sessionId,
		password,
		readOnly,
		cb) {
		this.protocolVersion = 0
		this.lastZxid = lastZxid
		this.timeout = timeout
		this.sessionId = sessionId
		this.password = password || BLANK_PASSWORD
		this.readOnly = readOnly
		this._responseCallback = cb
	}

	ConnectRequest.BLANK_PASSWORD = BLANK_PASSWORD

	ConnectRequest.prototype.toBuffer = function () {
		var pwlen = this.password.length
		var data = new Buffer(4 + 8 + 4 + 8 + 4 + pwlen + 1)
		data.writeInt32BE(this.protocolVersion, 0)
		data.writeDoubleBE(this.lastZxid, 4)
		data.writeInt32BE(this.timeout, 12)
		data.writeDoubleBE(this.sessionId, 16)
		data.writeInt32BE(pwlen, 24)
		this.password.copy(data, 28)
		data.writeInt8(this.readOnly ? 1 : 0, data.length - 1)
		return data
	}

	ConnectRequest.prototype.response = function () {
		return new ConnectResponse(this._responseCallback)
	}

	function ConnectResponse(cb) {
		Response.call(this, 0, cb)
		this.protocolVersion = 0
		this.timeout = 0
		this.sessionId = 0
		this.password = ''
		this.readOnly = false
	}
	inherits(ConnectResponse, Response)

	ConnectResponse.prototype.parse = function (errno, buffer) {
		// Note: errno is meaningless in this case because Connect requests don't
		// have a header like normal requests.
		var err = null
		this.protocolVersion = buffer.readInt32BE(0)
		this.timeout = buffer.readInt32BE(4)
		this.sessionId = buffer.readDoubleBE(8)
		var len = buffer.readInt32BE(16)
		this.password = new Buffer(len)
		buffer.copy(this.password, 0, 20, 20 + len)
		this.readOnly = buffer.readInt8(buffer.length - 1) === 1

		if (this.timeout <= 0) {
			err = ZKErrors.SESSIONEXPIRED
		}
		this.cb(err, this.timeout, this.sessionId, this.password, this.readOnly)
	}

	return ConnectRequest
}
