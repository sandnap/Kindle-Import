/**
 * Translates an array of bytes from Windows-1255 to HTML Unicode escapes
 * @param {Object} bytes the array of bytes to convert.
 */
function translateUTF8(bytes) {
	var byteBuf = new Array();
	var r80BFreported = true; //false;
	var rC0C1reported = true; //false;
	var rRESTreported = true; //false;
	var droppedChars = 0;
	for (var i = 0; i < bytes.length; i+=1) {
		var chr = null;
		var b = bytes[i];
		if (b <= 0x7F) {
			//ASCII characters are copied directly
			byteBuf.push(b);
		} else if (b >= 0xC2 && b <= 0xDF) {
			//Two byte sequence
			if (i+1 >= bytes.length) {
				droppedChars += bytes.length - i;
				//Mojo.Log.warn("Stream ended on 2 byte sequence. Ignoring character.");
				break;				
			} 
			//Fetching second byte, stripping away control bits, shifting and concatenating
			var code = ((b & 0x1F) << 6) + (bytes[i+1] & 0x3F);
			//HTML-izing
			//htmlize(code, byteBuf);
			byteBuf.push(code);
			//Skipping the read byte
			i+=1;
		} else if (b >= 0xE0 && b <= 0xEF) {
			//Three byte sequence
			if (i+2 >= bytes.length) {
				droppedChars += bytes.length - i;
				//Mojo.Log.warn("Stream ended on 3 byte sequence. Ignoring character.");
				break;				
			}
			//Fetching 2 more bytes, stripping away control bits, shifting and concatenating
			var code = ((b & 0x0F) << 12) + ((bytes[i+1] & 0x3F) << 6) + (bytes[i+2] & 0x3F);
			//htmlize(code, byteBuf);
			byteBuf.push(code);
			//Skipping the read bytes
			i+=2;
		} else if (b >= 0xF0 && b <= 0xF4) {
			//Four byte sequence
			if (i+3 >= bytes.length) {
				droppedChars += bytes.length - i;
				//Mojo.Log.warn("Stream ended on 4 byte sequence. Ignoring character.");
				break;				
			} 
			//Fetching 3 more bytes, stripping away control bits, shifting and concatenating
			var code = ((b & 0x07) << 18) + ((bytes[i+1] & 0x3F) << 12) +
					(bytes[i+2] & 0x3F << 6) + (bytes[i+3] & 0x3F);
			//HTML-izing
			//htmlize(code, byteBuf);
			byteBuf.push(code);
			//Skipping the read bytes
			i+=3;
		} else if (b >= 0x80 && b <= 0xBF) {
			//This range is not allowed to appear as a start-byte, logging a warning
			if (r80BFreported) continue;
			Mojo.Log.warn("Invalid UTF-8 byte (range 0x80-0xBF) found. " +
				"Maybe this file is not UTF-8? Only reported once."
			);
		} else if (b >= 0xC0 && b <= 0xC1) {
			if (rC0C1reported) continue;
			Mojo.Log.warn("Invalid UTF-8 byte (range 0xC0-0xC1) found. " +
				"Maybe this file is not UTF-8? Only reported once."
			);
		} else {
			//The remaining space is invalid
			if (rRESTreported) continue;
			Mojo.Log.warn("Invalid UTF-8 byte (range 0xF5-0xFF) found. " +
				"Maybe this file is not UTF-8? Only reported once."
			);
		}
	}
	return {
		dropped: droppedChars,
		data: byteBuf
	};
}
