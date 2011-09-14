/* 
 * This file specifies what methods a ByteFetcher class must offer
 * for it to be used by the Reader scene. 
 */

/**
 * This is the default constructor of a StreamReader and
 * does not initialize any stream. Subclasses should specify
 * a constructor with explicit variables to, for example, read
 * bytes from a file, an array or other stream sources and
 * initialize the stream already in the constructor. 
 */
function ByteReader(){
    //Does nothing at all. Is only present to copy this prototype.
}

/**
 * Switches the input stream of the ByteReader to the given object.
 * Depending on the implementing class, inStream can be a filename,
 * an array, a string or whatever the given ByteReader specifies.
 * @param {Object} inStream the new input stream for this reader.
 */
ByteReader.prototype.setStream = function(inStream) {
    throw("The interface should not be called directly.");
}

/**
 * This method reads 'len' bytes from the underlying stream.
 * Even though it can't be guaranteed that the bytes will be read
 * sequentially across invocations, some form of buffering should
 * be used.
 * @param {Number} start the position of the byte that should be read.
 * @param {Number} len the number of bytes that should be read.
 * 		If len is not specified 1 should be assumed.
 * @param {Function} callback if the read is asynchronous, this function
 * 		will be called when the data actually arrives.
 * @return the byte sequence as an array (even if just one byte), or null
 * 		if an invalid position or length (<0) was given.
 */
ByteReader.prototype.read = function(start, len, callback) {
    throw("The interface should not be called directly.");
}

/**
 * Returns whether or not this byteReader's read() function
 * is asynchronous or synchronous. In other words, if this
 * function returns true, the read() function returns immediately
 * and will actually call the callback function when the data
 * arrives. 
 */
ByteReader.prototype.readIsAsync = function() {
    throw("The interface should not be called directly.");
}


/**
 * Returns the length of the underlying stream, if at all available.
 */
ByteReader.prototype.getLength = function() {
    throw("The interface should not be called directly.");
}

/**
 * Closes the input stream.
 */
ByteReader.prototype.close = function(){
    throw("The interface should not be called directly.");
}

