var ZK = require('./index')

var zk = new ZK({
	hosts: ['localhost:2181', 'localhost:2182', 'localhost:2183'],
	readOnly: true
})

zk.start()
zk.create('/foo', 'bar', zk.create.EPHEMERAL)
zk.once('started',
	function () {
		console.log('connected')

		setInterval(
			function () {
				zk.exists('/foo')
			},
			500
		)
	}
)
