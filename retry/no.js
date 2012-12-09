module.exports = function (makeTimeoutTimer) {

	function NoRetry() {}

	NoRetry.prototype.wrap = function (timeout, retryOn, session, request, cb) {
		if (timeout) {
			var timer = makeTimeoutTimer(timeout, session, cb)
			function requestCallback(err) {
				if (!timer) {
					return
				}
				clearTimeout(timer)
				var args = Array.prototype.slice.apply(arguments)
				cb.apply(session, args)
			}
			return requestCallback
		}
		return cb
	}

	function make() {
		return new NoRetry()
	}

	return make
}
