module.exports = function (logger) {
	function Request(type, xid, ResponseType) {
		this.type = type
		this.xid = xid
		this._responseCallback = null
		this.ResponseType = ResponseType
	}

	Request.prototype.response = function () {
		if (this._responseCallback) {
			return new this.ResponseType(this.xid, this._responseCallback)
		}
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
