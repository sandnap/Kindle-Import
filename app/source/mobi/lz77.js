/**
 *  A simple PalmDOC Lz77 decompression class.
 */
function Lz77() {
	//Empty constructor - properties are overwritten/created by decompress()
}

Lz77.prototype.decompress = function(bytes) {
    //The byte buffer, we can't store the text directly, because
    //JS uses multibyte UTF-8 strings which ruins offset calculation
    var decBytes = new Array();
    for (var i = 0; i < bytes.length; i+=1) {
        //Checking if we can copy the chars directly or must decompress
        var b = bytes[i];
        if (b == 0x00) {
			//Replace with space
			decBytes.push(0x20);
		} else if (b >= 0x09 && b <= 0x7F) {
            //Copy identically
            decBytes.push(b);
        } else if (b >= 0xC0 && b <= 0xFF) {
            //Space + (Byte - 0x80)
            decBytes.push(0x20);
            decBytes.push(b - 0x80);
        } else if (b >= 0x80 && b <= 0xBF) {
            //The beginning of a sequence, always 2 byte long
            var b2 = (b << 8) + bytes[i+1];
            //The last 3 bits encode the run length (min 3)
            var len = (b2 & 0x07) + 3;
            b2 = b2 >> 3;
            //The next 11 bits encode the offset
            var offset = (b2 & 0x7FF);
            //The remaining two bits are always 10 and can be ignored
            //Calculating the offset position
            var copyStart = decBytes.length - offset;
            //Copying those chars
            for (off = 0; off < len; off += 1) {
                decBytes.push(decBytes[copyStart + off]);
            }
            //We gobbled 2 bytes, therefore we must increase i
            i += 1;
        } else {
            //The bytes 01 to 08 specify a run of unaltered chars of the
			//specified length (1-8)
            for (var j = 0; j < b; j+=1) {
                //We must remember that one byte was skipped!
                i+=1;
                //We append the byte unaltered
                var b2 = bytes[i];
                decBytes.push(b2);
            }
        }
    }
    //Returning the decoded array
    return decBytes;
}