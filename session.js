module.exports = function (
	logger,
	assert,
	format,
	inherits,
	EventEmitter,
	paths,
	Ensemble,
	Watcher,
	Auth,
	Close,
	Connect,
	Create,
	Delete,
	Exists,
	GetACL,
	GetChildren,
	GetData,
	SetACL,
	SetData,
	SetWatches,
	Sync,
	defaults) {

	function Session(options) {
		options = options || {}
		options.timeout = options.timeout || 1200000
		options.readOnly = options.readOnly || false
		options.autoResetWatches =
			options.hasOwnProperty('autoResetWatches') ? options.autoResetWatches : true

		this.options = options
		this.lastZxid = 0
		this.timeout = options.timeout
		this.id = 0
		this.password = Connect.BLANK_PASSWORD
		this.readOnly = options.readOnly
		this.xid = 1
		this.credentials = options.credentials || []
		this.root = options.root || ''
		this.hosts = options.hosts || ['localhost:2181']
		this.watcher = new Watcher()

		this.ensemble = new Ensemble(this)
		this.onEnsembleZxid = ensembleZxid.bind(this)
		this.onEnsembleWatch = ensembleWatch.bind(this)
		this.onEnsembleExpired = ensembleExpired.bind(this)
		this.ensemble.on('zxid', this.onEnsembleZxid)
		this.ensemble.on('watch', this.onEnsembleWatch)
		this.ensemble.on('expired', this.onEnsembleExpired)

		this.onClose = onClose.bind(this)

		EventEmitter.call(this)
	}
	inherits(Session, EventEmitter)

	Session.createFlags = Create.flags

	//API

	Session.prototype.start = function (cb) {
		if (typeof(cb) === 'function') {
			this.ensemble.once('connect')
		}
		this.ensemble.session = this
		this.ensemble.connect()
	}

	Session.prototype.auth = function (id, cb) {
		assert(id, 'id is required')
		this._send(new Auth(0, id), cb)
	}

	Session.prototype.close = function () {
		this._send(Close.instance, this.onClose)
	}

	Session.prototype.create = function (path, data, flags, acls, cb) {
		assert(typeof(path) === 'string', 'path is required')
		assert(data !== undefined, 'data is required')

		if(!Buffer.isBuffer(data)) {
			data = new Buffer(data.toString())
		}
		//optional parameter shenanigans
		if (cb === undefined) {
			if (acls === undefined) {
				if (flags === undefined) {
					// path, data
					cb = defaults.create
					flags = Create.flags.NONE
					acls = null
				}
				else if (Array.isArray(flags)) {
					// path, data, acls
					cb = defaults.create
					acls = flags
					flags = Create.flags.NONE
				}
				else if (typeof(flags) === 'function') {
					// path, data, cb
					cb = flags
					flags = Create.flags.NONE
					acls = null
				}
				else {
					// path, data, flags
					cb = defaults.create
					acls = null
				}
			}
			else if (Array.isArray(flags)) {
				// path, data, acls, cb
				acls = flags
				cb = acls
				flags = Create.flags.NONE
			}
			else if (Array.isArray(acls)) {
				// path, data, flags, acls
				cb = defaults.create
			}
			else {
				// path, data, flags, cb
				cb = acls
				acls = null
			}
		}
		this._send(
			new Create(this._chroot(path), data, acls, flags, this.xid++),
			function (err, path) {
				cb(err, this._unchroot(path))
			}.bind(this)
		)
	}

	Session.prototype.del = function (path, version, cb) {
		assert(typeof(path) === 'string', 'path is required')
		assert(typeof(version) === 'number', 'version is required')

		cb = cb || defaults.del
		this._send(new Delete(this._chroot(path), version, this.xid++), cb)
	}

	Session.prototype.exists = function (path, watch, cb) {
		assert(typeof(path) === 'string', 'path is required')

		if (cb === undefined) {
			if (typeof(watch) === 'function') {
				// path, cb
				cb = watch
			}
			else {
				// path
				cb = defaults.exists
			}
			watch = false
		}
		this._send(
			new Exists(this._chroot(path), watch, this.xid++),
			function (err, exists, stat) {
				if (!err && watch) {
					this.watcher.addExistsWatch(path, watch)
				}
				cb(err, exists, stat)
			}.bind(this)
		)
	}

	Session.prototype.get = function (path, watch, cb) {
		assert(typeof(path) === 'string', 'path is required')

		if (cb === undefined) {
			if (typeof(watch) === 'function') {
				// path, cb
				cb = watch
			}
			else {
				// path
				cb = defaults.get
			}
			watch = false
		}
		this._send(
			new GetData(this._chroot(path), watch, this.xid++),
			function (err, data, stat) {
				if (!err && watch) {
					this.watcher.addDataWatch(path, watch)
				}
				cb(err, data, stat)
			}.bind(this)
		)
	}

	Session.prototype.getACL = function (path, cb) {
		assert(typeof(path) === 'string', 'path is required')

		this._send(new GetACL(this._chroot(path), this.xid++), cb || defaults.getACL)
	}

	Session.prototype.getChildren = function (path, watch, cb) {
		assert(typeof(path) === 'string', 'path is required')

		if (cb === undefined) {
			if (typeof(watch) === 'function') {
				// path, cb
				cb = watch
			}
			else {
				cb = defaults.getChildren
			}
			watch = false
		}
		this._send(
			new GetChildren(this._chroot(path), watch, this.xid++),
			function (err, children, stat) {
				if (!err && watch) {
					this.watcher.addChildWatch(path, watch)
				}
				cb(err, children, stat)
			}.bind(this)
		)
	}

	Session.prototype.mkdirp = function (path, cb) {
		assert(typeof(path) === 'string', 'path is required')

		cb = cb || defaults.create
		this.exists(
			path,
			false,
			function (err, exists) {
				if (exists) {
					return cb(null, path)
				}
				this.mkdirp(
					path + '/..',
					function (err, actualPath) {
						this.create(path, '', cb)
					}.bind(this)
				)
			}.bind(this)
		)
	}

	Session.prototype.rmrf = function (path, cb) {
		assert(false, 'Not Implemented')
	}

	Session.prototype.set = function (path, data, version, cb) {
		assert(typeof(path) === 'string', 'path is required')
		assert(data !== undefined, 'data is required')
		assert(typeof(version) === 'number', 'version is required')

		if (!Buffer.isBuffer(data)) {
			data = new Buffer(data.toString())
		}
		this._send(
			new SetData(this._chroot(path), data, version, this.xid++),
			cb || defaults.set
		)
	}

	Session.prototype.setACL = function (path, acls, version, cb) {
		assert(typeof(path) === 'string', 'path is required')
		assert(Array.isArray(acls), 'an array of acls is required')
		assert(typeof(version) === 'number', 'version is required')

		this._send(new SetACL(this._chroot(path), acls, version, this.xid++), cb)
	}

	Session.prototype.sync = function (path, cb) {
		assert(typeof(path) === 'string', 'path is required')

		this._send(
			new Sync(this._chroot(path), this.xid++),
			function (err, path) {
				cb(err, this._unchroot(path))
			}.bind(this)
		)
	}

	Session.prototype.toString = function () {
		var idBuffer = new Buffer(8)
		var zxidBuffer = new Buffer(8)

		idBuffer.writeDoubleBE(this.id, 0)
		zxidBuffer.writeDoubleBE(this.lastZxid, 0)
		return format(
			'Session(id: %s zxid: %s t/o: %d pw: %s r/o: %s xid: %d root: "%s")',
			idBuffer.toString('hex'),
			zxidBuffer.toString('hex'),
			this.timeout,
			this.password.toString('hex'),
			this.readOnly,
			this.xid,
			this.root
		)
	}

	// internal API

	Session.prototype._chroot = function (path) {
		path = paths.join(this.root, path)
		if (path.length > 1 && path[path.length - 1] === '/') {
			path = path.substring(0, path.length - 1)
		}
		return path
	}

	Session.prototype._unchroot = function (path) {
		if (!path) {
			return null
		}
		return path.substr(this.root.length)
	}

	Session.prototype.login = function (cb) {
		this._send(
			new Connect(
				this.lastZxid,
				this.timeout,
				this.id,
				this.password,
				this.readOnly
			),
			cb
		)
	}

	Session.prototype._reset = function () {
		this.timeout = this.options.timeout
		this.id = 0
		this.password = Connect.BLANK_PASSWORD
		this.readOnly = this.options.readOnly
	}


	Session.prototype.sendCredentials = function (cb) {
		this._chain(
			this.credentials.map(
				function (id) {
					return new Auth(0, id)
				}
			),
			cb
		)
	}

	Session.prototype._chain = function (requests, cb) {
		var request = requests.pop()
		if (request) {
			this._send(
				request,
				function onResponse(err) {
					if (err) {
						return cb(err)
					}
					this._chain(requests, cb);
				}.bind(this)
			)
		}
		else {
			cb()
		}
	}

	Session.prototype._send = function (request, cb) {
			this.ensemble.send(request, cb)
	}

	Session.prototype.setParameters = function(id, password, timeout, readOnly) {
		this.id = id
		this.password = password
		this.timeout = timeout
		this.readOnly = readOnly
	}

	Session.prototype.setWatches = function () {
		if (this.options.autoResetWatches) {
			if (this.watcher.count() > 0) {
				var chroot = this._chroot.bind(this)
				var watchPaths = this.watcher.paths()
				watchPaths.child = watchPaths.child.map(chroot)
				watchPaths.data = watchPaths.data.map(chroot)
				watchPaths.exists = watchPaths.exists.map(chroot)

				this._send(
					new SetWatches(this.lastZxid, this.watcher.paths()),
					function (err) {
						logger.info('set-watches error: %s', err)
					}
				)
			}
		}
		else {
			this.watcher.reset()
		}
	}

	// Event handlers

	function onClose() {
		this._reset()
	}

	function ensembleExpired() {
		this._reset()
		this.emit('expired')
	}

	function ensembleZxid(zxid) {
		this.lastZxid = zxid
	}

	function ensembleWatch(watch) {
		watch.path = this._unchroot(watch.path)
		this.watcher.trigger(watch)
		this.emit(watch.toJSON().type.toLowerCase(), watch.path)
	}

	return Session
}
