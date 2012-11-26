module.exports = function () {
	function ZKErrors() {}

	ZKErrors.RolledBack = 0
	ZKErrors.System = -1
	ZKErrors.RuntimeInconsistency = -2
	ZKErrors.DataInconsistency = -3
	ZKErrors.ConnectionLoss = -4
	ZKErrors.Marshalling = -5
	ZKErrors.Unimplemented = -6
	ZKErrors.OperationTimeout = -7
	ZKErrors.BadArguments = -8
	ZKErrors.API = -100
	ZKErrors.NoNode = -101
	ZKErrors.NoAuth = -102
	ZKErrors.BadVersion = -103
	ZKErrors.NoChildrenForEphemerals = -108
	ZKErrors.NodeExists = -110
	ZKErrors.NotEmpty = -111
	ZKErrors.SessionExpired = -112
	ZKErrors.InvalidCallback = -113
	ZKErrors.InvalidACL = -114
	ZKErrors.AuthFailed = -115
	ZKErrors.SessionMoved = -118
	ZKErrors.NotReadOnlyCall = -119

	return ZKErrors
}
