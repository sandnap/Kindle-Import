
/**
 * A PdbRecordInfo stores a record info and a link to the object
 * containing/wrapping the actual data of the record.
 */
function PdbRecordInfo() {
    this.offset=0;
    this.attribute = new Object();
    this.attribute.secret = false;
    this.attribute.inUse = false;
    this.attribute.dirty = false;
    this.attribute.del = false;
    this.uniqueID = 0;
    //This will contain a link to the ByteReader
    this.reader = null;
}

function PdbRecordInfo(byteArray) {
    if (byteArray.length != 8) {
        Mojo.Log.error("A PDB record header needs to have exactly 8 bytes.");
        return;
    }
    // The offset are 4 bytes
    this.offset = concatBytesVar(
        byteArray[0], byteArray[1], byteArray[2], byteArray[3]
    );
    
    //The next byte is a bitmask for the attributes
    this.attribute = new Object();
    this.attribute.secret = (byteArray[4] & 0x10) > 0;
    this.attribute.inUse  = (byteArray[4] & 0x20) > 0;
    this.attribute.dirty  = (byteArray[4] & 0x40) > 0;
    this.attribute.del    = (byteArray[4] & 0x80) > 0;
    //The last 3 bytes are the unique ID
    this.uniqueID = concatBytesVar(
        byteArray[5], byteArray[6], byteArray[7]
    );
    
    this.data = null;
}

PdbRecordInfo.prototype.setReader = function(reader) {
    //Checking if the reader is a valid ByteReader
    if (reader != null) { // && reader instanceof ByteReader) {
        this.reader = reader;
    } else {
        Mojo.Log.error(
            "Invalid/Null ByteReader passed to PdbRecordInfo.setReader()."
        );
        return;
    }
}
