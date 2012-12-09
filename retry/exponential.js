module.exports = function (makeTimeoutTimer) {

	function RetryExponential(times, wait, maxWait) {
		this.times = times || 5
		this.wait = wait || 1000
		this.maxWait = maxWait || Number.MAX_VALUE
	}

	function exponentialBackoff(wait, times) {
		return wait * Math.random() * Math.pow(2, times)
	}

	RetryExponential.prototype.wrap = function (timeout, retryOn, session, request, cb) {
		var retry = {
			times: this.times,
			wait: this.wait,
			maxWait: this.maxWait,
			count: 0
		}
		var timer = makeTimeoutTimer(timeout, session, cb)
		function retryExponential(err) {
			if (!timer) {
				return
			}
			if (err && retryOn.indexOf(err) > -1 && retry.count < retry.times) {
				console.log('retrying')
				if (retry.wait) {
					var wait = Math.min(
						exponentialBackoff(retry.wait, retry.count++),
						retry.maxWait
					)
					setTimeout(
						session._resend.bind(session, request, retryExponential),
						wait
					)
				}
				else {
					session._resend(request, retryExponential)
				}
			}
			else {
				clearTimeout(timer)
				var args = Array.prototype.slice.apply(arguments)
				cb.apply(session, args)
			}
		}
		return retryExponential
	}

	function make(times, wait, maxWait) {
		return new RetryExponential(times, wait, maxWait)
	}

	return make
}
