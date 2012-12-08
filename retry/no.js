module.exports = function () {

	function NoRetry() {}

	NoRetry.prototype.wrap = function (retryOn, session, request, cb) {
		return cb
	}

	function make() {
		return new NoRetry()
	}

	return make
}
