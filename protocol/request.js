module.exports = function (logger) {
	function Request(type, xid, ResponseType) {
		this.type = type
		this.xid = xid
		this._responseCallback = null
		this.ResponseType = ResponseType
	}

	Request.types = {
		CLOSE: -11,
		CREATE: 1,
		DELETE: 2,
		EXISTS: 3,
		GETDATA: 4,
		SETDATA: 5,
		GETACL: 6,
		SETACL: 7,
		SYNC: 9,
		PING: 11,
		GETCHILDREN: 12,
		CHECKVERSION: 13,
		TRANSACTION: 14,
		AUTH: 100,
		SETWATCHES: 101
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
