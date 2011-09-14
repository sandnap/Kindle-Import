
function FifoBuffer(size) {
	this.buffer = new Array();
	this.maxSize = size;
	this.last = 0;
}

FifoBuffer.prototype.get = function(key) {
	for (var i = this.buffer.length - 1; i >= 0; i-=1) {
		var entry = this.buffer[i];
		if (entry != null && entry.key == key) {
			return entry.value;
		}
	}
	return null;	
}

FifoBuffer.prototype.push = function(key, value) {
	//Checking if we can push on top or must drop the bottom
	if (this.buffer.length >= this.maxSize) {
		//We replace the element pointed to by "last"
		this.buffer[this.last++] = {key: key, value: value};
		if (this.last >= this.maxSize) {
			this.last = 0;
		}
		
	} else {
		//And we simply push the key/value pair into the buffer
		this.buffer.push({key: key, value: value});
	}
}