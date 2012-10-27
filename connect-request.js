module.exports = function (
	inherits,
	State,
	int53,
	Response) {

	function ConnectBody(length) {
		this.protocolVersion = 0
		this.timeout = 0
		this.sessionId = 0
		this.password = ''
		this.readOnly = false
		State.call(this, length)
	}
	inherits(ConnectBody, State)

	ConnectBody.prototype.next = function () {
		this.parse()
		return []
	}

	ConnectBody.prototype.parse = function () {
		var b = this.buffer
		this.protocolVersion = b.readInt32BE(0)
		this.timeout = b.readInt32BE(4)
		this.sessionId = [b.readUInt32BE(8), b.readUInt32BE(12)]
		var len = b.readInt32BE(16)
		this.password = b.slice(20, 20 + len).toString()
		this.readOnly = b.readInt8(b.length - 1) === 1
	}

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
		this.password = password || ''
		this.readOnly = readOnly
	}

	ConnectRequest.prototype.toBuffer = function () {
		var pwlen = Buffer.byteLength(this.password)
		var data = new Buffer(28 + (pwlen ? pwlen + 1 : 0))
		data.writeInt32BE(this.protocolVersion, 0)
		int53.writeInt64BE(this.lastZxid, data, 4)
		data.writeInt32BE(this.timeout, 12)
		int53.writeInt64BE(this.sessionId, data, 16)
		if (pwlen > 0) {
			data.writeInt32BE(pwlen || -1, 24)
			data.write(this.password, 28)
		}
		data.writeInt8(this.readOnly ? 1 : 0, data.length - 1)
		return data
	}

	ConnectRequest.prototype.response = function (cb) {
		return new Response(ConnectBody, cb)
	}

	return ConnectRequest
}