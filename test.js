var Client = require('./index')

var c = new Client()

c.on('connect',
	function () {
		console.log('connected')
		c.exists('/foo', false, function (err, exists, stat) {
			console.log('exists', exists, stat)
			if (exists) {
				c.set('/foo', 'bar', stat.version, function (err, stat) {
					console.log('set', stat)
					c.get('/foo', false, function (err, data, stat) {
						console.log('get', data.toString())
						console.log('stat', stat)
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
