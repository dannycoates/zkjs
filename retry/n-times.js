module.exports = function () {

	function RetryNTimes(times, wait) {
		this.times = times
		this.wait = wait || 1000
	}

	RetryNTimes.prototype.wrap = function (timeout, retryOn, session, request, cb) {
		var retry = { times: this.times, wait: this.wait }
		var timer = true
		if (timeout) {
			function timeoutCallback() {
				timer = false
				cb.call(session, 102)
			}
			timer = setTimeout(timeoutCallback, timeout)
		}
		function retryNTimes(err) {
			if (!timer) {
				return
			}
			if (err && retryOn.indexOf(err) > -1 && retry.times > 0) {
				console.log('retrying')
				retry.times--
				if (retry.wait) {
					setTimeout(session._resend.bind(session, request, retryNTimes), retry.wait)
				}
				else {
					session._resend(request, retryNTimes)
				}
			}
			else {
				clearTimeout(timer)
				var args = Array.prototype.slice.apply(arguments)
				cb.apply(session, args)
			}
		}
		return retryNTimes
	}

	function make(times, wait) {
		return new RetryNTimes(times)
	}

	return make
}
