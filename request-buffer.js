module.exports = function () {
	function RequestBuffer(ensemble) {
		this.ensemble = ensemble
		this.purgatory = []
	}

	RequestBuffer.prototype.push = function (message) {
		this.purgatory.push(message)
		this.drain()
	}

	RequestBuffer.prototype.drain = function () {
		if (this.ensemble.connected) {
			while (this.purgatory.length > 0) {
				this.ensemble.write(this.purgatory.shift())
			}
		}
	}

	return RequestBuffer
}
