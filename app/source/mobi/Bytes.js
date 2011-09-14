/**
 * Concatenates the bytes of an array of ints and returns the resulting int.
 */
function concatBytes(byteArray) {
    var res = 0;
    for (var i = 0; i < byteArray.length; i += 1) {
        //Checking that byteArray is <= 255
        if (byteArray[i] < 0 || byteArray[i] > 255) {
            //throw("Invalid byte specified.");
            return undefined;
        }
        res = (res << 8) + byteArray[i];
    }
    return res;
}

/** A variadic wrapper for concatBytes. */
function concatBytesVar() {
    return concatBytes(arguments);
}

/**
 * Splits the 4 bytes of a 32 bit value into array of bytes and 
 * returns the resulting array.
 */
function splitU32(u32) {
	return [
        u32 >> 24 & 0xFF,
        u32 >> 16 & 0xFF,
        u32 >> 8 & 0xFF,
        u32 >> 0 & 0xFF
    ];
}

/**
 * A simple numerical comparator.
 * @return negative value if a < b; 0 if a == b; and positive value if a > b
 */
function numCompare(a,b) {
	return a - b
}

// bitwise operations for 64 bit math
// (javascript << and >> operators convert to 32 bit!)
function lshift(num, bits) {
    return num * Math.pow(2,bits);
}
function rshift(num, bits) {
    return Math.floor(num / Math.pow(2,bits));
}

/**
 * Performs an order of magnitude better than Array.concat
 * under load, since a copy of the arrayTo does not have to
 * be created.  Furthermore, performance of Array.concat
 * will degrade exponentially as the target array increases
 * in size.
 */
function concatArray(arrayTo,arrayFrom) {
	if(typeof(arrayTo) == "undefined" || arrayTo == null || !arrayFrom) {
		return;
	}

	var toEnd = arrayTo.length+arrayFrom.length;
	var fromEnd = arrayFrom.length;

	if (!fromEnd) return;

	do {
		arrayTo[--toEnd]=arrayFrom[--fromEnd];
	}
	while(fromEnd);
	return arrayTo;
}

/**
 * returns an array of length len, filled with val
 */
function fillArray(len,val) {
	var a=[];
	if (len) {
		do{
			a[--len]=val;
		} while(len);
	}
	return a;
}

/**
 * Takes a sorted array and returns an array with the unique values
 * @param {Object} data
 */
function uniqArray(data) {
	var arr = new Array();
	for (var i = 0; i < data.length; i+=1) {
		if (arr.length < 0 || arr.last() != data[i]) {
			arr.push(data[i]);
		}
	}
	return arr;
}

/**
 * Transforms a string into an array of byte-values (ints). Do note that
 * this only works properly, if the string was read in with the correct
 * encoding. If the source was ISO-8859-1 and converted to UTF-8, some
 * bytes were rendered into 2 byte codes (which is no problem) and some of
 * those that Java deems untranslateable are transformed to 0xFFFD.
 * Alternatively, you could use UTF-16, in which case no conversion takes
 * place, since ALL chars are two bytes long. This method can do either,
 * since it converts multibyte chars to a short int (1 Byte). 
 * Unfortunately, strings may be encoded strangely that way.
 */
function stringToBytes(str) {
    var ch, st, re = [];
    for (var i = 0; i < str.length; i++ ) {
        ch = str.charCodeAt(i);  // get char code
        st = [];                 // set up "stack"
        do {
            st.push( ch & 0xFF );  // push byte to stack
            ch = ch >> 8;          // shift value down by 1 byte
        }
        while ( ch );
        // add stack contents to result
        // done because chars have "wrong" endianness
        //re = re.concat( st.reverse() );
        concatArray(re,st);
    }
    // return an array of bytes
    return re;
}

function bytesToString(bytes) {
	if (!bytes) return null;
    var text = "";
    for (var i = 0; i < bytes.length; i+=1) {
        text += String.fromCharCode(bytes[i]);
    }
    return text;
}

function bytesToHex(bytes) {
	var str = "";
	var hexes = new Array ("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f");
	for (var i = 0; i < bytes.length; i+=1) {
		var b1 = (bytes[i] & 0xF0) >> 4;
		var b2 = (bytes[i] & 0x0F);
		str += hexes[b1] + hexes[b2];
	}
	return str;
}

function hexToBytes(str) {
	var bytes = new Array();
	var pushed = 0;
	var tmp = 0;
	for (var i = 0; i < str.length; i+=1) {
		var c = str[i];
		var val = 0;
		switch(c) {
			case "0": val = 0; break;
			case "1": val = 1; break;
			case "2": val = 2; break;
			case "3": val = 3; break;
			case "4": val = 4; break;
			case "5": val = 5; break;
			case "6": val = 6; break;
			case "7": val = 7; break;
			case "8": val = 8; break;
			case "9": val = 9; break;
			case "a": case "A": val = 10; break;
			case "b": case "B": val = 11; break;
			case "c": case "C": val = 12; break;
			case "d": case "D": val = 13; break;
			case "e": case "E": val = 14; break;
			case "f": case "F": val = 15; break;
		}
		if (pushed == 0) {
			tmp = val << 4;
			pushed += 1;
		} else {
			tmp += val;
			bytes.push(tmp);
			pushed = tmp = 0;
		}
	}
	return bytes;
}


// ~~~ Creating the base91 tables
var base91enc = stringToBytes(
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:-<=>?@[]^_`{|}~\""
);
var base91dec = new Array();
for (i = 255; i >= 0; i-=1) { base91dec[i] = -1; }
for (i = 0; i < 91; ++i) { base91dec[base91enc[i]] = i; }
// ~~~ Finished creating the base91 tables ~~~

function bytesToBase91(bytes) {
	var end = bytes.length;
	var ebq = 0; var en = 0;
	var out = "";
	//Stuffing chars into the out buffer
	for (var i = 0; i < end ; i+=1) {
		ebq = (ebq | ((bytes[i] & 0xFF) << en));
		en += 8;
		if (en > 13) {
			var ev = (ebq & 0x1FFF);

			if (ev > 88) {
				ebq >>= 13;
				en -= 13;
			} else {
				ev = (ebq & 0x3FFF);
				ebq >>= 14;
				en -= 14;
			}
			var c1 = base91enc[ev % 91];
			var c2 = base91enc[Math.floor(ev / 91)];
			out += String.fromCharCode(c1);
			out += String.fromCharCode(c2);
		}
	}
	//Adding the trailer
	if (en > 0) {
		out += String.fromCharCode(base91enc[ebq % 91]);
		if (en > 7 || ebq > 90) {
			out += String.fromCharCode(base91enc[Math.floor(ebq / 91)]);
		}
	}
	return out;
}

function base91ToBytes(cstr) {
	var dbq = 0; var dn = 0; var dv = -1;
	var end = cstr.length;
	var out = new Array();
	for (var i = 0; i < end; i+=1) {
		var byt = cstr.charCodeAt(i);
		if (base91dec[byt] == -1)
			continue;
		if (dv == -1) {
			dv = base91dec[byt];
		} else {
			dv += (base91dec[byt] * 91);
			dbq |= (dv << dn);
			dn += ((dv & 0x1FFF) > 88) ? 13 : 14;
			do {
				out.push(dbq & 0xFF);
				dbq >>= 8;
				dn -= 8;
			} while (dn > 7);
			dv = -1;
		}
	}
	//Adding trailing bytes
	if (dv != -1) {
		out.push((dbq | (dv << dn)) & 0xFF);
	}
	return out;
}


function bytesToBase64(bytes) {
	var base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;

	while (i < bytes.length) {
		chr1 = bytes[i++];
		chr2 = (i < bytes.length) ? bytes[i++] : Number.NaN;
		chr3 = (i < bytes.length) ? bytes[i++] : Number.NaN;

		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;

		if (isNaN(chr2)) {
			enc3 = enc4 = 64;
		} else if (isNaN(chr3)) {
			enc4 = 64;
		}

		output = output +
			base64.charAt(enc1) + base64.charAt(enc2) +
			base64.charAt(enc3) + base64.charAt(enc4);

	}

	return output;
}

function base64ToBytes(input) {
	var output = new Array();
	var base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;
	
	//Sanitizing the input
	input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
	
	while (i < input.length) {
		enc1 = base64.indexOf(input.charAt(i++));
		enc2 = base64.indexOf(input.charAt(i++));
		enc3 = base64.indexOf(input.charAt(i++));
		enc4 = base64.indexOf(input.charAt(i++));

		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;

		output.push(chr1);

		if (enc3 != 64) {
			output.push(chr2);
		}
		if (enc4 != 64) {
			output.push(chr3);
		}
	}
	return output;
}

