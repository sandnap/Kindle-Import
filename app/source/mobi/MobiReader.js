
//The chars that are allowed for devID, duh!
MobiReader.validDeviceIdChars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
//This is the device ID, it is initialized by stage-assistant on startup
MobiReader.generatedDeviceId = null;

function MobiReader(reader, callback, controller) {
    //Storing the parameters
    this.reader = reader;
    this.callback = callback;
	this.controller = controller;

	if (!reader) {
		this.setStreamGiveUp();
		return false;
	}

    //Setting the new stream from that reader
    if (this.setStream(reader) == false) {
        //Calling the callback with null because the reader wasn't a PalmDoc
		this.setStreamGiveUp();
    } else {
        //It is a MobiRead! Loading is asynchronous, so the callback is called later
    }
}

//A MobiReader implements the ByteReader interface
MobiReader.prototype = new ByteReader();

/**
 * Switches the input stream of the ByteReader to the given object.
 * Depending on the implementing class, inStream can be a filename,
 * an array, a string or whatever the given ByteReader specifies.
 * @param {Object} inStream the new input stream for this reader.
 */
MobiReader.prototype.setStream = function(inStream) {
    //Checking if the stream is a ByteReader
    if (inStream) { // && inStream.isPrototypeOf(ByteReader)) {
        //Creating the PDBfile from that reader
        this.pdb = new PDBFile(inStream);

        //Now we check if the PDBFile is actually a MobiRead Document
        if (MobiRecord.isValidID(this.pdb.type, this.pdb.creator) == false) {
            //This is not a MobiRead format
            return false;
        }
        //The reader seems sound, remembering it
        this.reader = inStream;
        
        //Now, that we've read the necessary headers of the PDB file,
        //we load the first doc header
        var startOffset = this.pdb.records[0].offset;
        var endOffset = this.pdb.records[1].offset;
        var bytes = this.reader.read(startOffset, endOffset - startOffset);
        //With the record in byte form, we create the MobiRecord header
        this.header = new MobiRecord(false, bytes, null, null, false, null, 0, this.pdb);
		
		//Now, we sanity check the MobiRecord if it really contains a header
		if (this.header.isValidMobi() == false) {
			//This isn't a valid mobi
			return false;
		}
        
        //Creating the variables for the offsets
        this.uncmpOffsets = new Array();
        this.uncmpOffsets[0] = 0;
		this.unfilOffsets = null;
        
        //Creating the variables for the buffering of the last record
        this.lastRecord = null;
        this.lastRecordNum = -1;

		if (this.header.mobi.isDrmEncrypted) {
			if (this.header.mobi.isDrmVersionSupported) {
				this.showDeviceIdDialog();				
			} else {
				//This isn't a valid mobi
				return false;
			}
		} else {        
			//And calling the callback
			this.setStreamSuccess();
		}
    } else {
        throw ("Failed to pass a ByteReader to the MobiReader class");
    }
	
    return true;
}

MobiReader.prototype.setStreamGiveUp = function() {
	if (this.callback)
		this.callback(this.reader, null);
}

MobiReader.prototype.setStreamSuccess = function() {
	//Mojo.Log.info("setStreamSuccess")
	//After we succeeded opening the MobiFile, we need to parse
	//the filepos-links
	//this.parseFileposLinks(1);
	
	
	//And calling the callback
	if (this.callback)
		this.callback(this.reader, this);
	
}

MobiReader.prototype.parseFileposLinks = function(recNum) {
	//Mojo.Log.info("parseFileposLinks: " + recNum);
	var lastRecord = this.header.attribute.recordCount;
    if (this.header.mobi.firstNonBookRecord > 0) {
		lastRecord = Math.max(lastRecord, this.header.mobi.firstNonBookRecord);
    }
	//Checking if we need to initialize some data segments
	if (recNum <= 1) {
		this.filePosLinks = new Array();	
	}
	//Checking if we're done
	if (recNum >= lastRecord) {
		//We numerically sort and unique the filePosLinks
		this.filePosLinks = uniqArray(this.filePosLinks.sort(numCompare));
		
		//We store the current offset array, because we'll modify the lengths
		//later, but we need the UNFILTERED offsets
		this.unfilOffsets = this.uncmpOffsets;
		this.uncmpOffsets = new Array();
		this.uncmpOffsets[0] = 0;
		
		//And we invalidate the last loaded record number
		this.lastRecordNum = -1;
		this.lastRecord = null;
		
		//We're done parsing the links, calling the callback
		this.callback(this.reader, this);
		return;
	}
	//Otherwise, we open each record, parse the raw text for
	//<a filepos="num"> tags and record them.
	var dataBuf = [];
	var stride = 0;
	while (dataBuf.length < (16*1024) && (recNum + stride) < lastRecord) {
		var record = this.loadRecord(recNum + stride, true);
		if (record != null && record.data) {
			concatArray(dataBuf, record.data);
		}
		stride += 1;
	}
	
	if (dataBuf.length > 0) {
		//Converting the raw text to a string
		var strData = bytesToString(dataBuf);
		var tags = strData.match(/\<a[ \t\n\r]+[^\>]*\>/gi);
		//Parsing the tags and checking if it defines a filepos
		for (var i = 0; tags != null && i < tags.length; i+=1) {
			var tag = new Tag(tags[i], 0);
			if (tag.closing) {
				continue;	
			}
			var attr = tag.getAttribute("filepos");
			if (attr != null && attr.value != null && attr.value.length > 0) {
				//Mojo.Log.info("Found filepos-link: " + attr.value);
				//Storing that filePos
				var pos = parseInt(attr.value, 10);
				if (!isNaN(pos)) {
					this.filePosLinks.push(pos);					
				}
			}
		}
	}
	
	//At the end, we call ourselves deferred with the next record
	this.parseFileposLinks.bind(this, recNum + stride);//.defer();
}


// ~~~ Device ID generation ~~~

/**
 * Reads the palm nduid (hardware device id).
 */
MobiReader.readPalmNduid = function(callback) {
	//Mojo.Log.info("readPalmNduid");
	new Mojo.Service.Request('palm://com.palm.preferences/systemProperties', {
		method:"Get",
		parameters:{"key": "com.palm.properties.nduid" },
		onSuccess: callback
	});
}

/**
 * Generates a valid mobipocket device PID based on the 
 * palm nduid (hardware device id).
 * @param {String} nduid - the palm hardware device id
 */
MobiReader.generateDeviceId = function(nduid) {

	var ca = splitU32(crc32(nduid));
	var a = [];
	for(var i=0;i<nduid.length;i++) {
		a[i % 8] ^= nduid.charCodeAt(i);
	}
	for(var i=0;i<8;i++) {
		a[i] ^= ca[i & 3];
	}
	var deviceId = "";
	var ln = MobiReader.validDeviceIdChars.length;
	for(var i=0;i<8;i++) {
		b = a[i] & 0xff;
		var pos = (b >> 7) + ((b >> 5 & 3) ^ (b & 0x1f));
		deviceId += MobiReader.validDeviceIdChars.charAt(pos);
	}
	MobiReader.generatedDeviceId = MobiReader.computeDeviceIdChecksum(deviceId);
	return MobiReader.generatedDeviceId;
}

/**
 * A full mobi device ID is 10 characters (an 8 characters of data
 * followed by a 2 character checksum).
 * This function takes an 8 character string and calculates the
 * complete device ID including checksum.
 * @param {String} deviceId the first 8 characters of a full mobi
 *                 device id.
 */
MobiReader.computeDeviceIdChecksum = function(deviceId) {
	var fullDeviceId = deviceId.substring(0,8);
	var ln = MobiReader.validDeviceIdChars.length;
	var cv = crc32(deviceId,-1);
	cv = (cv < 0) ? (0xFFFFFFFF + cv + 1) : cv; //handle javascript's sign bit
	cv = (~cv) & 0xFFFFFFFF;
	cv = cv ^ (cv >> 16);
	var ct = 2;
	do {
		var cb = cv & 0xFF;
		var pos = (Math.floor(cb / ln) ^ (cb % ln)) % ln;
		fullDeviceId += MobiReader.validDeviceIdChars.charAt(pos);
		cv >>= 8;
	} while(--ct);
	return fullDeviceId;
}


// ~~~ Device ID display & validation ~~~

/**
 * Displays the device id dialog 
 * @param {Object} response - the web os serviceRequest response object
 */
MobiReader.prototype.showDeviceIdDialog = function() {
	// default dialog device ID
	this.deviceId = (this.deviceId?this.deviceId:MobiReader.generatedDeviceId);
	if (this.controller) {
		this.controller.showDialog({
			template: 'Library/DeviceId-dialog',
			assistant: new DeviceIdDialogAssistant(
							this, 
							this.validateDeviceId.bind(this),
							this.setStreamGiveUp.bind(this)
					   ),
			preventCancel: true
		});
	}
	else {
		this.setStreamGiveUp();
	}
}

/**
 * For a Mobi file with DRM, validates the device Id (PID) before
 * attempting to decrypt.  On successful validation, the book's
 * pc1 contentKey is stored in the header.attribute. 
 * @param {String} deviceId the full 10 character device id.
 */
MobiReader.prototype.validateDeviceId = function(deviceId, fromKeyring, passDB) {
	var result = false;
	var contentKey;
	var msg = "An unknown error occurred.";
	var title = "Invalid Device Id";
	var downloadMsg = "Please add your Palm's Device Id (" +
			MobiReader.generatedDeviceId + ") to your account" +
			" at the publisher's website and download the book again."; 
	
	// save for later possible correction when
	// the dialog is shown again.
	this.deviceId = deviceId.toUpperCase();
	
	do {
		result = (this.header.mobi.drmCount > 0);
		if (!result) {msg = "The book does not contain any Device Ids. "+downloadMsg; break;}

		result = (this.deviceId.length == 10);
		if (!result) {msg = "That Device Id is not a recognized format. (It should be 10 characters)"; break;}
		
		result = (this.deviceId == MobiReader.computeDeviceIdChecksum(
			this.deviceId.substring(0,8)
		));
		if (!result) {msg = "That Device Id is not a recognized format. (The checksum is invalid)"; break;}

		this.header.attribute.contentKey = this.findContentKey(this.deviceId);
		result = (this.header.attribute.contentKey && this.header.attribute.contentKey.length);
		if (!result) {
			msg = "That Device Id does not match the one required to open the book. "+downloadMsg;
			break;
		}

		//Mojo.Log.info(this.header.mobi.drmExpireDate);
		//Mojo.Log.info(this.header.mobi.drmEffectiveDate);
		result = (!this.header.mobi.drmEffectiveDate || this.header.mobi.drmEffectiveDate < new Date())
			&& (!this.header.mobi.drmExpireDate || this.header.mobi.drmExpireDate > new Date());
		if (!result) {
			msg = "That Device Id is correct, however the book has been expired by the publisher." 
				  + " The book is valid from " 
				  + this.header.mobi.drmEffectiveDate 
				  + " to " + this.header.mobi.drmExpireDate + "."; 
			title = "Expired DRM";
			break;
		}

	} while(false);
	if(result) {
		// valid deviceId, content key stored in header.attribute
		//Now, we check if the devID can be added to the Keyring DB
		if (!fromKeyring) {
			//Asking whether to add to the password DB
			PasswordDB.askAddData(
				this.controller, passDB, PasswordDB.TYPE_DEVICEID,
				null, this.deviceId,
				this.setStreamSuccess.bind(this)
			);
		} else {
			//Not a new password
			this.setStreamSuccess();
		}
		//Now that we've got the content key, we can drop the deviceId
		this.deviceId = "";
	} else {
		// invalid input, display notice, ask again for deviceId
		if (this.controller) {
			this.controller.showAlertDialog( {
				onChoose: this.showDeviceIdDialog.bind(this),
				title: title,
				message: msg,
				choices: [{
					label: $L('Okay'),
					value: "okay",
					type: 'affirmative'
				}]
			});
		} else {
			this.setStreamGiveUp();
		}
	}
}

/**
 * Searches the DRM data of the mobi header to find the
 * content pc1 decryption key for a Device Id
 * @param {String} deviceId a mobi device id.
 */
MobiReader.prototype.findContentKey = function(deviceId) {
	
	//Defining the general decryption method, given a secondary key and drmBlock
	var decrypter = function(secondaryKey, drmBlock, noCheckFlags) {
		var contentKey;
		//Calculating the check sum of the key
		var secondaryChkSum = 0;
		var ct = secondaryKey.length;
		do {
			secondaryChkSum += secondaryKey[--ct];
		} while(ct);
		secondaryChkSum &= 0xFF;
		
		for (var i=0; i<this.header.mobi.drmCount; i++) {
			var drmEntry = drmBlock.slice(i*48,(i+1)*48);
			var entryVerify = concatBytesVar(
				drmEntry[0], drmEntry[1], drmEntry[2], drmEntry[3]
			);
			var entrySize = concatBytesVar(
				drmEntry[4], drmEntry[5], drmEntry[6], drmEntry[7]
			);
			var entryType = concatBytesVar(
				drmEntry[8], drmEntry[9], drmEntry[10], drmEntry[11]
			);
			var entryChkSum = drmEntry[12];
			// next 3 bytes (index 13-15) unused
			var entryEncryptedKeySection = drmEntry.slice(16,16+32);
			var entryKeySection = pc1(secondaryKey, entryEncryptedKeySection); 
	
			var entryKeyVerify = concatBytesVar(
				entryKeySection[0], entryKeySection[1], entryKeySection[2], entryKeySection[3]
			);
			var entryKeyFlags1 = concatBytesVar(
				entryKeySection[4], entryKeySection[5], entryKeySection[6], entryKeySection[7]
			);
			var entryContentKey = entryKeySection.slice(8,8+16);
			var entryKeyExpireDate = concatBytesVar(
				entryKeySection[24], entryKeySection[25], entryKeySection[26], entryKeySection[27]
			);
			var entryKeyEffectiveDate = concatBytesVar(
				entryKeySection[28], entryKeySection[29], entryKeySection[30], entryKeySection[31]
			);
			
			/*
			Mojo.Log.info(
				"Data: entryVerify = " + entryVerify + "; entryKeyVerify = " + entryKeyVerify +
				"; secChk = " + secondaryChkSum + "; entryChk = " + entryChkSum +
				"; flags = " + entryKeyFlags1
			);
			*/
			
			if (entryVerify == entryKeyVerify 
				&& secondaryChkSum == entryChkSum 
				&& ( noCheckFlags || (entryKeyFlags1 & 0x1F) == 1)) {
	
				if (entryKeyExpireDate != 0 && entryKeyExpireDate != -1) {
					this.header.mobi.drmExpireDate = new Date();
					this.header.mobi.drmExpireDate.setTime(entryKeyExpireDate*60000);
				}
				if (entryKeyEffectiveDate != 0 && entryKeyEffectiveDate != -1) {
					this.header.mobi.drmEffectiveDate = new Date();
					this.header.mobi.drmEffectiveDate.setTime(entryKeyEffectiveDate*60000);
				}
	
				contentKey = entryContentKey;
				break;
			}
		}
		//Mojo.Log.info("ContentKey = " + contentKey);
		return contentKey;
	}.bind(this);

	var contentKey;
	
	//At first, we try the PID-based decoding
	var id = stringToBytes(deviceId.substring(0,8));
	concatArray(id,fillArray(16-id.length,0));
	var primaryKey = [0x72, 0x38, 0x33, 0xB0, 0xB4, 0xF2, 0xE3, 0xCA,
					  0xDF, 0x09, 0x01, 0xD6, 0xE2, 0xE0, 0x3F, 0x96];

	var secondaryKey = pc1(primaryKey, id, false);
	
	var drmBlock = this.header.data.slice(
		this.header.mobi.drmOffset,
		this.header.mobi.drmOffset + this.header.mobi.drmSize
	);

	contentKey = decrypter(secondaryKey, drmBlock, false);
	
	if (contentKey == undefined) {
		//Okay, the PID-based decryption failed.
		//Trying the default coding that doesn't need a PID
        secondaryKey = primaryKey;
		contentKey = decrypter(secondaryKey, drmBlock, true);
	}
	return contentKey;
}


// ~~~ Data retrieval ~~~

MobiReader.prototype.loadRecord = function(num, noFilter) {
	//Mojo.Log.info("loadRecord: " + num);
	if (!noFilter) noFilter = false;
	
    if (this.lastRecordNum == num) {
        //We've already buffered the record, returning it
        return this.lastRecord;
    }
    var bytes = this.pdb.loadRecordBytes(num);
    if (bytes && bytes != null) {
		var openTags = (this.lastRecord != null)
			? this.lastRecord.openTags : null;
		//Mojo.Log.info("OpenTags = " + ((openTags != null) ? openTags.length : 0));
		var currBytePos = (this.unfilOffsets != null)
			? this.unfilOffsets[num - 1]
			: this.uncmpOffsets[num - 1];
        record = new MobiRecord(
			true, bytes, this.header, openTags,
			noFilter, this.filePosLinks, currBytePos
		);
		// first text record? insert cover image if present
		if (!noFilter && num==1 && this.header.exth.coverImage.length>0)  { 
			record.data = stringToBytes(
				this.header.exth.coverImage
			).concat(record.data);
		}
        //Buffering this record
        this.lastRecord = record;
        this.lastRecordNum = num;
        
        //Storing the new offset
        this.uncmpOffsets[num] = this.uncmpOffsets[num - 1] +
                this.lastRecord.data.length;

        //And returning it
        return record;
    } else {
        return null;
    }
}

/**
 * This method reads 'len' bytes from the Palm Doc file.
 *
 * @param {Number} start the position of the byte that should be read.
 * @param {Number} len the number of bytes that should be read.
 *         If len is not specified 1 should be assumed.
 */
MobiReader.prototype.read = function(start, len) {
    //Mojo.Log.info("Will read " + len + " bytes @ " + start)
    //Checking if len was assigned
    if (!len) len = 1;
    //Sanitizing start and len
    start = Math.floor(start);
    len = Math.floor(len);
    
    //Now we load the data of the records till we've completely filled the buffer
    var buf = new Array();
    var bytePos = start;
    while (buf.length < len) {
        //We use the uncmpOffsets to find the correct record
        var num = this.getRecordNumForByte(start + buf.length);
        if (num <= 0 || num > this.header.attribute.recordCount) {
            //No such text record; probably EOF, returning what's in the buffer
            return buf;
        }
        //Loading that record
        var record = this.loadRecord(num);
        //Checking if record was loaded
        if (!record || record == null) {
            //Couldn't load the record, that's bad
            return buf;
        }
        
        //Now, we can fetch data from the record
        var pos = start + buf.length - this.uncmpOffsets[num-1];
        while(buf.length < len && pos < record.data.length) {
            //TODO: It might be possible that some record entries are invalid.
            //In this case, test for existence of record.data
            buf.push(record.data[pos]);
            pos += 1;
        }
    }
    //Now, we can return the buffer
    return buf;
}

/**
 * Returns whether or not this byteReader's read() function
 * is asynchronous or synchronous. In other words, if this
 * function returns true, the read() function returns immediately
 * and will actually call the callback function when the data
 * arrives. 
 */
MobiReader.prototype.readIsAsync = function() {
    return false;
}

MobiReader.prototype.getRecordNumForByte = function(start) {
    for (var i = 0; i < this.uncmpOffsets.length - 1; i++) {
        if (this.uncmpOffsets[i] <= start && this.uncmpOffsets[i+1] > start) {
            return i + 1;
        }
    }
    //We return the last record
    return i + 1;
}

/**
 * Returns the length of the uncompressed underlying stream.
 */
MobiReader.prototype.getLength = function() {
    //The total length is stored in the first DOC-header's records
    return this.header.attribute.textLength;
}

/**
 * Closes the input stream.
 */
MobiReader.prototype.close = function(){
    //Does nothing yet
}

/**
 * Returns the data content of the image with the given label.
 * @param {Object} label the name of the image; in this case
 * 		it's the record number in which the image is stored
 * @return an array of bytes.
 */
MobiReader.prototype.getImage = function(label) {
	//Mojo.Log.info("MobiReader: Fetching image " + label);
	//Sanity check
	if (typeof(label) == "undefined" || label == null) {
		return null;
	}
	//Checking if the image Fifo buffer is intact
	if (!this.imgFifoBuf) {
		this.imgFifoBuf = new FifoBuffer(5);
	}
	//Trying to parse the label
	var recNum = parseInt(label, 10);
	if (recNum == null || isNaN(recNum) || recNum <= 0) {
		//We currently do not support explicit filenames
		//TODO: The docs tell me such MobiPocket files ought to exist
		//But I do not know how to translate the name to a recIndex
		return null;
	}
	//Checking if the label's in our buffer
	var buf = this.imgFifoBuf.get(label);
	if (buf != null) {
		//We've buffered a result, returning it
		return buf;
	}
	//Adding the image record offset
	recNum += this.header.mobi.imageOffset - 1;
	//Checking if the img number is valid
	if (recNum < this.header.mobi.imageOffset || recNum >= this.pdb.numRecords) {
		return null;
	}
	//Now we can load the byte data of the image
	var bytes = this.pdb.loadRecordBytes(recNum);
	//Sanity checking the bytes
	if (!bytes || bytes == null) { return null; }
	
	//Before we return the bytes, we buffer them
	this.imgFifoBuf.push(label, bytes);
	
	return bytes;
}

MobiReader.prototype.getExpireDate = function() {
	if (this.header.mobi.drmExpireDate) {
		return this.header.mobi.drmExpireDate;
	} else {
		return null;
	}
}