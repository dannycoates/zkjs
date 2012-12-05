# zkjs

A *pure* js node client for [ZooKeeper](http://zookeeper.apache.org/)

# Example

```js
var ZK = require('zkjs')

var zk = new ZK({
	hosts: ['localhost:2181', 'localhost:2182', 'localhost:2183'],
	root: '/myapp/root'
})

zk.start(function (err) {

	zk.create(
		'/foo',
		'some ephemeral data',
		ZK.createFlags.EPHEMERAL,
		function (err, path) {
			if (!err) {
				console.log(path, 'was created')
			}
		}
	)

	zk.getChildren(
		'/',
		function (err, children, zstat) {
			if (!err) {
				console.log('/', 'has', children.length, 'children')
			}
		}
	)

	zk.get(
		'/some/known/node',
		function (watch) {
			console.log(watch.path, 'was', watch.type)
		},
		function (err, value, zstat) {
			console.log('the current value is ', value.toString())

			zk.set(
				'/some/known/node',
				'some new data',
				zstat.version,
				function (err, zstat) {
					if (!err) {
						console.log('the new version number is', zstat.version)
					}
				}
			)
		}
	)
})
```

---

# API

## ZK

### new

```js
var ZK = require('zkjs')

var zk = new ZK({
	hosts: ['localhost:2181'], // array of zookeeper instances
	root: '/',                 // the root path for the session
	timeout: 120000,           // requested timeout for the session
	readOnly: false,           // read-only session
	autoResetWatches: true,    // maintain watches if the zookeeper instance changes
	credentials: []            // array of credentials to auth the session with
})
```

### zk.start([callback])

### zk.close()

### zk.create(path, data, [flags], [acls], callback)

### zk.del(path, version, callback)

### zk.exists(path, [watch], callback)

### zk.get(path, [watch], callback)

### zk.getACL(path, callback)

### zk.getChildren(path, [watch], callback)

### zk.mkdirp(path, callback)

### zk.set(path, data, version, callback)

### zk.setACL(path, acls, version, callback)

### zk.sync(path, callback)

### zk.toString()

---

## TODOS

* automatic retry, curator style

# License

MIT
