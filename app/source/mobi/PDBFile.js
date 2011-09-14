
/**
 * The header format of a PDB file is as follows:
 * .--------------------------------------------------------------------------.
 * | # | B |          Content          |               Comments               |
 * |---+---+---------------------------+--------------------------------------|
 * | 0 | 32| name                      | Null Terminated String               |
 * | 1 |  2| attributes field          | R/O, Dirty, Bak, OvrW, Reset, NoBeam |
 * | 2 |  2| file version              | file version                         |
 * | 3 |  4| creation date             | Seconds since January 1, 1904        |
 * | 4 |  4| modification date         | Seconds since January 1, 1904        |
 * | 5 |  4| last backup date          | Seconds since January 1, 1904        |
 * | 6 |  4| modification number       |                                      |
 * | 7 |  4| appInfoID                 | offset to start of AppInfo or null   |
 * | 8 |  4| sortInfoID                | offset to Sort Info or null          |
 * | 9 |  4| type                      | See http://tinyurl.com/yzx5574       |
 * |10 |  4| creator                   | See http://tinyurl.com/yzx5574       |
 * |11 |  4| uniqueIDseed              | internal identifier                  |
 * |12 |  4| nextRecordListID          | Only used in-memory of PalmOS        |
 * |13 |  2| number of Records         | num of Records in File --> N         |
 * |   | 8N| record Info List          |                                      |
 * |---|---+-- start of record info ---+--------------------------------------|
 * |14 |  4| record Data offset        | offset from the start to this record |
 * |15 |  1| record Attributes         | bit field: Secret, inUse, Dirty, Del |
 * |16 |  3| UniqueID                  | The unique ID for this record        |
 * |---|---+--  end of record info  ---+--------------------------------------|
 * '--------------------------------------------------------------------------'
*/
function PDBFile(reader) {
    //Loading defaults
    this.loadDefaults();
    //Checking if reader is a ByteReader
    if (reader) {//&& reader instanceof ByteReader) {
        //Parsing
        this.reader = reader;
        this.parsePDB();
    } else {
        this.reader = null;
    }
}

PDBFile.prototype.loadDefaults = function () {
    this.name="";
    this.version = 0;
    
    this.attribute = new Object();
    this.attribute.ro = false;
    this.attribute.dirty = false;
    this.attribute.backup = false;
    this.attribute.overwrite = false;
    this.attribute.reset = false;
    this.attribute.noBeam = false;
    
    this.creationDate = 0;
    this.modificationDate = 0;
    this.backupDate = 0;
    this.modificationNum = 0;
    this.appInfoId = 0;
    this.sortInfoID = 0;
    this.type = "NONE";
    this.creator = "DEFD";
    this.uniqueIDseed = 0;
    this.nextRecordListID = 0;
    
    this.numRecords = 0;
    this.records = new Array();
}

PDBFile.prototype.loadRecordBytes = function(num, maxBytes) {
	if (num < 0 || num >= this.records.length) {
		return null;
	}
	if (typeof(maxBytes) == "undefined" || maxBytes == null) {
		maxBytes = Number.POSITIVE_INFINITY;
	}
	var startOffset = this.records[num].offset;
    var endOffset = (num+1 < this.records.length)
		? Math.min(startOffset + maxBytes, this.records[num+1].offset)
		: Number.POSITIVE_INFINITY;
		
    return this.reader.read(startOffset, endOffset - startOffset);
}

PDBFile.prototype.getOffsetForRecord = function(num) {
	if (num < 0 || num >= this.records.length) {
		return null;
	}
	return this.records[num].offset;
}

/**
 * This method parses the underlying ByteRader and assembles the pdbFile object.
 * At the moment, it can only fully read PDB-docs, though.
 * On top of that, it is rather slow. But Javascript was never designed to be
 * good at reading binary data formats in any case...
 */
PDBFile.prototype.parsePDB = function () {
    var bufferSize = 1024;
    //The array that holds our byte sequences
    var bytes = new Array();
    //A temporary byte buffer
    var byteBuf = new Array();
    //The state of the header parser, signifies just what we're parsing
    var state = 0;
    
    //Starting at byte 0
    var bytePos = 0;
    var globalBytePos = 0;
    var nextBufStart = 0;
    var currRecord = 0;
    var onLastByteBlock = false;
    var eotSym = 0xFFFFFFFF;
    var allParsed = false;
	var encoding = 1;
    
    while (allParsed == false) {
        //Reading a byte from the stram
        currByte = this.reader.read(bytePos);
        
        //Checking if we should signify EOT or take the first byte
        currByte = (currByte == null) ? null : currByte[0];
        
        //The state dictates what we do
        switch(state) {
            case 0: // parsing the name of the header
                //The name may only have 32 bytes
                if (bytePos >= 32) {
                    enyo.error("Malformed PDB Name. Not a PDB?");
                    return;
                }
                //Checking if we've reached the terminating null
                if (currByte == 0) {
                    //Reached it; converting from CP-125x to UTF-8
					var utf;
					switch (encoding) {
						default: case 1: case 2: case 5: case 7:
							//Using CP-1252
							utf = Encoding.decodeBytes(byteBuf, 5);
							break;
						case 3: case 4: case 6:
							//Using the CP-125x encoding
							utf = Encoding.decodeBytes(byteBuf, globalOptions.encoding);
							break;
					}
					this.name = bytesToString(utf.data);
					// the next byte is 32 and we switch state
                    bytePos = 31;
                    globalBytePos = 31;
                    state += 1;
					//Clearing the buffer
					byteBuf.length = 0;
                    break;
                }
                //Otherwise, we append that char
                //this.name += String.fromCharCode(currByte);
				byteBuf.push(currByte);
                break;
            case 1: // attributes
                //We need to gobble exactly 2 bytes
                if (byteBuf.length != 2) byteBuf[byteBuf.length] = currByte;
                //Checking if we still need more bytes
                if (byteBuf.length != 2) break;
                //We have enough bytes
                mask = concatBytes(byteBuf);
                this.attribute.RO         = (mask & 0x0002) > 0;
                this.attribute.dirty      = (mask & 0x0004) > 0;
                this.attribute.backup     = (mask & 0x0008) > 0;
                this.attribute.overwrite  = (mask & 0x0010) > 0;
                this.attribute.reset      = (mask & 0x0020) > 0;
                this.attribute.noBeam     = (mask & 0x0040) > 0;
                //On to the next state and resetting byteBuf
                state += 1;
                byteBuf.length = 0;
                break;
            case 2: // file version
                //We need to gobble exactly 2 bytes
                if (byteBuf.length != 2) byteBuf[byteBuf.length] = currByte;
                //Checking if we still need more bytes
                if (byteBuf.length != 2) break;
                //We have enough bytes
                this.version = concatBytes(byteBuf);
                //On to the next state and resetting byteBuf
                state += 1;
                byteBuf.length = 0;
                break;
            case 3: // Creation date
            case 4: // Modification date
            case 5: // Backup date
            case 6: // modNumber
            case 7: // appInfo ID
            case 8: // sortInfo ID
            case 9: // type ID
            case 10: // creator ID
            case 11: // uniqueIDseed
            case 12: // nextRecordListID
                //We need to gobble exactly 4 bytes
                if (byteBuf.length != 4) byteBuf[byteBuf.length] = currByte;
                //Checking if we still need more bytes
                if (byteBuf.length != 4) break;
                //We have enough bytes
                //Selecting which field to set and which state to change to
                switch (state) {
                    case 3:
                        this.creationDate = concatBytes(byteBuf);
                        break;
                    case 4:
                        this.modificationDate = concatBytes(byteBuf);
                        break;
                    case 5:
                        this.backupDate = concatBytes(byteBuf);
                        break;
                    case 6:
                        this.modificationNum = concatBytes(byteBuf);
                        break;
                    case 7:
                        this.appInfoId = concatBytes(byteBuf);
                        break;
                    case 8:
                        this.sortInfoID = concatBytes(byteBuf);
                        break;
                    case 9:
                        this.type = "";
                        for (var i = 0; i < byteBuf.length; i += 1) {
                            this.type += String.fromCharCode(byteBuf[i]);
                        }
                        break;
                    case 10:
                        this.creator = "";
                        for (var i = 0; i < byteBuf.length; i += 1) {
                            this.creator += String.fromCharCode(byteBuf[i]);
                        }
                        break;
                    case 11:
                        this.uniqueIDseed = concatBytes(byteBuf);
                        break;
                    case 12:
                        this.nextRecordListID = concatBytes(byteBuf);
                        break;
                    default:
                        enyo.error("Invalid state on parsing PDB Header");
                        return;
                }
                //On to the next state and resetting byteBuf
                state += 1;
                byteBuf.length = 0;
                break;
            case 13: //Number of records
                //We need to gobble exactly 2 bytes
                if (byteBuf.length != 2) byteBuf[byteBuf.length] = currByte;
                //Checking if we still need more bytes
                if (byteBuf.length != 2) break;
                //We have enough bytes
                this.numRecords = concatBytes(byteBuf);
                //On to the next state (if records) or the state after the next
                if (this.numRecords > 0) {
                    state += 1; //There are records
                } else {
                    state += 2; //There are no records
                }
                //In any case, we reset the byte buffer
                byteBuf.length = 0;
                break;
            case 14: //Record information
                //Checking if we've read all 8 bytes of a recInfo field
                if (byteBuf.length != 8) byteBuf[byteBuf.length] = currByte;
                //Checking if we still need more bytes
                if (byteBuf.length != 8) break;
                //Creating the new record
                this.records[currRecord] = new PdbRecordInfo(byteBuf);
                //We parsed one recInfo
                currRecord += 1;
                //Checking if we should move on to the next state
                if (currRecord >= this.numRecords) {
                    //Moving on to the next state
                    state += 1;
                    //We will need the currRecord counter again, so we reset it
                    currRecord = 0;
                }
                //Purging the byte buffer
                byteBuf.length = 0;
                break;
            case 15: //Checking if we can correctly interpret the records
            	state += 1;
				/*
				if (DocRecord.isValidID(this.type, this.creator)) {
                    //It's a palm doc, we can read that
                    state += 1;
                } else {
                    //The format is not supported, aborting
                    this.records = null;
                    allParsed = true;
                    break;
                }
                */
                //No break here, because we must process the byte!
            case 16: // The actual records
                /* The records themselves are not parsed. The record info containers
                 * simply get a link back to the reader and can extract their
                 * bytes on their own.
                 */
                for (var i = 0; i < this.records.length; i++) {
                    this.records[i].setReader(this.reader);
                }
                //Aborting the parse
                allParsed = true;
                break;
            default:
                //This is an error
                enyo.error("Invalid parsing state reached.");
                return;
        }
        //Moving to the next byte
        bytePos += 1;
        globalBytePos += 1;
    }
}
