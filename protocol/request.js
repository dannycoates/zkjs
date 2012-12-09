module.exports = function (logger) {
	function Request(type, xid) {
		this.type = type
		this.xid = xid
		this._responseCallback = null
	}

	Request.prototype.response = function () {
		return null
	}

	Request.prototype.responseCallback = function (cb) {
		if (cb !== undefined) {
			this._responseCallback = cb
		}
		return this._responseCallback
	}

	Request.prototype.toBuffer = function () {
		return new Buffer(0)
	}

	return Request
}
