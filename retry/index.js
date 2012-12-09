function makeTimeoutTimer(timeout, session, cb) {
	if (!timeout) {
		return true
	}
	function timeoutCallback() {
		timer = false
		cb.call(session, 102)
	}
	var timer = setTimeout(timeoutCallback, timeout)
	return timer

}

var retry = {
	no: require('./no')(makeTimeoutTimer),
	once: require('./once')(makeTimeoutTimer),
	nTimes: require('./n-times')(makeTimeoutTimer),
	elapsed: require('./elapsed')(makeTimeoutTimer),
	exponential: require('./exponential')(makeTimeoutTimer)
}

module.exports = retry
