function HTMLParser() {
	//Nothing to do
}

/**
 * Takes an array of bytes and extracts the tags.
 * @param {Object} bytes the array containing the source bytes
 */
HTMLParser.parseBytes = function(bytes, openTags, newlineToSpace) {
	//Sanity check
	if (typeof(openTags) == "undefined" || openTags == null) {
		openTags = new Array();
	}
	
	var tags = new Array();
	var plainBytes = new Array();
	var openTagsEnd = openTags.clone();
	
	//The function to create a tag from a buffer
	var createTag = function(byteBuf, tags, openTagsEnd) {
		var str = bytesToString(byteBuf);
		//Creating the tag
		var tag = new Tag(str, plainBytes.length);
		//Sanity checking it
		if (tag.name == null || tag.name.length <= 0) {
			byteBuf.length = 0;
			return;
		}
		//Now, we filter out a few strange tags
		if (tag.name == "/br") {
			//Someone actually used closing br's; since we single them,
			//we can ditch the closers
			byteBuf.length = 0;
			return;
		}
		
		//Pushing the tag
		tags.push(tag);
		//And adding / removing that tag from the open list
		HTMLParser.addToOpenTagArray(openTagsEnd, tag);
		//Cleansing the byte buffer
		byteBuf.length = 0;
	}
	
	var abortTag = function(byteBuf) {
		var tmpStr = bytesToString(byteBuf);
		tmpStr = tmpStr.replace(/</g, "&lt;").replace(/>/g, "&gt;");
		concatArray(plainBytes, stringToBytes(tmpStr));
		byteBuf.length = 0;
	}
	
	var state = 0;
	var byteBuf = new Array();
	for (var i = 0; i < bytes.length; i+=1) {
		var b = bytes[i];
		switch(state) {
			case 0:
				//Gobbling bytes up to a tag start
				switch(b) {
					case 0x3C:
						//We start a tag
						state = 1;
						break;
					case 0x0A: case 0x0D:
						if (newlineToSpace) {
							plainBytes.push(0x20);
						}
						break;	
					default:
						//Otherwise we gobble bytes
						plainBytes.push(b);
						break;		
				}
				break;
			case 1:
				//Gobbling bytes up to a tag end
				switch(b) {
					case 0x22: //A double-quote
						byteBuf.push(b);
						state = 2;
						break;
					case 0x27: //A single-quote
						byteBuf.push(b);
						state = 3;
						break;
					case 0x3E: //A Tag end ">"
						//Creating a tag from the byteBuf, if not empty
						if (byteBuf.length <= 0) {
							state = 0;
							break;
						}
						createTag(byteBuf, tags, openTagsEnd);
						//And resetting the state
						state = 0;
						break;
					case 0x3C:
						//We parsed a tag opener. This means we just parsed
						//a runaway tag. Transforming the "tag" into plain text
						abortTag(byteBuf);
						//And we enter the tag state
						state = 1;
						break;
					default:
						//Gobbling bytes into the buffer
						byteBuf.push(b);
						break;
				}
				break;
			case 2: //Double quote searcher
				switch (b) {
					case 0x22:
						//End of quote
						byteBuf.push(b);
						state = 1;
						break;
					case 0x3E:
						//Parsed a tag closer; stopping here's standard XML,
						//but not standard HTML. So it's safer at the expense of
						//breaking some things
						createTag(byteBuf, tags, openTagsEnd);
						state = 0;
						break;
					case 0x3C:
						//We parsed a tag opener. This means we just parsed
						//a runaway tag. Transforming the "tag" into plain text
						abortTag(byteBuf);
						//And we enter the tag state
						state = 1;
						break;
					default:
						byteBuf.push(b);
						break;
				}
				break;
			case 3: //Single quote searcher
				switch (b) {
					case 0x27:
						//End of quote
						byteBuf.push(b);
						state = 1;
						break;
					case 0x3E:
						//Parsed a tag closer; stopping here's standard XML,
						//but not standard HTML. So it's safer at the expense of
						//breaking some things
						createTag(byteBuf, tags, openTagsEnd);
						state = 0;
						break;
					case 0x3C:
						//We parsed a tag opener. This means we just parsed
						//a runaway tag. Transforming the "tag" into plain text
						abortTag(byteBuf);
						//And we enter the tag state
						state = 1;
						break;
					default:
						byteBuf.push(b);
						break;
				}
				break;
			
		}
	}
	//Returning the data
	return {
		plainBytes: plainBytes,
		tags: tags,
		openTagsEnd: openTagsEnd,
		droppedBytes: (byteBuf.length == 0 && state == 0) ? 0 : byteBuf.length + 1 
	};
}

HTMLParser.addToOpenTagArray = function(array, tag) {
	if (tag.single) {
		//Single tags are ignored
		return;
	} else if (tag.closing == false) {
		//We deal with an opening tag
		array.push(tag);
        return;
	}
	/* Otherwise, we deal with a closing tag, which automatically closes
	 * ALL compatible open tags, irregardless of depth.
	 * That means, in something like: "<b>text <b>more </i>text</b></i>",
	 * the </b> closes both <b>, but not the <i>. While this is not
	 * how many browsers interpret this, it effectively deals with runaway tags
	 */
	for (var i = array.length-1; i >= 0; i-=1) {
		var oTag = array[i];
		if (tag.name == oTag.name) {
			//Match! We remove the tag
			array.splice(i, 1);
		}
	}
}

HTMLParser.toRichText = function(plainBytes, tags, openTagsStart, openTagsEnd) {
	//Sanity check
	if (openTagsStart == null) openTagsStart = new Array();
	if (openTagsEnd == null) openTagsEnd = new Array();
	if (tags == null) tags = new Array();
	
	var byteBuf = new Array();
	//At first we append the open tags from the start
	for (var i = 0; i < openTagsStart.length; i+=1) {
		concatArray(
			byteBuf,
			stringToBytes(openTagsStart[i].toString())
		);
	}
	
	//Then, we print the tags and the intervening plain bytes
	var currPos = 0;
	var currTag = null;
	for (var i = 0; i < tags.length; i += 1) {
		currTag = tags[i]; 
		if (currTag.position > currPos) {
			//Streaming intervening bytes
			var len = Math.max(0, currTag.position - currPos);
			concatArray(byteBuf,plainBytes.slice(currPos, currPos + len));
		}
		//Adding the tag
		concatArray(byteBuf,stringToBytes(currTag.toString()));
		currPos = currTag.position;
	}
	//After the tags are processed, we append the remaining plain text bytes
	var len = Math.max(0, plainBytes.length - currPos);
	concatArray(byteBuf,plainBytes.slice(currPos, currPos + len));
	
	//At the end, we append the end tags
	for (var i = 0; i < openTagsEnd.length; i+=1) {
		concatArray(
			byteBuf, 
			stringToBytes(openTagsEnd[i].toString())
		);
	}
	return byteBuf;
}


//TODO: This method does not work across record boundaries
//And it doesn't respect openTags
HTMLParser.removeTagAndContent = function(html, tagName, tagPos) {
	var byteDrop = 0;
	var startPos = html.tags[tagPos].position;
	var endPos = startPos;
	html.tags.splice(tagPos, 1);
	//We create a virtual stack of tags to get the correct envelope
	var stack = 1;
	for (var i = tagPos; i < html.tags.length; /* No counter */) {
		//Checking if the stack is empty, if yes, we remove intervening plain bytes
		if (stack <= 0) {
			byteDrop += endPos - startPos;
			if (byteDrop <= 0) break;
			html.plainBytes.splice(startPos, endPos - startPos);
			break;
		}
		//Fetching the tag
		var tag = html.tags[i];
		//We remove the tag
		html.tags.splice(i, 1);
		//Then we check if we're removed the last necessary tag
		if (tag.name == tagName) {
			//We check if the tag opens or closes
			if (tag.closing) {
				//A closer pops one off the stack
				stack -= 1;
			} else if (tag.single) {
				//A single is ignored
			} else {
				//An opener pushes one into the stack
				stack += 1;
			}
		}
		//In any case, we remember the next end
		endPos = tag.position;
	}
	//Now, we check if the stack's still active
	if (stack > 0) {
		//Too bad, we reached the end of the html buffer before we could strip tags
		//byteDrop += html.plainBytes.length - startPos;
		html.plainBytes = html.plainBytes.slice(0, startPos);
	}
	//Now that we've removed the tags, we must adjust the position of the remaining tags
	for (var i = tagPos; i < html.tags.length; i += 1) {
		var tag = html.tags[i];
		tag.position -= byteDrop;
	}
	//At the end, we return the stack height
	return stack;
}

/**
 * Translates the contents of the buffer into an encoded HTML string.
 * @param {Object} buf the buffer to translate
 * @param {Boolean} sourceIsHTML whether or not to ignore newlines
 */
HTMLParser.bufferToHTML = function(buf, encoding, sourceIsHTML) {
	//Mojo.Log.info("bufferToHTML");
	//Translating the bytes according to the given encoding
	var code = Encoding.decodeBytes(buf, encoding);
	//Now we need to convert the bytes to a string
	var text = (sourceIsHTML) ? bytesToString(code.data) : bytes2html(code.data);
	//And we return the encoded text
	return {
		dropped: code.dropped,
		text: text
	}
}

HTMLParser.translateEscapes = function(str) {
	var ret = "";
	var buf = "";
	var state = 0;
	for (var i = 0; i < str.length; i+=1) {
		var chr = str.charAt(i);
		switch (state) {
			case 0:
				if (chr == "&") {
					state = 1;
				} else {
					ret += chr;
				}
				break;
			case 1:
				if (chr == ";") {
					//We parsed an escape
					ret += HTMLParser.escapeToUTF(buf);
					buf = "";
					state = 0;
				} else if (chr == " ") {
					ret += buf;
					buf = "";
					state = 0;
				} else {
					buf += chr;
				}
				break;
		}
	}
	return ret;
}

HTMLParser.translateEscapeBytes = function(bytes) {
	var ret = new Array();
	var buf = new Array();
	var state = 0;
	for (var i = 0; i < bytes.length; i+=1) {
		var chr = bytes[i]
		switch (state) {
			case 0:
				if (chr == 0x26) {
					state = 1;
				} else {
					ret.push(chr);
				}
				break;
			case 1:
				if (chr == 0x3B) {
					//We parsed an escape
					concatArray(ret, stringToBytes(
						HTMLParser.escapeToUTF(bytesToString(buf))
					));
					buf.length = 0;
					state = 0;
				} else if (chr == 0x20) {
					concatArray(ret, buf);
					buf.length = 0;
					state = 0;
				} else {
					buf.push(chr);
				}
				break;
		}
	}
	return ret;
}


HTMLParser.escapeToUTF = function(escape) {
	if (!escape || escape.length <= 0) {
		return "";
	}
	if (escape.startsWith("#x")) {
		var code = parseInt(escape.slice(2), 16);
		return String.fromCharCode(code);
	} else if (escape.startsWith("x")) {
		var code = parseInt(escape.slice(1), 10);
		return String.fromCharCode(code);
	} else {
		//We return an unmodified escape sequence
		return "&" + escape + ";";
	}
}

/* ~~~ Tag class ~~~ */

function Tag(data, position, plainText) {
	if (typeof(data) == "undefined" || typeof("position") == "undefined") {
		//We initialize nothing. Only used for copying
		return;
	}
	if (plainText) {
		//This is not a tag, but rather plain text. Should be used sparingly
		this.plainText = true;
		this.name = data;
		this.position = position;
		this.single = true;
		return;
	} else {
		this.plainText = false;
	}
	this.position = position;
    //We strip the tag data of leading/trailing whitespaces
    data.strip();
	//And then remove leading/trailing brackets
	var start = (data.charAt(0) == "<") ? 1 : 0;
	var len = data.length;
	var end = (data.charAt(len-1) == ">") ? len-1 : len;
	if (start > 0 || end < len) {
		data = data.slice(start, end);
	}
	
	//Now, we crudely check if the tag is a comment
	if (data.match(/--[^-]*--/) != null) {
		//The tag contains a comment, dropping it whole
		this.name = null;
		this.content = null;
		return;
	}
	
	var nameEnd = data.indexOf(" ");
	if (nameEnd > 0) {
		this.name = data.slice(0, nameEnd);
		this.content = data.slice(nameEnd + 1); //Ignoring the space
	} else {
		this.name = data;
		this.content = null;
	}
	
	//The name may only contain alphanumerical chars and certain punctuation,
	//namely: "&#!:;-_/"
	var tmp = "";
	for (var i = 0; i < this.name.length; i+=1) {
		var chr = this.name.charCodeAt(i);
		var valid = (chr >= 0x30 && chr <= 0x3B) ||
				(chr >= 0x41 && chr <= 0x5A) ||
				(chr >= 0x61 && chr <= 0x7A) ||
				chr == 0x26 || chr == 0x23 || chr == 0x2D ||
				chr == 0x5F || chr == 0x2F || chr == 0x21;
		if (valid) {
			tmp += this.name.charAt(i);
		}
	}
	this.name = tmp;
	
	//Now we determine if it's a closing tag, or an opening tag, or a single statement
	this.single = false;
	this.closing = false;
	if (this.name.charAt(0) == "/") {
		//It's a closer
		this.closing = true;
		this.name = this.name.slice(1);
	} else if (this.name.charAt(this.name.length-1) == "/") {
		//It's a single statement
		this.single = true;
		this.name = this.name.slice(0, this.name.length-1);
	} else if (this.content != null &&
            this.content.charAt(this.content.length-1) == "/") {
		//It's a single statement
		this.single = true;
		this.content = this.content.slice(0, this.content.length - 1);
	}
	//At the end, we lower-case the name
	this.name = this.name.toLowerCase();
	
	//Now, we make sure that singleton tags ARE always single
	switch (this.name) {
		case "area": case "base": case "basefont":  case "br":
		case "col": case "frame": case "hr": case "img": case "input":
		case "isindex":  case "link": case "meta": case "param":
			this.single = true;
			break;	
	}
}

Tag.prototype.copyFrom = function(tag) {
	this.name = tag.name;
	this.position = tag.position;
	this.content = tag.content;
	this.closing = tag.closing;
	this.single = tag.single;
	this.plainText = tag.plainText;
}

Tag.prototype.getCopy = function() {
	var tag = new Tag();
	tag.name = this.name;
	tag.position = this.position;
	tag.content = this.content;
	tag.closing = this.closing;
	tag.single = this.single;
	tag.plainText = this.plainText;
	return tag;
}

Tag.prototype.toString = function(doEscapeSubst) {
	if (this.plainText) {
		return this.name;
	}
	//Checking if it's a html-escape tag
	if (doEscapeSubst && this.name.startsWith("&") && this.name.indexOf(";") > 0) {
		//The pReader uses a special indentation tag that stands for 3 nbsp's
		if (this.name == "&indent;") {
			return "&nbsp;&nbsp;&nbsp;";
		}
		//Otherwise, it's a normal HTML escape
		return this.name;
	}
	//Printing a normal tag
	var str = (this.closing) ? "</" : "<";
	
	str += this.name;
    if (this.content != null) {
		str += " " + this.content;
	}
	
	str += (this.single) ? "/>" : ">";
    return str;
}

Tag.prototype.getClosingClone = function() {
    var cTag = new Tag();
	cTag.copyFrom(this);
    cTag.closing = true;
    cTag.content = null;
    return cTag;
}

Tag.prototype.getAttributes = function() {
	var attr = new Array();
	if (this.content == null || this.content.length <= 0) {
		return attr;
	}
	var state = 0;
	var name = "";
	var value = "";
	var escape = false;
	for (var i = 0; i < this.content.length; i+=1) {
		var chr = this.content.charAt(i);
		switch(state) {
			case 0: //Skipping spaces and tabs till attr name start
				if (chr == " " || chr == "\t") {
					//Skipping a whitespace
					break;
				}
				//We found a non-whitespace, continuing with state=1
				state = 1;
				//No break here, because we still need to process the char!
			case 1: //Gobbling the attr name
				if (chr == " ") {
					//A space means the attribute is finished
					attr.push( {name: name.toLowerCase(), value: null} );
					name = ""; value = "";
				} else if (chr == "=") {
					//An equals sign means the start of a value
					state = 2;
				} else {
					name += chr;
				}
				break;
				
			case 2: //Gobbling values
				if (escape) {
					value += chr;
					escape = false;
					break;
				}
				switch (chr) {
					case "\\":
						escape = true;
						break;
					case "\"":
						state = 3;
						break;
					case " ":
						//End of value
						attr.push( {name: name.toLowerCase(), value: value} );
						name = ""; value = "";
						state = 0;
						break;
					case ">":
						//End of value & tag -- should not actually happen
						attr.push( {name: name.toLowerCase(), value: value} );
						name = ""; value = "";
						state = -1;
						break;
					default:
						value += chr;
						break;
				}
				break;
			case 3: //Quoted value with \"
				if (escape) {
					value += chr;
					escape = false;
					break;
				}
				switch (chr) {
					case "\\":
						escape = true;
						break;
					case "\"":
						//Finished quoted value
						attr.push( {name: name.toLowerCase(), value: value} );
						name = ""; value = "";
						state = 0;
						break;
					default:
						value += chr;
						break;
				}
				break;
		}
		if (state < 0) { break; }
	}
	//Checking if we need to stram in a last attribute
	if (name.length > 0) {
		attr.push( {name: name.toLowerCase(), value: value} );
	}
	return attr;
}

Tag.prototype.getAttribute = function(name) {
	//Fetching all attributes
	var attrs = this.getAttributes();
	for (var i = 0; i < attrs.length; i++) {
		var a = attrs[i];
		if (a != null && a.name.toLowerCase() == name.toLowerCase()) {
			return a;
		}
	}
	//No such attribute
	return null;
}
