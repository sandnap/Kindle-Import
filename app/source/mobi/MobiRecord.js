/**
 * Parses the bytes of a MobiRead record and decompresses them if necessary.
 * @param isTextData whether or not this is the first header record, or one of
 *        the further text records.
 * @param bytes the bytes of the target record as an array of integers
 * @param headerRecord, a link back to the header, if it's a text record.
 */
function MobiRecord(isTextData, bytes, headerRecord, openTags,
		noFilter, filePosLinks, recordOffset, pdb) {
    //Loading the defaults
    this.loadDefaults(isTextData);
    //Checking if there's a byte sequence to parse
    if (!bytes) {
        //Nothing to do anymore
        return;
    }
	
    //Actually parsing the byte data
    if (isTextData) {
        //Remembering the header
        this.header = headerRecord;
        //Checking if the text is plain or compressed or DRMed
		if (this.header.mobi.isDrmEncrypted) {
			var extraSize = this.getExtraDataSize();			
			var extraBytes = bytes.slice(bytes.length-extraSize,bytes.length+1);
			bytes = pc1(
				this.header.attribute.contentKey,
				bytes.slice(0,bytes.length - extraSize)
			);
			if (extraSize > 0) {
				concatArray(bytes,extraBytes); // extra bytes (if any) are never encrypted
			}
			// now, fall-thru to standard decompression processing
		}
		if (this.header.mobi.isLZ77Compressed) {
			//Using Palm Doc LZ77 decompression
			this.data = new Lz77().decompress(bytes);
		} else if (this.header.mobi.isHuffCdicCompressed) {
			//This is a Huff-Cdic compressed file
			this.data = new HuffCDIC(this.header.huff).decompress(bytes);
        } else {
            //We assume uncompressed Data
            this.data = bytes;
        }
		//Now, we need to clean the data of all markup		
		if (!noFilter) {
			this.openTags = this.filterMarkup(openTags, filePosLinks, recordOffset);			
		} else {
			this.openTags = openTags;
		}
    } else {
		this.pdb = pdb;
		this.data = bytes;
        this.parseHeader(bytes);
    }
}

MobiRecord.isValidID = function(type, creator) {
	if (type == "BOOK" && creator == "MOBI") {
		return true;
	}
	return false;
}

MobiRecord.prototype.loadDefaults = function(isTextData) {
    this.isTextData = isTextData;
    if (isTextData) {
        //Initializing data
        this.data = new Array();
        //We don't know what header to link to yet
        this.header = null;
    } else {
        //Initializing a doc header
        this.attribute = { 
	        compression: 0,
	        textLength: 0,
	        recordCount: 0,
	        recordSize: 0,
	        currReadingPos: 0
		}
		this.mobi = {
			headerLen: 0,
			firstNonBookRecord: 0,
			fullName: null,
			encryption: 0,
			exthFlags: 0,
			exthOffset: 0,
			imageOffset: 0,
			drmOffset: 0,
			drmCount: 0,
			drmSize: 0,
			drmFlags: 0,
			drmEffectiveDate: undefined,
			drmExpireDate: undefined,
			extraDataFlags: 0,
			isLZ77Compressed: false,
			isHuffCdicCompressed: false,
			isHuffCdicSupported: false,
			isDrmEncrypted: false,
			isDrmVersionSupported: false
		}
		this.exth = {
			id: "",
			headerLen: 0,			
			recordCount: 0,
			coverImage: ""
		}
		this.huff = {
			recordOffset: 0,
			recordCount: 0,
			records: [],
			entryBits: 0,
			index1: [],
			index2: [],
			dictionaries: []
		}
        //A header is its own header
        this.header = this;
    }
}

MobiRecord.prototype.isValidMobi = function() {
	//This is a really, really simple validity check
	return (
		(!this.header.mobi.isDrmEncrypted || this.header.mobi.isDrmVersionSupported)
		&& (!this.header.mobi.isHuffCdicCompressed || this.header.mobi.isHuffCdicSupported)
	);

	// comparing firstNonBookRecord to recordCount does not appear to be reliable
	//	this.mobi.firstNonBookRecord > 0 &&
	//	this.mobi.firstNonBookRecord < this.attribute.recordCount;
}

MobiRecord.prototype.parseHeader = function(bytes) {

	/*
	 * first 16 bytes are the palmdoc header
	 */

	if (bytes.length < 16) {
        //This is a hard error!
        return;
    }
    //Compression is set in bytes 1 & 2
    this.attribute.compression = concatBytesVar(
		bytes[0], bytes[1]
	);
	// (bytes 3 & 4 unused)
    // Text length are the bytes 5,6,7,8
    this.attribute.textLength = concatBytesVar(
        bytes[4], bytes[5], bytes[6], bytes[7]
	);
    // Record count is stored in bytes 9 & 10 
	// (apparently for Mobi docs, this is the text record count only)
    this.attribute.recordCount = concatBytesVar(
        bytes[8], bytes[9]
    );
    //Record size is in bytes 11 & 12 and SHOULD always be 4096
    this.attribute.recordSize = concatBytesVar(
        bytes[10], bytes[11]
    );
    // bytes (13-14) are encryption type (mobi document spec)
    this.mobi.encryption = concatBytesVar(
        bytes[12], bytes[13]
    );
	// bytes 15 & 16 are unused (mobi document spec)

	this.mobi.isLZ77Compressed = (this.attribute.compression == 2);
	this.mobi.isHuffCdicCompressed = (this.attribute.compression == 17480);
	this.mobi.isDrmEncrypted = (this.mobi.encryption != 0);
	this.mobi.isDrmVersionSupported = (this.mobi.encryption == 2);
	
	/*
	 * now parse the mobi header
	 */

	//After we processed the first 16 bytes, we decode the MOBI header
	if (bytes.length < 24) {
		//This record has no MOBI field. Strange
		this.header = this;
		return;
	}
	//We first check if the bytes 16-19 are spelling "MOBI"
	var text = bytesToString([
		bytes[16], bytes[17], bytes[18], bytes[19] 
	]);
	if (text != "MOBI") {
		Mojo.Log.error("The given file isn't a valid MOBI file. Aborting. ")
		this.header = this;
		return;
	}

	// So, it is a MOBI file, we now check whether the header's long enough
    // Mobi Header Length is stored in bytes 21 thru 24
	this.mobi.headerLen = concatBytesVar(
	   bytes[20], bytes[21], bytes[22], bytes[23]
	);

	if ((this.mobi.headerLen+16) < 92 || bytes.length < 92) {
		Mojo.Log.error("The given file's MOBI header is too short. Aborting.")
		this.header = this;
		return;
	}
	this.mobi.firstNonBookRecord = concatBytesVar(
        bytes[80], bytes[81], bytes[82], bytes[83]
    );
	
	//Now, we fetch the full name offset & length
	var fullNameOffset = concatBytesVar(
        bytes[84], bytes[85], bytes[86], bytes[87]
    );
	var fullNameLength = concatBytesVar(
        bytes[88], bytes[89], bytes[90], bytes[91]
    );
	//Checking if we can fetch a full name
	if (fullNameLength + fullNameOffset >= bytes.length) {
		//We can't read the name
		Mojo.Log.error("This MOBI file has an invalid fullName position.")
		this.header = this;
		return;
	}
	//Otherwise, we store the full name
	this.mobi.fullName = "";
	for (var i = fullNameOffset; i < fullNameOffset + fullNameLength; i+=1) {
		this.mobi.fullName += String.fromCharCode(bytes[i]);
	}
	
	//We parse the image record offset
	if ((this.mobi.headerLen+16) > 111 || bytes.length > 111) {
		this.mobi.imageOffset = concatBytesVar(
			bytes[108], bytes[109], bytes[110], bytes[111]
		);
	} else {
		this.mobi.imageOffset = Number.POSITIVE_INFINITY;
	}

	this.mobi.isHuffCdicSupported = false;
	if (this.mobi.isHuffCdicCompressed && 
		((this.mobi.headerLen+16) > 119 || bytes.length > 119)) {
		this.huff.recordOffset = concatBytesVar(
			bytes[112], bytes[113], bytes[114], bytes[115]
		);
		this.huff.recordCount = concatBytesVar(
			bytes[116], bytes[117], bytes[118], bytes[119]
		);
		var j=0;
		for(var i=this.huff.recordOffset;i<this.huff.recordCount+this.huff.recordOffset;i++) {
			 this.huff.records[j++] = this.pdb.loadRecordBytes(i);
		}

		var h1 = this.huff.records[0];
		var h2 = this.huff.records[1];

		if (bytesToString(h1.slice(0,4)) == "HUFF"
			&& h1[4]==0 && h1[5]==0 && h1[6]==0 && h1[7]==24
			&& bytesToString(h2.slice(0,4)) == "CDIC"
			&& h2[4]==0 && h2[5]==0 && h2[6]==0 && h2[7]==16) {
			
			this.huff.entryBits = concatBytesVar(
				h2[12], h2[13], h2[14], h2[15]
			);

			var ind1Offset = concatBytesVar(
				h1[16], h1[17], h1[18], h1[19]
			);

			var ind2Offset = concatBytesVar(
				h1[20], h1[21], h1[22], h1[23]
			);
			
			for(var i=0;i<256;i++) {
				var j = ind1Offset+i*4;
				this.huff.index1[i] = concatBytesVar(
					h1[j+3], h1[j+2], h1[j+1], h1[j]
				); 
			}

			for(var i=0;i<64;i++) {
				var j = ind2Offset+i*4;
				this.huff.index2[i] = concatBytesVar(
					h1[j+3], h1[j+2], h1[j+1], h1[j]
				); 
			}

			for(var i = 1; i < this.huff.recordCount; i++) {
				this.huff.dictionaries[i-1] = this.huff.records[i];
			}

			this.huff.records = []; // done with the records.
			this.mobi.isHuffCdicSupported = this.huff.dictionaries.length>0;
		}
	} 

	if (bytes.length > 131 && this.mobi.headerLen > 131-16) {
		this.mobi.exthFlags = concatBytesVar(
			bytes[128],bytes[129],bytes[130],bytes[131]
		);
	}

	// 16 byte drm block bytes 169 - 184
	if (this.mobi.isDrmEncrypted 
		&& this.mobi.isDrmVersionSupported
		&& bytes.length > 183
		&& this.mobi.headerLen > 183-16) { 
		this.mobi.drmOffset = concatBytesVar(
			bytes[168], bytes[169], bytes[170], bytes[171]
		);
		this.mobi.drmCount = concatBytesVar(
			bytes[172], bytes[173], bytes[174], bytes[175]
		);
		this.mobi.drmSize = concatBytesVar(
			bytes[176], bytes[177], bytes[178], bytes[179]
		);
		this.mobi.drmFlags = concatBytesVar(
			bytes[180], bytes[181], bytes[182], bytes[183]
		);
	}

	if (bytes.length > 243 && this.mobi.headerLen > 243-16) {
		this.mobi.extraDataFlags = concatBytesVar(
			bytes[242],bytes[243]
		);
	}

	/*
	 * now parse the extended mobi header (EXTH)
	 */

	if (bytes.length > this.mobi.headerLen+16+4 && 
		this.mobi.exthFlags & 0x40) { // indicates presence of EXTH header
		this.mobi.exthOffset = this.mobi.headerLen+16;
		this.exth.id = bytesToString(
			bytes.slice(this.mobi.exthOffset,this.mobi.exthOffset+4)
		);
	}
	if (this.exth.id == "EXTH" && bytes.length > this.mobi.exthOffset+12) {
		this.exth.headerLen = concatBytes(
			bytes.slice(this.mobi.exthOffset+4, this.mobi.exthOffset+8)
		);
		this.exth.recordCount = concatBytes(
			bytes.slice(this.mobi.exthOffset+8, this.mobi.exthOffset+12)
		);		
		var off = this.mobi.exthOffset + 12;
		for(var i=0; i<this.exth.recordCount; i++) {
			if (bytes.length > off + 8) {
				var exthRecType = concatBytes(
					bytes.slice(off, off + 4)
				);		
				var exthRecLen = concatBytes(
					bytes.slice(off + 4, off + 8)
				);
				//Mojo.Log.info("EXTH rec type=" + exthRecType);
				 // coverOffset is type=201
				if (exthRecType == 201 && bytes.length >= off + exthRecLen) {
					var coverOffset = concatBytes(
						bytes.slice(off + 8, off + exthRecLen)
					);
					this.exth.coverImage = (coverOffset+1).toString();
					this.exth.coverImage = '<center><img label="'
						+"00000".substring(0,5-this.exth.coverImage.length)
						+this.exth.coverImage
						+'"/></center>';;
				}
				off += exthRecLen;
			}
		}
	}

	enyo.error("rec 0 bytes len="+bytes.length);
	enyo.error("compression="+this.attribute.compression);
	enyo.error("rec ct="+this.attribute.recordCount);
	enyo.error("rec sz="+this.attribute.recordSize);
	enyo.error("txt len="+this.attribute.textLength);

	enyo.error("mobi headLn="+this.mobi.headerLen);
	enyo.error("encryption="+this.mobi.encryption);
	enyo.error("extraData="+this.mobi.extraDataFlags);
	enyo.error("fullname="+this.mobi.fullName);
	enyo.error("first nonbook rec="+this.mobi.firstNonBookRecord);
	enyo.error("imageoffset="+this.mobi.imageOffset);

	enyo.error("drm offset="+this.mobi.drmOffset);
	enyo.error("drm count="+this.mobi.drmCount);
	enyo.error("drm size="+this.mobi.drmSize);
	enyo.error("drm flags="+this.mobi.drmFlags);	

	enyo.error("exth records="+this.exth.recordCount);	
	enyo.error("exth coverImage="+this.exth.coverImage);	

	enyo.error("huff off="+this.huff.recordOffset);	
	enyo.error("huff count="+this.huff.recordCount);	
	enyo.error("huff supported="+this.mobi.isHuffCdicSupported);	
	enyo.error("huff ebits="+this.huff.entryBits);	

    //A header is its own header
    this.header = this;
}

MobiRecord.prototype.filterMarkup = function(openTags, filePosLinks, recordOffset) {
	//Mojo.Log.info("filterMarkup, offset: " + recordOffset);
	//Before we parse the stream, we must generate labels for the filepos links
	var nData = new Array();
	var last = 0;
	for (var i = 0; i < filePosLinks.length; i+=1) {
		var gPos = filePosLinks[i];
		var lPos = gPos - recordOffset;
		if (lPos < 0) {
			continue;
		} else if (lPos >= this.data.length) {
			break;
		}
		//Mojo.Log.info("Inserting link target: " + gPos);
		//It's a valid position, creating a "<a name="xyz></a>" tag
		var tag = stringToBytes("<a name=\"mobiFilePos" + gPos + "\"></a>")
		if (last < lPos) {
			//We must stream in additional bytes; making sure that we don't 
			//insert in the middle of a tag (happens with broken filePos offsets)
			var extraBytes = this.data.slice(last, lPos);
			var inPos = -1;
			var startPos = Math.max(0, extraBytes.length - 25);
			for (var j = extraBytes.length - 1; j >= startPos; j-=1) {
				if (extraBytes[j] == 0x3C) {
					inPos = j;
					break;
				}
			}
			if (inPos < 0) {
				//We can safely add the extra bytes and tag sequentially
				concatArray(nData, extraBytes);
				concatArray(nData, tag);				
			} else {
				//We must add the anchor tag in front of the open tag
				concatArray(nData, extraBytes.slice(0, inPos));
				concatArray(nData, tag);
				concatArray(nData, extraBytes.slice(inPos));
			}
		} else {
			//No intermediate bytes, streaming directly
			concatArray(nData, tag);
		}
		last = lPos;		
	}
	//At the end, we stream in the remaining bytes
	concatArray(nData, this.data.slice(last));
	this.data = nData;
	
	//Parsing the stream for tags; if openTags are valid, we prepend them
	var html = null;
	if (openTags) {
		concatArray(openTags, this.data);
		html = HTMLParser.parseBytes(openTags, null);
	} else {
		html = HTMLParser.parseBytes(this.data, null);
	}
	
	//We filter out / replace some tags
	//Mojo.Log.info("Processing tags");
	for (var i = 0; i < html.tags.length; i+=1) {
		var tag = html.tags[i];
		//Mojo.Log.info(tag.toString());
		switch (tag.name) {
			case "html": 	//The html tag is removed
			case "body": 	//The body tag is removed
			case "font":	//Font tags are removed
			case "mbp":		//mbp tags are removed
			case "mbp:frameset":
			case "blockquote":
				html.tags.splice(i--, 1);
				break;
			case "img": 	//Img tags are converted to <img label=""> tags
				//<img hisrc="c480.gif" src="c220.gif" losrc="c140.gif"/>
				//OR
				//<img recindex="00001"/>
				//Mojo.Log.info("MobiRecord: Found IMG: " + tag.toString());
				//We remove closing imgs tag
				if (tag.closing == true) {
					html.tags.splice(i--, 1);
					break;
				}
				//We check if there's a recIndex defined
				var src = tag.getAttribute("recindex");
				//Otherwise, we check for the src links and use the best resolution
				if (src == null) src = tag.getAttribute("hisrc");
				if (src == null) src = tag.getAttribute("src");
				if (src == null) src = tag.getAttribute("losrc");
				//We check if the source is sane
				if (src == null || src.length <= 0) {
					//Invalid img tag, we remove it
					html.tags.splice(i--, 1);
					break;
				}
				//Replacing the content of the tag with the label
				tag.content = "label=\"" + src.value + "\"";
				break;
			case "head": 	//The head tag and everything in it is removed
			case "script": 	//Script tags are removed
			case "style": 	//Style tags are removed
				HTMLParser.removeTagAndContent(html, tag.name, i);
				//We removed at least one tag
				i--;
				break;
			case "dfn": //Definitions are replaced with <i> or </i>
				var newTag = (tag.closing)
					? new Tag("/i", tag.position)
					: new Tag("i", tag.position); 
				html.tags.splice(i, 1, newTag);
				break;
			case "div": //Div tags specify an align are replaced with <br/>, otherwise dropped
				if (!tag.closing) {
					var attr = tag.getAttribute("align");
					if (!attr) {
						html.tags.splice(i--, 1);
						break;
					} else {
						//We splice in a single <br/>
						html.tags.splice(i, 1,
							new Tag("br/", tag.position)
						)
						break;
					}	
				}
				//We remove closing tags
				html.tags.splice(i--, 1);
				break;
			case "p": //p tags are translated into two <br/>
			case "mbp:pagebreak": //As are pagebreaks
				if (tag.closing) {
					//Closing p tags are completely removed
					html.tags.splice(i, 1);
					i--;
				} else {
					//Opening tags are replaced
					html.tags.splice(i, 1,
						new Tag("br/", tag.position),
						new Tag("br/", tag.position)
					);
					//We inserted one more tag
					i+=1;
				}
				break;
			// ~~~ Link tags ~~
			case "a":
				//If they define a "filePos", we must translate them into labels
				//Do note that the targets of those labels must have been inserted
				//into the stream beforehand!
				if (tag.closing) {
					//Skipping closers; do note that this might leave orphaned closers
					continue;
				}
				attr = tag.getAttribute("filepos");
				if (attr != null && attr.value != null && attr.value.length > 0) {
					var pos = parseInt(attr.value, 10);
					if (!isNaN(pos)) {
						//Splicing in the a-href tags
						html.tags.splice(i, 1,
							new Tag("a href=\"#mobiFilePos" + pos + "\"/", tag.position)
						);
					}
				} else {
					//Checking if we deal with a useless anchor tag
					attr = tag.getAttribute("name");
					attr2 = tag.getAttribute("href");
					if ((attr == null || attr.value == null || attr.value.length <= 0) &&
							(attr2 == null || attr2.value == null || attr2.value.length <= 0)) {
						//Dropping this useless tag
						//Mojo.Log.info("Dropping useless tag: " + tag.toString());
						html.tags.splice(i--, 1);
					}
				}
				break;
			// ~~~ Allowed tags, that don't get altered ~~~
			case "b": case "i": case "big": case "small": case "br":
			case "center": case "code": case "pre": case "em": case "u":
			case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
			case "hr": case "s": case "strike": case "span": case "sub": case "sup":
				//Passed through
				break;
			// ~~~ Every other tag is dropped ~~~
			default:
				html.tags.splice(i--, 1);
				break;		
		}
	}
	
	//Now, if the html parser dropped bytes from the end due to
	//open tags, these must be preserved for the next run
	//Mojo.Log.info("MobiRecord dropped " + html.droppedBytes + " bytes");
	if (html.droppedBytes > 0) {
		openTags = this.data.slice(-html.droppedBytes);
	} else {
		//No open (truncated) tags at the end
		openTags = null;
	}
	
	//At the end, we replace the data with the filtered one
	this.data = HTMLParser.toRichText(
		html.plainBytes, html.tags, null, null
	);
	//And return the open (truncated) tags
	return openTags;
}

/**
 * Calculates the size in bytes of the Extra Data records following the
 * standard Text Data record.  
 * see discussion of "Trailing Entries" at 
 * http://wiki.mobileread.com/wiki/MOBI#MOBI_Header
 */
MobiRecord.prototype.getExtraDataSize = function() {
	//Mojo.Log.info("getExtraDataSize");

	var getExtraDataEntrySize = function(data, size) {
		var bit = 0, result = 0, b = 0;
		if (size <= 0)
			return result;
		while (true) {
			b = data[size-1];
			result = result | ((b & 0x7F) << bit);
			bit += 7;
			size -= 1;
			if ((b & 0x80) != 0 || (bit >= 28) || (size == 0)) 
				return result;
		}
		return 0;
	}

	var ct = 0
	var flag = this.header.mobi.extraDataFlags >> 1;
	while (flag) {
		if (flag & 1) {
			ct += getExtraDataEntrySize(this.data, this.data.length - ct);
		}
		flag >>= 1;
	}
	if (this.header.mobi.extraDataFlags & 1) {
	    ct += (this.data[this.data.length - ct - 1] & 0x3) + 1;
	}
	//Mojo.Log.info("getExtraDataSize="+ct);
	return ct;
}