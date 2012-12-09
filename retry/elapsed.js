module.exports = function (makeTimeoutTimer) {

	function RetryElapsed(timespan, wait) {
		this.timespan = timespan
		this.wait = wait || 1000
	}

	RetryElapsed.prototype.wrap = function (timeout, retryOn, session, request, cb) {
		var end = Date.now() + this.timespan
		var wait = this.wait
		var timer = makeTimeoutTimer(timeout, session, cb)
		function retryElapsed(err) {
			if (!timer) {
				return // we've already timed out
			}
			if (err && retryOn.indexOf(err) > -1 && Date.now() < end) {
				console.log('retrying')
				if (wait) {
					setTimeout(session._resend.bind(session, request, retryElapsed), wait)
				}
				else {
					session._resend(request, retryElapsed)
				}
			}
			else {
				clearTimout(timer)
				var args = Array.prototype.slice.apply(arguments)
				cb.apply(session, args)
			}
		}
		return retryElapsed
	}

	function make(timespan, wait) {
		return new RetryElapsed(timespan, wait)
	}

	return make
}
