# zkjs

A js node client for [ZooKeeper](http://zookeeper.apache.org/)

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

Start a ZooKeeper session.

__Arguments__

* callback(err) - An _optional_ callback. If `err` is defined the connection failed.

### zk.close()

Close the ZooKeeper session and it's connection

### zk.create(path, data, [flags], [acls], callback)

Create a new node

__Arguments__

* path - path of the new node
* data - the value to set
* flags - _optional_ `ZK.createFlags`
* acls - _optional_ array of ACL objects
* callback(err, path) - returns an Error or the path that was created

__Constants__

```js
ZK.createFlags.NONE
ZK.createFlags.EPHEMERAL
ZK.createFlags.SEQUENCE
ZK.createFlags.EPHEMERAL_SEQUENCE
```

### zk.del(path, version, callback)

Delete a node

__Arguments__

* path - path of the node
* version - the version of the node

### zk.exists(path, [watch], callback)

Checks whether a node exists

__Arguments__

* path - path of the node
* watch(info) - _optional_ register a function that will be called if this path changes
* callback(err, exists, zstat) - returns an Error or boolean and stat info

### zk.get(path, [watch], callback)

Get the value of a node

__Arguments__

* path - path of the node
* watch(info) - _optional_ register a function that will be called if this path changes
* callback(err, data, zstat) - returns an Error or data and stat info

### zk.getACL(path, callback)

Get ACL information of a node

__Arguments__

* path - path of the node
* callback(err, acls, zstat) - returns an Error or an array of ACLs and stat info

### zk.getChildren(path, [watch], callback)

Get the children of a node

__Arguments__

* path - path of the node
* watch(info) - _optional_ register a function that will be called if this path's children
* callback(err, children, zstat) - returns an Error or an array of child names and stat info

### zk.mkdirp(path, callback)

Create a path of nodes

__Arguments__

* path - the path to create
* callback(err) - returns an Error if the path wasn't created

### zk.set(path, data, version, callback)

Set the value of a node

__Arguments__

* path - path of the node
* data - data to set
* version - most recent version number of the node
* callback(err, zstat) - returns an Error or stat info

### zk.setACL(path, acls, version, callback)

Sets the ACL of a node

__Arguments__

* path - path of the node
* acls - array of ACLs to set
* version - the latest ACL version number of the node
* callback(err, zstat) - returns an Error or stat info

### zk.sync(path, callback)

Sync the node with the leader

__Arguments__

* path - path of the node
* callback(err, path) - returns an Error or the path

### zk.toString()

A string value of the session. For debugging.

---

## TODOS

* automatic retry, curator style

# License

MIT
