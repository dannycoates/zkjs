module.exports = function () {

	function NoRetry() {}

	NoRetry.prototype.wrap = function (timeout, retryOn, session, request, cb) {
		if (timeout) {
			function timeoutCallback() {
				timer = false
				cb.call(session, 102)
			}
			var timer = setTimeout(timeoutCallback, timeout)

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
