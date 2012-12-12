module.exports = function () {
	var errors = {
		ROLLEDBACK: 103,
		REQUESTTIMEOUT: 102,
		ABORTED: 101,
		OK: 0,
		SYSTEM: -1,
		RUNTIMEINCONSISTENCY: -2,
		DATAINCONSISTENCY: -3,
		CONNECTIONLOSS: -4,
		MARSHALLING: -5,
		UNIMPLEMENTED: -6,
		OPERATIONTIMEOUT: -7,
		BADARGUMENTS: -8,
		API: -100,
		NONODE: -101,
		NOAUTH: -102,
		BADVERSION: -103,
		NOCHILDRENFOREPHEMERALS: -108,
		NODEEXISTS: -110,
		NOTEMPTY: -111,
		SESSIONEXPIRED: -112,
		INVALIDCALLBACK: -113,
		INVALIDACL: -114,
		AUTHFAILED: -115,
		SESSIONMOVED: -118,
		NOTREADONLYCALL: -119,
	}

	var errorNumbers = {}

	function ZKErrors() {}

	Object.keys(errors).forEach(
		function (name) {
			ZKErrors[name] = errors[name]
			errorNumbers[errors[name]] = name
		}
	)

	ZKErrors.RETRY_DEFAULTS = [
		errors.ABORTED,
		errors.CONNECTIONLOSS,
		errors.OPERATIONTIMEOUT,
		errors.SESSIONMOVED
	]

	ZKErrors.toError = function (errno) {
		if (errno === 0) {
			return null
		}
		return new Error(errorNumbers[errno])
	}

	return ZKErrors
}
