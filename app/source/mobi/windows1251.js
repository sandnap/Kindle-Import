/**
 * Translates an array of bytes from Windows-1255 to HTML Unicode escapes
 * @param {Object} bytes the array of bytes to convert.
 */
function translateWindows1251(bytes) {
	var byteBuf = new Array();
	for (var i = 0; i < bytes.length; i+=1) {
		var code = bytes[i];
		switch (bytes[i]) {
			case 0x80: code = 0x0402; break; //CYRILLIC CAPITAL LETTER DJE
			case 0x81: code = 0x0403; break; //CYRILLIC CAPITAL LETTER GJE
			case 0x82: code = 0x201A; break; //SINGLE LOW-9 QUOTATION MARK
			case 0x83: code = 0x0453; break; //CYRILLIC SMALL LETTER GJE
			case 0x84: code = 0x201E; break; //DOUBLE LOW-9 QUOTATION MARK
			case 0x85: code = 0x2026; break; //HORIZONTAL ELLIPSIS
			case 0x86: code = 0x2020; break; //DAGGER
			case 0x87: code = 0x2021; break; //DOUBLE DAGGER
			case 0x88: code = 0x20AC; break; //EURO SIGN
			case 0x89: code = 0x2030; break; //PER MILLE SIGN
			case 0x8A: code = 0x0409; break; //CYRILLIC CAPITAL LETTER LJE
			case 0x8B: code = 0x2039; break; //SINGLE LEFT-POINTING ANGLE QUOTATION MARK
			case 0x8C: code = 0x040A; break; //CYRILLIC CAPITAL LETTER NJE
			case 0x8D: code = 0x040C; break; //CYRILLIC CAPITAL LETTER KJE
			case 0x8E: code = 0x040B; break; //CYRILLIC CAPITAL LETTER TSHE
			case 0x8F: code = 0x040F; break; //CYRILLIC CAPITAL LETTER DZHE
			case 0x90: code = 0x0452; break; //CYRILLIC SMALL LETTER DJE
			case 0x91: code = 0x2018; break; //LEFT SINGLE QUOTATION MARK
			case 0x92: code = 0x2019; break; //RIGHT SINGLE QUOTATION MARK
			case 0x93: code = 0x201C; break; //LEFT DOUBLE QUOTATION MARK
			case 0x94: code = 0x201D; break; //RIGHT DOUBLE QUOTATION MARK
			case 0x95: code = 0x2022; break; //BULLET
			case 0x96: code = 0x2013; break; //EN DASH
			case 0x97: code = 0x2014; break; //EM DASH
			case 0x98: code = 0x0020; break; // UNDEFINED
			case 0x99: code = 0x2122; break; //TRADE MARK SIGN
			case 0x9A: code = 0x0459; break; //CYRILLIC SMALL LETTER LJE
			case 0x9B: code = 0x203A; break; //SINGLE RIGHT-POINTING ANGLE QUOTATION MARK
			case 0x9C: code = 0x045A; break; //CYRILLIC SMALL LETTER NJE
			case 0x9D: code = 0x045C; break; //CYRILLIC SMALL LETTER KJE
			case 0x9E: code = 0x045B; break; //CYRILLIC SMALL LETTER TSHE
			case 0x9F: code = 0x045F; break; //CYRILLIC SMALL LETTER DZHE
			case 0xA0: code = 0x00A0; break; //NO-BREAK SPACE
			case 0xA1: code = 0x040E; break; //CYRILLIC CAPITAL LETTER SHORT U
			case 0xA2: code = 0x045E; break; //CYRILLIC SMALL LETTER SHORT U
			case 0xA3: code = 0x0408; break; //CYRILLIC CAPITAL LETTER JE
			case 0xA4: code = 0x00A4; break; //CURRENCY SIGN
			case 0xA5: code = 0x0490; break; //CYRILLIC CAPITAL LETTER GHE WITH UPTURN
			case 0xA6: code = 0x00A6; break; //BROKEN BAR
			case 0xA7: code = 0x00A7; break; //SECTION SIGN
			case 0xA8: code = 0x0401; break; //CYRILLIC CAPITAL LETTER IO
			case 0xA9: code = 0x00A9; break; //COPYRIGHT SIGN
			case 0xAA: code = 0x0404; break; //CYRILLIC CAPITAL LETTER UKRAINIAN IE
			case 0xAB: code = 0x00AB; break; //LEFT-POINTING DOUBLE ANGLE QUOTATION MARK
			case 0xAC: code = 0x00AC; break; //NOT SIGN
			case 0xAD: code = 0x00AD; break; //SOFT HYPHEN
			case 0xAE: code = 0x00AE; break; //REGISTERED SIGN
			case 0xAF: code = 0x0407; break; //CYRILLIC CAPITAL LETTER YI
			case 0xB0: code = 0x00B0; break; //DEGREE SIGN
			case 0xB1: code = 0x00B1; break; //PLUS-MINUS SIGN
			case 0xB2: code = 0x0406; break; //CYRILLIC CAPITAL LETTER BYELORUSSIAN-UKRAINIAN I
			case 0xB3: code = 0x0456; break; //CYRILLIC SMALL LETTER BYELORUSSIAN-UKRAINIAN I
			case 0xB4: code = 0x0491; break; //CYRILLIC SMALL LETTER GHE WITH UPTURN
			case 0xB5: code = 0x00B5; break; //MICRO SIGN
			case 0xB6: code = 0x00B6; break; //PILCROW SIGN
			case 0xB7: code = 0x00B7; break; //MIDDLE DOT
			case 0xB8: code = 0x0451; break; //CYRILLIC SMALL LETTER IO
			case 0xB9: code = 0x2116; break; //NUMERO SIGN
			case 0xBA: code = 0x0454; break; //CYRILLIC SMALL LETTER UKRAINIAN IE
			case 0xBB: code = 0x00BB; break; //RIGHT-POINTING DOUBLE ANGLE QUOTATION MARK
			case 0xBC: code = 0x0458; break; //CYRILLIC SMALL LETTER JE
			case 0xBD: code = 0x0405; break; //CYRILLIC CAPITAL LETTER DZE
			case 0xBE: code = 0x0455; break; //CYRILLIC SMALL LETTER DZE
			case 0xBF: code = 0x0457; break; //CYRILLIC SMALL LETTER YI
			case 0xC0: code = 0x0410; break; //CYRILLIC CAPITAL LETTER A
			case 0xC1: code = 0x0411; break; //CYRILLIC CAPITAL LETTER BE
			case 0xC2: code = 0x0412; break; //CYRILLIC CAPITAL LETTER VE
			case 0xC3: code = 0x0413; break; //CYRILLIC CAPITAL LETTER GHE
			case 0xC4: code = 0x0414; break; //CYRILLIC CAPITAL LETTER DE
			case 0xC5: code = 0x0415; break; //CYRILLIC CAPITAL LETTER IE
			case 0xC6: code = 0x0416; break; //CYRILLIC CAPITAL LETTER ZHE
			case 0xC7: code = 0x0417; break; //CYRILLIC CAPITAL LETTER ZE
			case 0xC8: code = 0x0418; break; //CYRILLIC CAPITAL LETTER I
			case 0xC9: code = 0x0419; break; //CYRILLIC CAPITAL LETTER SHORT I
			case 0xCA: code = 0x041A; break; //CYRILLIC CAPITAL LETTER KA
			case 0xCB: code = 0x041B; break; //CYRILLIC CAPITAL LETTER EL
			case 0xCC: code = 0x041C; break; //CYRILLIC CAPITAL LETTER EM
			case 0xCD: code = 0x041D; break; //CYRILLIC CAPITAL LETTER EN
			case 0xCE: code = 0x041E; break; //CYRILLIC CAPITAL LETTER O
			case 0xCF: code = 0x041F; break; //CYRILLIC CAPITAL LETTER PE
			case 0xD0: code = 0x0420; break; //CYRILLIC CAPITAL LETTER ER
			case 0xD1: code = 0x0421; break; //CYRILLIC CAPITAL LETTER ES
			case 0xD2: code = 0x0422; break; //CYRILLIC CAPITAL LETTER TE
			case 0xD3: code = 0x0423; break; //CYRILLIC CAPITAL LETTER U
			case 0xD4: code = 0x0424; break; //CYRILLIC CAPITAL LETTER EF
			case 0xD5: code = 0x0425; break; //CYRILLIC CAPITAL LETTER HA
			case 0xD6: code = 0x0426; break; //CYRILLIC CAPITAL LETTER TSE
			case 0xD7: code = 0x0427; break; //CYRILLIC CAPITAL LETTER CHE
			case 0xD8: code = 0x0428; break; //CYRILLIC CAPITAL LETTER SHA
			case 0xD9: code = 0x0429; break; //CYRILLIC CAPITAL LETTER SHCHA
			case 0xDA: code = 0x042A; break; //CYRILLIC CAPITAL LETTER HARD SIGN
			case 0xDB: code = 0x042B; break; //CYRILLIC CAPITAL LETTER YERU
			case 0xDC: code = 0x042C; break; //CYRILLIC CAPITAL LETTER SOFT SIGN
			case 0xDD: code = 0x042D; break; //CYRILLIC CAPITAL LETTER E
			case 0xDE: code = 0x042E; break; //CYRILLIC CAPITAL LETTER YU
			case 0xDF: code = 0x042F; break; //CYRILLIC CAPITAL LETTER YA
			case 0xE0: code = 0x0430; break; //CYRILLIC SMALL LETTER A
			case 0xE1: code = 0x0431; break; //CYRILLIC SMALL LETTER BE
			case 0xE2: code = 0x0432; break; //CYRILLIC SMALL LETTER VE
			case 0xE3: code = 0x0433; break; //CYRILLIC SMALL LETTER GHE
			case 0xE4: code = 0x0434; break; //CYRILLIC SMALL LETTER DE
			case 0xE5: code = 0x0435; break; //CYRILLIC SMALL LETTER IE
			case 0xE6: code = 0x0436; break; //CYRILLIC SMALL LETTER ZHE
			case 0xE7: code = 0x0437; break; //CYRILLIC SMALL LETTER ZE
			case 0xE8: code = 0x0438; break; //CYRILLIC SMALL LETTER I
			case 0xE9: code = 0x0439; break; //CYRILLIC SMALL LETTER SHORT I
			case 0xEA: code = 0x043A; break; //CYRILLIC SMALL LETTER KA
			case 0xEB: code = 0x043B; break; //CYRILLIC SMALL LETTER EL
			case 0xEC: code = 0x043C; break; //CYRILLIC SMALL LETTER EM
			case 0xED: code = 0x043D; break; //CYRILLIC SMALL LETTER EN
			case 0xEE: code = 0x043E; break; //CYRILLIC SMALL LETTER O
			case 0xEF: code = 0x043F; break; //CYRILLIC SMALL LETTER PE
			case 0xF0: code = 0x0440; break; //CYRILLIC SMALL LETTER ER
			case 0xF1: code = 0x0441; break; //CYRILLIC SMALL LETTER ES
			case 0xF2: code = 0x0442; break; //CYRILLIC SMALL LETTER TE
			case 0xF3: code = 0x0443; break; //CYRILLIC SMALL LETTER U
			case 0xF4: code = 0x0444; break; //CYRILLIC SMALL LETTER EF
			case 0xF5: code = 0x0445; break; //CYRILLIC SMALL LETTER HA
			case 0xF6: code = 0x0446; break; //CYRILLIC SMALL LETTER TSE
			case 0xF7: code = 0x0447; break; //CYRILLIC SMALL LETTER CHE
			case 0xF8: code = 0x0448; break; //CYRILLIC SMALL LETTER SHA
			case 0xF9: code = 0x0449; break; //CYRILLIC SMALL LETTER SHCHA
			case 0xFA: code = 0x044A; break; //CYRILLIC SMALL LETTER HARD SIGN
			case 0xFB: code = 0x044B; break; //CYRILLIC SMALL LETTER YERU
			case 0xFC: code = 0x044C; break; //CYRILLIC SMALL LETTER SOFT SIGN
			case 0xFD: code = 0x044D; break; //CYRILLIC SMALL LETTER E
			case 0xFE: code = 0x044E; break; //CYRILLIC SMALL LETTER YU
			case 0xFF: code = 0x044F; break; //CYRILLIC SMALL LETTER YA
		}
		//Pushing the translated code
		byteBuf.push(code);
	}
	return {
		dropped: 0,
		data: byteBuf
	};
}
