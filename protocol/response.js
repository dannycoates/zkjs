module.exports = function (logger, ZKErrors) {

	function Response(xid, cb) {
		this.xid = xid
		this.cb = cb
	}

	Response.prototype.abort = function () {
		this.cb(new Error('aborted'))
	}

	Response.prototype.parse = function (errno, buffer) {
		this.cb(ZKErrors.toError(errno))
	}

	return Response
}
