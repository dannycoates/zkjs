module.exports = function () {

	function RetryExponential(times, wait, maxWait) {
		this.times = times || 5
		this.wait = wait || 1000
		this.maxWait = maxWait || Number.MAX_VALUE
	}

	function exponentialBackoff(wait, times) {
		return wait * Math.random() * Math.pow(2, times)
	}

	RetryExponential.prototype.wrap = function (session, request, cb) {
		var retry = {
			times: this.times,
			wait: this.wait,
			maxWait: this.maxWait,
			count: 0
		}
		function retryExponential(err) {
			if (err && retry.count < retry.times) {
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
