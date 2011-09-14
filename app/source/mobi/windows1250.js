/**
 * Translates an array of bytes from Windows-1255 to HTML Unicode escapes
 * @param {Object} bytes the array of bytes to convert.
 */
function translateWindows1250(bytes) {
	var byteBuf = new Array();
	for (var i = 0; i < bytes.length; i+=1) {
		var code = bytes[i];
		switch (bytes[i]) {
			case 0x80: code = 0x20AC; break; //EURO SIGN
			case 0x82: code = 0x201A; break; //SINGLE LOW-9 QUOTATION MARK
			case 0x84: code = 0x201E; break; //DOUBLE LOW-9 QUOTATION MARK
			case 0x85: code = 0x2026; break; //HORIZONTAL ELLIPSIS
			case 0x86: code = 0x2020; break; //DAGGER
			case 0x87: code = 0x2021; break; //DOUBLE DAGGER
			case 0x89: code = 0x2030; break; //PER MILLE SIGN
			case 0x8A: code = 0x0160; break; //LATIN CAPITAL LETTER S WITH CARON
			case 0x8B: code = 0x2039; break; //SINGLE LEFT-POINTING ANGLE QUOTATION MARK
			case 0x8C: code = 0x015A; break; //LATIN CAPITAL LETTER S WITH ACUTE
			case 0x8D: code = 0x0164; break; //LATIN CAPITAL LETTER T WITH CARON
			case 0x8E: code = 0x017D; break; //LATIN CAPITAL LETTER Z WITH CARON
			case 0x8F: code = 0x0179; break; //LATIN CAPITAL LETTER Z WITH ACUTE
			case 0x91: code = 0x2018; break; //LEFT SINGLE QUOTATION MARK
			case 0x92: code = 0x2019; break; //RIGHT SINGLE QUOTATION MARK
			case 0x93: code = 0x201C; break; //LEFT DOUBLE QUOTATION MARK
			case 0x94: code = 0x201D; break; //RIGHT DOUBLE QUOTATION MARK
			case 0x95: code = 0x2022; break; //BULLET
			case 0x96: code = 0x2013; break; //EN DASH
			case 0x97: code = 0x2014; break; //EM DASH
			case 0x99: code = 0x2122; break; //TRADE MARK SIGN
			case 0x9A: code = 0x0161; break; //LATIN SMALL LETTER S WITH CARON
			case 0x9B: code = 0x203A; break; //SINGLE RIGHT-POINTING ANGLE QUOTATION MARK
			case 0x9C: code = 0x015B; break; //LATIN SMALL LETTER S WITH ACUTE
			case 0x9D: code = 0x0165; break; //LATIN SMALL LETTER T WITH CARON
			case 0x9E: code = 0x017E; break; //LATIN SMALL LETTER Z WITH CARON
			case 0x9F: code = 0x017A; break; //LATIN SMALL LETTER Z WITH ACUTE
			case 0xA1: code = 0x02C7; break; //CARON
			case 0xA2: code = 0x02D8; break; //BREVE
			case 0xA3: code = 0x0141; break; //LATIN CAPITAL LETTER L WITH STROKE
			case 0xA5: code = 0x0104; break; //LATIN CAPITAL LETTER A WITH OGONEK
			case 0xAA: code = 0x015E; break; //LATIN CAPITAL LETTER S WITH CEDILLA
			case 0xAF: code = 0x017B; break; //LATIN CAPITAL LETTER Z WITH DOT ABOVE
			case 0xB2: code = 0x02DB; break; //OGONEK
			case 0xB3: code = 0x0142; break; //LATIN SMALL LETTER L WITH STROKE
			case 0xB9: code = 0x0105; break; //LATIN SMALL LETTER A WITH OGONEK
			case 0xBA: code = 0x015F; break; //LATIN SMALL LETTER S WITH CEDILLA
			case 0xBC: code = 0x013D; break; //LATIN CAPITAL LETTER L WITH CARON
			case 0xBD: code = 0x02DD; break; //DOUBLE ACUTE ACCENT
			case 0xBE: code = 0x013E; break; //LATIN SMALL LETTER L WITH CARON
			case 0xBF: code = 0x017C; break; //LATIN SMALL LETTER Z WITH DOT ABOVE
			case 0xC0: code = 0x0154; break; //LATIN CAPITAL LETTER R WITH ACUTE
			case 0xC3: code = 0x0102; break; //LATIN CAPITAL LETTER A WITH BREVE
			case 0xC5: code = 0x0139; break; //LATIN CAPITAL LETTER L WITH ACUTE
			case 0xC6: code = 0x0106; break; //LATIN CAPITAL LETTER C WITH ACUTE
			case 0xC8: code = 0x010C; break; //LATIN CAPITAL LETTER C WITH CARON
			case 0xCA: code = 0x0118; break; //LATIN CAPITAL LETTER E WITH OGONEK
			case 0xCC: code = 0x011A; break; //LATIN CAPITAL LETTER E WITH CARON
			case 0xCF: code = 0x010E; break; //LATIN CAPITAL LETTER D WITH CARON
			case 0xD0: code = 0x0110; break; //LATIN CAPITAL LETTER D WITH STROKE
			case 0xD1: code = 0x0143; break; //LATIN CAPITAL LETTER N WITH ACUTE
			case 0xD2: code = 0x0147; break; //LATIN CAPITAL LETTER N WITH CARON
			case 0xD5: code = 0x0150; break; //LATIN CAPITAL LETTER O WITH DOUBLE ACUTE
			case 0xD8: code = 0x0158; break; //LATIN CAPITAL LETTER R WITH CARON
			case 0xD9: code = 0x016E; break; //LATIN CAPITAL LETTER U WITH RING ABOVE
			case 0xDB: code = 0x0170; break; //LATIN CAPITAL LETTER U WITH DOUBLE ACUTE
			case 0xDE: code = 0x0162; break; //LATIN CAPITAL LETTER T WITH CEDILLA
			case 0xE0: code = 0x0155; break; //LATIN SMALL LETTER R WITH ACUTE
			case 0xE3: code = 0x0103; break; //LATIN SMALL LETTER A WITH BREVE
			case 0xE5: code = 0x013A; break; //LATIN SMALL LETTER L WITH ACUTE
			case 0xE6: code = 0x0107; break; //LATIN SMALL LETTER C WITH ACUTE
			case 0xE8: code = 0x010D; break; //LATIN SMALL LETTER C WITH CARON
			case 0xEA: code = 0x0119; break; //LATIN SMALL LETTER E WITH OGONEK
			case 0xEC: code = 0x011B; break; //LATIN SMALL LETTER E WITH CARON
			case 0xEF: code = 0x010F; break; //LATIN SMALL LETTER D WITH CARON
			case 0xF0: code = 0x0111; break; //LATIN SMALL LETTER D WITH STROKE
			case 0xF1: code = 0x0144; break; //LATIN SMALL LETTER N WITH ACUTE
			case 0xF2: code = 0x0148; break; //LATIN SMALL LETTER N WITH CARON
			case 0xF5: code = 0x0151; break; //LATIN SMALL LETTER O WITH DOUBLE ACUTE
			case 0xF8: code = 0x0159; break; //LATIN SMALL LETTER R WITH CARON
			case 0xF9: code = 0x016F; break; //LATIN SMALL LETTER U WITH RING ABOVE
			case 0xFB: code = 0x0171; break; //LATIN SMALL LETTER U WITH DOUBLE ACUTE
			case 0xFE: code = 0x0163; break; //LATIN SMALL LETTER T WITH CEDILLA
			case 0xFF: code = 0x02D9; break; //DOT ABOVE
		}
		//Pushing the translated code
		byteBuf.push(code);
	}
	return {
		dropped: 0,
		data: byteBuf
	};
}
