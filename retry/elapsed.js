module.exports = function () {

	function RetryElapsed(timespan, wait) {
		this.timespan = timespan
		this.wait = wait || 1000
	}

	RetryElapsed.prototype.wrap = function (retryOn, session, request, cb) {
		var end = Date.now() + this.timespan
		var wait = this.wait
		function retryElapsed(err) {
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
