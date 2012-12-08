module.exports = function () {

	function RetryOnce(wait) {
		this.wait = wait || 1000
	}

	RetryOnce.prototype.wrap = function (session, request, cb) {
		var wait = this.wait
		function retryOnce(err) {
			if (err) {
				//console.log('retryOnce err:', session.errors.toError(err).message)
				if (wait > 0) {
					setTimeout(session._resend.bind(session, request, cb), wait)
				}
				else {
					session._resend(request, cb)
				}
			}
			else {
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
