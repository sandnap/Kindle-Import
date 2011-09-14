/*
 * Huff-CDIC decompression in javascript
 */
function HuffCDIC(huff) {
	this.huff = huff;
	this.result = [];
}

HuffCDIC.prototype.decompress = function(bytes) {
	this.result = [];
    this.recurseHuffs(new BitReader(bytes));
	return this.result;
}

HuffCDIC.prototype.recurseHuffs = function(bits, depth) {
	if (!depth) depth = 0;
	if (depth > 32) return;

	while (bits.left()) {
		var dw = bits.peek(32);
		var v = this.huff.index1[rshift(dw , 24)];
		var codelen = v & 0x1F;	
		if (codelen == 0) return;
		var code = rshift(dw,(32 - codelen));
		var r = rshift(v, 8);
		if ((v & 0x80)==0) {
			while (code < this.huff.index2[(codelen-1)*2]) {
				codelen += 1;
				code = rshift(dw , (32 - codelen));
			}
			r = this.huff.index2[(codelen-1)*2+1];
		}
		r -= code;
		if (codelen == 0) return;
		if (!bits.eat(codelen)) return;

		var dicno = rshift(r , this.huff.entryBits);
		var off1 = 16 + (r - (lshift(dicno, this.huff.entryBits))) * 2;	
		var	dic = this.huff.dictionaries[dicno];
		var off2 = 16 + dic[off1] * 256 + dic[off1+1];
		var blen = dic[off2] * 256 + dic[off2+1];
		var dslice = dic.slice(off2+2,off2+2+(blen&0x7fff));
		
		if (blen & 0x8000) {
			concatArray(this.result,dslice);
		} else {
			this.recurseHuffs(new BitReader(dslice), depth + 1);
		}
	}
}

function BitReader(data) {
	this.data = data.concat([0,0,0,0]);
	this.pos = 0;
	this.nbits = data.length*8;
}

BitReader.prototype.peek = function(n) {
	var r = 0, g = 0;
	while (g < n) {
		r = lshift(r, 8) + this.data[rshift((this.pos+g),3)];
		g = g + 8 - ((this.pos+g) & 7);
	}
	var x = (rshift(r, (g - n)) & (lshift(1, n) - 1));
	x = (x < 0) ? (0xffffffff + x + 1) : x; //handle javascript's sign bit	
	return x;
}

BitReader.prototype.eat = function(n) {
	this.pos += n;
	return this.pos <= this.nbits;
}

BitReader.prototype.left = function(n) {
	return this.nbits - this.pos;
}
