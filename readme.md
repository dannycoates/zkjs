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
		ZK.create.EPHEMERAL,
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
	hosts: ['localhost:2181'],   // array of zookeeper instances
	root: '/',                   // the root path for the session
	timeout: 120000,             // requested timeout for the session
	readOnly: false,             // allow read-only connections
	maxReconnectAttempts: 15,    // number of attempts to re-establish a connection
	retryPolicy: ZK.retry.no()   // default retry policy
	autoResetWatches: true,      // maintain watches if the zookeeper instance changes
	credentials: []              // array of credentials to auth the session with
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
* flags - _optional_ `ZK.create` flags
* acls - _optional_ array of ACL objects
* callback(err, path) - returns an Error or the path that was created

__Flags__

```js
ZK.create.NONE
ZK.create.EPHEMERAL
ZK.create.SEQUENCE
ZK.create.EPHEMERAL_SEQUENCE
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

### Events

__started__

The session is ready to use... or not.

```js
zk.on('started', function (err) {
	if (err) {
		// well, now what?
	}
})
```

__connected__

The session connected to a new ZooKeeper server. This may be emitted more than
once per session.

__disconnected__

The session disconnected from a ZooKeeper server. This may be emitted more than
once per session. It is recommended to stop issuing ZooKeeper requests until the
`connected` event fires.

__expired__

The session has expired. Any ephemeral nodes create are gone. You must `start()`
again before making any other calls or they will throw an Error.

```js
zk.on('expired', function () {
	// clean up and reconnect
	console.log('crap, my ephemeral nodes are gone')
	zk.start()
})
```

### Watch Events

You can listen to watch events globally from the session with these events. The
event includes the `path` that triggered the watch.

* created
* deleted
* changed
* child

```js
zk.on('changed', function (path) {
	console.log('the node at', path, 'changed')
})
```

---

## ZK.retry

A set of policies for retrying requests.

### ZK.retry.no()

Don't retry.

### ZK.retry.once(wait)

Retry once, `wait` milliseconds between requests.

### ZK.retry.nTimes(times, wait)

Retry n `times`, `wait` milliseconds between requests.

### ZK.retry.elapsed(timespan, wait)

Retry for `timespan` milliseconds, `wait` milliseconds between requests.

### ZK.retry.exponential(times, wait, [maxWait])

Retry n `times`, increasing delay between tries exponentially starting at `wait`
milliseconds, optionally bounded by `maxWait` milliseconds.

---

## ZK.ACL

### ZK.ACL.Permissions

* READ
* WRITE
* CREATE
* DELETE
* ADMIN
* ALL

### Default ACLs

* ZK.ACL.OPEN
	* All permissions for anyone
* ZK.ACL.READ
	* Read permissions for anyone
* ZK.ACL.CREATOR
	* All permissions for the creator

### ZK.ACL.digestAcl(name, password, permissions)

Create a digest ACL with `name`, `password` and `permissions`

---

# License

MIT
