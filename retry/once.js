module.exports = function (makeTimeoutTimer) {

	function RetryOnce(wait) {
		this.wait = wait || 1000
	}

	RetryOnce.prototype.wrap = function (timeout, retryOn, session, request, cb) {
		var wait = this.wait
		var timer = makeTimeoutTimer(timeout, session, cb)
		function retryOnce(err) {
			if (!timer) {
				return
			}
			if (err && retryOn.indexOf(err) > -1) {
				//console.log('retryOnce err:', session.errors.toError(err).message)
				if (wait > 0) {
					setTimeout(session._resend.bind(session, request, cb), wait)
				}
				else {
					session._resend(request, cb)
				}
			}
			else {
				clearTimeout(timer)
				var args = Array.prototype.slice.apply(arguments)
				cb.apply(session, args)
			}
		}
		return retryOnce
	}

	function make(wait) {
		return new RetryOnce(wait)
	}

	return make
}
