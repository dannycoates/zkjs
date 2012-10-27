module.exports = function (
	inherits,
	State) {

	function ResponseHeader(ResponseBody) {
		this.length = 0
		this.ResponseBody = ResponseBody
		State.call(this, 4)
	}
	inherits(ResponseHeader, State)

	ResponseHeader.prototype.parse = function () {
		this.length = this.buffer.readUInt32BE(0)
	}

	ResponseHeader.prototype.next = function () {
		this.parse()
		return new this.ResponseBody(this.length)
	}

	return ResponseHeader
}