module.exports = function (format) {

	function Watch(type, state, path) {
		this.type = type
		this.state = state
		this.path = path
	}

	Watch.types = {
		NONE: -1,
		CREATED: 1,
		DELETED: 2,
		CHANGED: 3,
		CHILD: 4
	}

	Watch.states = {
		DISCONNECTED: 0,
		NOSYNCCONNECTED: 1,
		CONNECTED: 3,
		AUTHFAILED: 4,
		CONNECTED_READONLY: 5,
		SASL_AUTHENTICATED: 6,
		EXPIRED: -112
	}

	function number2string(number, enumeration) {
		var names = Object.keys(enumeration)
		for (var i = 0; names.length; i++) {
			if (enumeration[names[i]] === number) {
				return names[i]
			}
		}
		return 'UNKNOWN'
	}

	Watch.prototype.toJSON = function () {
		return {
			type: number2string(this.type, Watch.types).toLowerCase(),
			state: number2string(this.state, Watch.states).toLowerCase(),
			path: this.path
		}
	}

	Watch.prototype.toString = function () {
		return format(
			'Watch(type: %s state: %s path: %s)',
			number2string(this.type, Watch.types),
			number2string(this.state, Watch.states),
			this.path
		)
	}

	Watch.parse = function (buffer) {
		var watch = new Watch()
		watch.type = buffer.readInt32BE(0)
		watch.state = buffer.readInt32BE(4)
		var pathlen = buffer.readInt32BE(8)
		watch.path = buffer.toString('utf8', 12, pathlen + 12)
		return watch
	}

	return Watch
}
