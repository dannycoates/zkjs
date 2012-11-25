var Client = require('./index')

var c = new Client()

c.on('connect',
	function () {
		console.log('connected')
		c.exists('/foo')
	}
)
