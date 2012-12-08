var retry = {
	no: require('./no')(),
	once: require('./once')(),
	nTimes: require('./n-times')(),
	elapsed: require('./elapsed')(),
	exponential: require('./exponential')()
}

module.exports = retry
