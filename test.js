var Client = require('./index')

var c = new Client()

c.on('connect',
	function () {
		console.log('connected')
		c.exists('/foo', false, function (err, exists, stat) {
			console.log('exists', exists, stat)
			if (exists) {
				c.set('/foo', Math.random(), stat.version, function (err, stat) {
					console.log('set', stat)
					c.get('/foo', false, function (err, data, stat) {
						console.log('get', data.toString())
						console.log('stat', stat)
						c.sync('/foo/bar', function (err, path) {
							console.log('sync', path)
						})
					})
					c.getChildren('/foo', false, function (err, children, stat) {
						console.log('children', children)
						console.log('stat', stat)
						// c.del('/foo/bar2', 0, function (err) {
						// 	console.log('del')
						// })
						c.setACL('/foo', null, stat.aversion, function (err, stat) {
							console.log('set acl', stat)
						})
					})
				})
			}
			else {
				c.create('/foo', 'tada', 0, function (err, path) {
					console.log('create', path)
				})
			}
		})
	}
)
