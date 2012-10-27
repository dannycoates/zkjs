module.exports = function (
	inherits,
	State) {

	function ResponseBody(length) {
		State.call(this, length)
	}
	inherits(ResponseBody, State)

	ResponseBody.prototype.parse = function () {

		console.log(this.toString())
	}

	ResponseBody.prototype.next = function () {
		this.parse()
		return []
	}

	return ResponseBody
}