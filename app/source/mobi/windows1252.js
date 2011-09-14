/**
 * Translates an array of bytes from Windows-1252 to HTML Unicode escapes
 * @param {Object} bytes the array of bytes to convert.
 */
function translateWindows1252(bytes) {
	var byteBuf = new Array();
	for (var i = 0; i < bytes.length; i+=1) {
		var code = bytes[i];
		switch (bytes[i]) {
			case 0x80: code = 0x20AC; break; //EURO SIGN
			case 0x82: code = 0x201A; break; //SINGLE LOW-9 QUOTATION MARK
			case 0x83: code = 0x0192; break; //LATIN SMALL LETTER F WITH HOOK
			case 0x84: code = 0x201E; break; //DOUBLE LOW-9 QUOTATION MARK
			case 0x85: code = 0x2026; break; //HORIZONTAL ELLIPSIS
			case 0x86: code = 0x2020; break; //DAGGER
			case 0x87: code = 0x2021; break; //DOUBLE DAGGER
			case 0x88: code = 0x02C6; break; //MODIFIER LETTER CIRCUMFLEX ACCENT
			case 0x89: code = 0x2030; break; //PER MILLE SIGN
			case 0x8A: code = 0x0160; break; //LATIN CAPITAL LETTER S WITH CARON
			case 0x8B: code = 0x2039; break; //SINGLE LEFT-POINTING ANGLE QUOTATION MARK
			case 0x8C: code = 0x0152; break; //LATIN CAPITAL LIGATURE OE
			case 0x8E: code = 0x017D; break; //LATIN CAPITAL LETTER Z WITH CARON
			case 0x91: code = 0x2018; break; //LEFT SINGLE QUOTATION MARK
			case 0x92: code = 0x2019; break; //RIGHT SINGLE QUOTATION MARK
			case 0x93: code = 0x201C; break; //LEFT DOUBLE QUOTATION MARK
			case 0x94: code = 0x201D; break; //RIGHT DOUBLE QUOTATION MARK
			case 0x95: code = 0x2022; break; //BULLET
			case 0x96: code = 0x2013; break; //EN DASH
			case 0x97: code = 0x2014; break; //EM DASH
			case 0x98: code = 0x02DC; break; //SMALL TILDE
			case 0x99: code = 0x2122; break; //TRADE MARK SIGN
			case 0x9A: code = 0x0161; break; //LATIN SMALL LETTER S WITH CARON
			case 0x9B: code = 0x203A; break; //SINGLE RIGHT-POINTING ANGLE QUOTATION MARK
			case 0x9C: code = 0x0153; break; //LATIN SMALL LIGATURE OE
			case 0x9E: code = 0x017E; break; //LATIN SMALL LETTER Z WITH CARON
			case 0x9F: code = 0x0178; break; //LATIN CAPITAL LETTER Y WITH DIAERESIS
		}
		//Pushing the translated code
		byteBuf.push(code);
	}
	return {
		dropped: 0,
		data: byteBuf
	};
}
