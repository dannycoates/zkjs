var ZK = require('./index')

var zk = new ZK({
	hosts: ['localhost:2181', 'localhost:2182', 'localhost:2183'],
	readOnly: true,
	logger: console
})

zk.start()
zk.create('/foo', 'bar', zk.create.EPHEMERAL)
zk.once('started',
	function () {
		console.log('connected')

		zk.exists('/foo')
		zk.getChildren('/')
		zk.get('/foo')
		zk.set('/foo', 'test', 0)
		zk.del('/foo', 1)
		zk.exists('/foo')
		zk.close()
	}
)
