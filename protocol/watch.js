module.exports = function (format) {

	var EVENTS = ['', 'CREATED', 'DELETED', 'CHANGED', 'CHILD']

	function Watch(type, state, path) {
		this.type = type
		this.state = state
		this.path = path
	}

	Watch.prototype.toString = function () {
		return format(
			'Watch(type: %s state: %d path: %s)',
			this.type,
			this.state,
			this.path
		)
	}

	Watch.parse = function (buffer) {
		var watch = new Watch()
		watch.type = EVENTS[buffer.readInt32BE(0)]
		watch.state = buffer.readInt32BE(4)
		var pathlen = buffer.readInt32BE(8)
		watch.path = buffer.toString('utf8', 12, pathlen + 12)
		return watch
	}

	return Watch
}
