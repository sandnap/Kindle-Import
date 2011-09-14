
/**
 * Attempts to read the file specified by the given URL.
 * Sets File.ready to true on success.
 * Sets File.failure to true on failure.
 * @param url the URL from which the file should be retrieved.
 * @param callback the function that is called upon success/failure
 * @param caller (optional) the "this" object of the caller.
 */
function File(url, callback, caller) {
	//Storing the URL used to invoke this file
	this.url = url;
    //Remembering the callBack
    this.callback = callback;
    this.caller = caller;
	this.ready = false;
    this.setStream(url)
}

//A File implements the ByteReader interface
File.prototype = new ByteReader();

/**
 * Continually checks if the file is loaded completely and sets
 * the internal ready/failure flags.
 * @param {Object} realThis a link to this object. Needed because
 *         setTimeout() does not guarantee that the "this" variable is
 *         set up correctly upon re-entry.
 */
File.prototype.refresh = function(realThis) {
    if (realThis.request.readyState == 4) {
        //TODO: This check SHOULD definitively be uncommented
        if (realThis.request.status >= 200 && realThis.request.status < 300) {
            realThis.ready = true;
            realThis.data = realThis.request.responseText;            
        } else {
            realThis.failure = true;
        }
		//DEBUG! Writing the status
		//$("text").innerHTML = realThis.request.status;
        //Starting the Callback
        realThis.callback(realThis, realThis.caller);
    } else {
		//We re-schedule the refresher
		setTimeout(realThis.refresh, 100, realThis);
	}
}

/**
 * Switches the input stream of the ByteReader to the given file.
 * @param {String} inStream the filename of the new File to be loaded.
 */
File.prototype.setStream = function(inStream) {
    this.ready = false;
    this.failure = false;
	/* TODO: We may have to encode the non-ASCII chars, or we might not.
	 * Since we don't access web pages at the moment, I decided we do not
	 * Do note that IF we encode, the filename needs to be decoded before
	 * being displayed as a string. For example in the handleTXT method of
	 * the library assistant.
	 */
    //this.url = encodeURI(inStream);
    this.data = "";
    this.state = 0;
    
    //Starting the asynchronous AJAX request for that file
    this.request = new XMLHttpRequest();
    this.request.open('GET', this.url, true);
    /* Forcing plain-text and x-user-defined. Why do we do this?
     * Internally, JS uses UTF-8 strings, so a single char
     * may be 1 Byte or 2 Bytes long. Unfortunately, 8-Bit encodings
     * are not translated directly since some characters are
     * replaced by their 2-Byte equivalents. This quite obviously
     * sucks for binary data. Fortunately, the charset "x-user-defined"
     * is an untranslated 8-Bit code.
     */
    this.request.overrideMimeType('text/plain;charset=x-user-defined');
    this.request.setRequestHeader('Content-Type', 'text/plain;charset=x-user-defined')
	
    this.request.send(null);
    
    //We refresh
    this.refresh(this);
}

/**
 * This method reads 'len' bytes from the underlying stream.
 * @param {Number} start the position of the byte that should be read.
 * @param {Number} len the number of bytes that should be read.
 *         If len is not specified 1 should be assumed.
 */
File.prototype.read = function(start, len) {
    //Sanity-checking if we're ready
    if (!this.ready) return null;
    //Checking if len was assigned
    if (!len) len = 1;
    //Sanity checking the start / length
    if (start < 0 || start >= this.data.length || len <= 0) {
        return null;
    }
    
    //We convert the selected chars into bytes
    var buf = new Array();
    for (var i = start; i < start+len; i++) {
        //Checking if we've exceeded the string length
        if (i >= this.data.length) break; 
        //Fetching the i-th character
        var byt = this.data.charCodeAt(i);
        //Bytes above 0x7F are coded as 0xF7xx where xx is the real code
        if (byt > 0xFF) byt &= 0xFF;
        buf.push(byt);
    }
    //Returning the byte sequence
    return buf;
}

/**
 * Returns whether or not this byteReader's read() function
 * is asynchronous or synchronous. In other words, if this
 * function returns true, the read() function returns immediately
 * and will actually call the callback function when the data
 * arrives. 
 */
File.prototype.readIsAsync = function() {
    return false;
}

/**
 * Returns the length of the underlying stream, if at all available.
 */
File.prototype.getLength = function() {
    return this.data.length;
}

File.prototype.getBasename = function() {
	return File.extractBasename(this.url);
}

File.prototype.getPathname = function() {
	return File.extractPathname(this.url);
}

/**
 * Closes the input stream.
 */
File.prototype.close = function(){
    //We throw away the data, and set the necessary flags
    this.ready = false;
    this.failure = false;
    this.state = 0;
    this.data = null;
    this.request = null;
}


File.extractBasename = function (str) {
	return str.substr(str.lastIndexOf("/") + 1);
}

File.extractPathname = function (str) {
	return str.substr(0, str.lastIndexOf("/"));
}

