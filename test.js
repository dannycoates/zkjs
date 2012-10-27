var Client = require('./index')

var c = new Client()

c.connect()

c.on('connect',
	function () {
		console.log('connected')
	}
)
