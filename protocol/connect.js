module.exports = function (logger, inherits, Response, ZKErrors) {

	// NOTE: lastZxid and sessionId are supposed to be 64bit integers,
	// however as long as we treat them as opaque blobs we can use doubles.
	function ConnectRequest(
		lastZxid,
		timeout,
		sessionId,
		password,
		readOnly) {
		this.protocolVersion = 0
		this.lastZxid = lastZxid
		this.timeout = timeout
		this.sessionId = sessionId
		this.password = password || 'AA==' //base64 of '\0'
		this.readOnly = readOnly
	}

	ConnectRequest.prototype.toBuffer = function () {
		var pwlen = Buffer.byteLength(this.password)
		var data = new Buffer(28 + (pwlen ? pwlen + 1 : 0))
		data.writeInt32BE(this.protocolVersion, 0)
		data.writeDoubleBE(this.lastZxid, 4)
		data.writeInt32BE(this.timeout, 12)
		data.writeDoubleBE(this.sessionId, 16)
		if (pwlen > 0) {
			data.writeInt32BE(pwlen || -1, 24)
			data.write(this.password, 28, pwlen, 'base64')
		}
		data.writeInt8(this.readOnly ? 1 : 0, data.length - 1)
		return data
	}

	ConnectRequest.prototype.response = function (cb) {
		return new ConnectResponse(cb)
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
		this.password = buffer.slice(20, 20 + len).toString('base64')
		this.readOnly = buffer.readInt8(buffer.length - 1) === 1

		if (this.timeout <= 0) {
			err = new Error('Session Expired')
		}
		this.cb(err, this.timeout, this.sessionId, this.password, this.readOnly)
	}

	return ConnectRequest
}
