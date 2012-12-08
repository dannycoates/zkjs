module.exports = function () {
	function RequestBuffer(ensemble) {
		this.ensemble = ensemble
		this.purgatory = []
	}

	RequestBuffer.prototype.push = function (message, cb) {
		this.purgatory.push([message, cb])
		this.drain()
	}

	RequestBuffer.prototype.drain = function () {
		if (this.ensemble.connected) {
			while (this.purgatory.length > 0) {
				var messageAndCallback = this.purgatory.shift()
				this.ensemble.write(messageAndCallback[0], messageAndCallback[1])
			}
		}
	}

	return RequestBuffer
}
