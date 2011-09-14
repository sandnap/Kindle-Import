
function Encoding() {
	//Does nothing; A dummy-constructor
}

/**
 * Returns the translation function for the given list position
 * @param {Object} pos the position in the encoding list. Starts with 1
 */
Encoding.getEncodingFunction = function(pos) {
	switch(pos) {
		case 1:
			//1 is ASCII, which means no conversion
			return null;
		case 2:
			//2 is UTF-8
			return translateUTF8;
		case 3:
			//3 is Windows-1250, Eastern Europe
			return translateWindows1250;
		case 4:
			//4 is Windows-1251, Cyrillic
			return translateWindows1251;
		case 5:
			//5 is Windows-1252, Latin
			return translateWindows1252;
		case 6:
			//6 is Windows-1255, Hebrew
			return translateWindows1255;
		case 7:
			//7 is CP-936 / GBK, Chinese
			return translateCP936;
		case 8:
			//8 is Windows-1253, Greek
			return translateWindows1253;
		case 9:
			//9 is Windows-1254, Turkish
			return translateWindows1253;
		case 10:
			//10 is Windows-1256, Arabic
			return translateWindows1256;
		case 11:
			//11 is Windows-1257, Baltic
			return translateWindows1257;
		case 12:
			//12 is Windows-1258, Vietnamese
			return translateWindows1258;
		case 13:
			//13 is Windows-874, Thai
			return translateWindows874;
		case 14:
			//14 is KOI-8R
			return translateKOI8R;
		case 15:
			//15 is CP-932, Japanese
			return translateCP932;
		case 16:
			//16 is CP-949, Korean
			return translateCP949;
		default:
			//We assume ASCII
			return null;
	}
}

Encoding.getEncodings = function() {
	return [
		{label: "ASCII", value: 1},
		{label: "UTF-8", value: 2},
		{label: "CP-1252 (Latin)", value: 5},
		{label: "CP-932/SJIS (Japanese)", value: 15},
		{label: "CP-936/GBK (Chinese)", value: 7},
		{label: "CP-949 (Korean)", value: 16},
		{label: "CP-1250 (East Europe)", value: 3},
		{label: "CP-1251 (Cyrillic)", value: 4},
		{label: "CP-1253 (Greek)", value: 8},
		{label: "CP-1254 (Turkish)", value: 9},
		{label: "CP-1255 (Hebrew)", value: 6},
		{label: "CP-1256 (Arabic)", value: 10},
		{label: "CP-1257 (Baltic)", value: 11},
		{label: "CP-1258 (Vietnamese)", value: 12},
		{label: "CP-874 (Thai)", value: 13},
		{label: "KOI-8R (Russian)", value: 14}
	];
}

/**
 * Converts a raw array of bytes into a UTF-8 multibyte array
 * suitable for direct conversion with String.fromCharCode().
 * @param {Object} input the array of bytes to convert 
 * @param {Number} encoding the encoding to use
 * @return an object whose "data" value contains the multibyte array
 * 		and whose "dropped" value contains the number of bytes that
 * 		were dropped from the end due to them being fragments of a
 * 		multibyte sequence.
 */
Encoding.decodeBytes = function(input, encoding) {
	var encodingTranslator = Encoding.getEncodingFunction(encoding);
	var data = null;
	var dropped = 0;
	if (encodingTranslator != null) {
		//Using the encoding translator
		var code = encodingTranslator(input);
		dropped = code.dropped;
		data = code.data;
	} else {
		//The user used ASCII or an invalid enc
		data = input;
	}
	return {
		dropped: dropped,
		data: data
	}
}
