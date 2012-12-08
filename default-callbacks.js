// some default callbacks, useful for repl testing
module.exports = function (logger, ZKErrors) {
	var defaults = {
		create:
			function defaultCreate(err, path) {
				if (err) {
					return logger.error(ZKErrors.toError(err).message)
				}
				logger.info('created', path)
			},
		del:
			function defaultDel(err) {
				if (err) {
					return logger.error(ZKErrors.toError(err).message)
				}
				logger.info('deleted')
			},
		exists:
			function defaultExists(err, exists, stat) {
				if (err) {
					return logger.error(ZKErrors.toError(err).message)
				}
				if (!exists) {
					logger.info('does not exist')
				}
				else {
					logger.info(stat.toString())
				}
			},
		get:
			function defaultGet(err, data, stat) {
				if (err) {
					return logger.error(ZKErrors.toError(err).message)
				}
				logger.info(
					'length: %d data: %s stat: %s',
					data.length,
					data.toString('utf8', 0, Math.min(data.length, 256)),
					stat
				)
			},
		getACL:
			function defaultGetACL(err, acls, stat) {
				if (err) {
					return logger.error(ZKErrors.toError(err).message)
				}
				logger.info(
					'acls: [%s] stat: %s',
					acls.join(','),
					stat
				)
			},
		getChildren:
			function defaultGetChildren(err, children, stat) {
				if (err) {
					return logger.error(ZKErrors.toError(err).message)
				}
				logger.info(
					'children: [%s] stat: %s',
					children.join(','),
					stat
				)
			},
		set:
			function defaultSet(err, stat) {
				if (err) {
					return logger.error(ZKErrors.toError(err).message)
				}
				logger.info(
					'set stat: %s',
					stat
				)
			}
	}

	return defaults
}
