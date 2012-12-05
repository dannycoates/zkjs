module.exports = function () {
	function RequestBuffer(ensemble) {
		this.ensemble = ensemble
		this.purgatory = []
	}

	RequestBuffer.prototype.push = function (message, cb) {
		this.purgatory.push([message, cb])
	}

	RequestBuffer.prototype.drain = function () {
		while (this.purgatory.length > 0) {
			var messageAndCallback = this.purgatory.shift()
			this.ensemble.send(messageAndCallback[0], messageAndCallback[1])
		}
	}

	return RequestBuffer
}
