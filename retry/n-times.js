module.exports = function () {

	function RetryNTimes(times, wait) {
		this.times = times
		this.wait = wait || 1000
	}

	RetryNTimes.prototype.wrap = function (session, request, cb) {
		var retry = { times: this.times, wait: this.wait }
		function retryNTimes(err) {
			if (err && retry.times > 0) {
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
