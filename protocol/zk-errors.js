module.exports = function () {
	var errors = {
		RequestTimeout: 102,
		Aborted: 101,
		OK: 0,
		System: -1,
		RuntimeInconsistency: -2,
		DataInconsistency: -3,
		ConnectionLoss: -4,
		Marshalling: -5,
		Unimplemented: -6,
		OperationTimeout: -7,
		BadArguments: -8,
		API: -100,
		NoNode: -101,
		NoAuth: -102,
		BadVersion: -103,
		NoChildrenForEphemerals: -108,
		NodeExists: -110,
		NotEmpty: -111,
		SessionExpired: -112,
		InvalidCallback: -113,
		InvalidACL: -114,
		AuthFailed: -115,
		SessionMoved: -118,
		NotReadOnlyCall: -119,
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
		errors.Aborted,
		errors.ConnectionLoss,
		errors.OperationTimeout,
		errors.SessionMoved
	]

	ZKErrors.toError = function (errno) {
		if (errno === 0) {
			return null
		}
		return new Error(errorNumbers[errno])
	}

	return ZKErrors
}
