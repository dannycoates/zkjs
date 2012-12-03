module.exports = function (logger, Watch) {

	function Watcher() {
		this.child = {}
		this.data = {}
		this.exists = {}
	}

	Watcher.prototype.addChildWatch = function (path, cb) {
		var watches = this.child[path] || []
		watches.push(cb)
		this.child[path] = watches
	}

	Watcher.prototype.addDataWatch = function (path, cb) {
		var watches = this.data[path] || []
		watches.push(cb)
		this.data[path] = watches
	}

	Watcher.prototype.addExistsWatch = function (path, cb) {
		var watches = this.exists[path] || []
		watches.push(cb)
		this.exists[path] = watches
	}

	Watcher.prototype.count = function () {
		return Object.keys(this.child).length +
			Object.keys(this.data).length +
			Object.keys(this.exists).length
	}

	Watcher.prototype.paths = function () {
		return {
			child: Object.keys(this.child),
			data: Object.keys(this.data),
			exists: Object.keys(this.exists)
		}
	}

	Watcher.prototype.reset = function () {
		this.child = {}
		this.data = {}
		this.exists = {}
	}

	Watcher.prototype.fireWatches = function (watches, watch) {
		logger.info(
			'watch: %s', watch,
			'watches', watches.length
		)
		for (var i = 0; i < watches.length; i++) {
			var cb = watches[i]
			if (typeof(cb) === 'function') {
				cb(watch.toJSON())
			}
			else {
				logger.info('wat', cb)
			}
		}
	}

	Watcher.prototype.trigger = function (watch) {
		var path = watch.path
		var watches = []
		switch (watch.type) {
			case Watch.types.DELETE:
				watches = watches
					.concat(this.data[path] || [])
					.concat(this.child[path] || [])
					.concat(this.exists[path] || [])

				delete this.data[path]
				delete this.child[path]
				delete this.exists[path]
				break;
			case Watch.types.CHILD:
				watches = watches.concat(this.child[path] || [])

				delete this.child[path]
				break;
			default:
				watches = watches
					.concat(this.data[path] || [])
					.concat(this.exists[path] || [])

				delete this.data[path]
				delete this.exists[path]
				break;
		}
		this.fireWatches(watches, watch)
	}

	return Watcher
}
