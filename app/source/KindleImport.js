enyo.kind ({
	name: "KindleImport",
	kind: enyo.VFlexBox,
	books: [],
	bookAsinsInDB: "",
	components: [
		{kind: "AppMenu", name: "appMenu", lazy: false, components: [
			{caption: $L("About"), onclick: "showAbout"},
		]},
		{kind: enyo.Header, content: "Kindle Book Import (Sideload)"},
		{kind: "Scroller", flex: 1, components: [
			{style: "font-size: 14px; padding: 20px", components: [
				{content: "<b>You can use this application to import Kindle compatible books into the Kindle application following the steps below. Please read this page before using this application.</b>"},
				{content: "<br/>1. You must grant the cx.ath.kjhenrie.kindleimport application 'create' permission for com.palm.kindle.books:1." +
					" One method for doing this is to create a file named <i>com.palm.kindle</i> with the contents below in the /etc/palm/db/permissions folder on the touchpad." +
					"<br/><br/>[" +
					"<br/>&nbsp;{" +
					"<br/>&nbsp;&nbsp;\"type\": \"db.kind\"," +
					"<br/>&nbsp;&nbsp;\"object\": \"com.palm.kindle.books:1\"," +
					"<br/>&nbsp;&nbsp;\"caller\": \"cx.ath.kjhenrie.kindleimport.*\"," +
					"<br/>&nbsp;&nbsp;\"operations\": {" +
					"<br/>&nbsp;&nbsp;&nbsp;\"create\": \"allow\"," +
					"<br/>&nbsp;&nbsp;&nbsp;\"read\": \"allow\"," +
					"<br/>&nbsp;&nbsp;&nbsp;\"update\": \"allow\"," +
					"<br/>&nbsp;&nbsp;&nbsp;\"delete\": \"allow\"" +
					"<br/>&nbsp;&nbsp;}" +
					"<br/>&nbsp;}" +
					"<br/>]"},
				{content: "<br/>2. Create a text file (e.g. book-import.txt) with a list of the books you wish to import (one per line) in the format:"},
				{content: "<br/>&nbsp;&nbsp;<i>asin|title|author|file</i> (e.g. GGGGGGG|My Book|Doe, John|My Book - Doe, John.mobi)*."},
				{content: "<br/>3. Copy the text file to your Touchpad (root of internal is fine)"},
				{content: "4. Create the folder /media/internal/.kindle-import on your touchpad and copy the books you wish to import into it"},
				{content: "5. Click on the button below, select the import text file and follow the prompts<br/><br/>"},
				{kind: enyo.Button, name: "fileSelectButton", content: "Select metadata File and Import", onclick: "openFilePicker"},
				{content: "You can use the Delete button below to remove all books imported by this utility from Kindle.  This does not delete the book files."},
				{kind: enyo.Button, name: "deleteBooksButton", content: "Delete All Imported Books From Kindle", onclick: "delBooks"},
				{content: "<br/>* The asin must be unique for each book. If you wish to follow the Kindle book naming conventions you will need to set the asin field to the field published on the" +
				" Amazon page for the book and the filename should be &lt;asin&gt;_EBOK.mobi."},
				{content: "Roadmap: Add support for cover images. Read book metadata from the file and eliminate the import file. Do something about the hardcoded total locations value (currently 15000 to support large books)."},
				{content: "<br/><b>WARNING:  Use this application at your own risk. The author of this application is not responsible for damage caused or data lost while using this application.</b>"},
			]}
		]},
		{kind: "KindleImportService", name: "kindleImport"},
		{kind: "FilePicker", name: "filePicker", onPickFile: "metaFilePicked"},
		{kind: "WebService", name: "metaFileService", onSuccess: "parseMetaFile", handleAs: "text"},
		{kind: "Popup", name:"dialog"},
		{name:"addBooksEntry", kind: "DbService", dbKind: "com.palm.kindle.books:1", method: "put", onFailure: "dbFailure", onSuccess: "importSuccess"},
		{name:"delBooksEntry", kind: "DbService", dbKind: "com.palm.kindle.books:1", method: "del", onFailure: "dbFailure", onSuccess: "deleteSuccess"},
		{name:"findBooksEntry", kind: "DbService", dbKind: "com.palm.kindle.books:1", method: "find", onFailure: "dbFailure", onSuccess: "findResult"}
	],
	openFilePicker: function(inSender, inResponse) {
		//this.loadBooks();
		this.booksInDB();
		this.$.filePicker.pickFile();
	},
	metaFilePicked: function(inSender, inResponse) {
		var fileName = enyo.json.stringify(inResponse);
		if (typeof fileName.split(":")[1] == 'undefined') {
			this.$.filePicker.close();
			return;
		}
		var path = fileName.split(":")[1].split("\"")[1];
		this.$.metaFileService.setUrl("file://" + path);
		this.$.metaFileService.call();
	},
	parseMetaFile: function(inSender, inResponse) {
		var bks = inResponse.split("\n");
		for (var i = 0; i < bks.length; i++) {
			var b = bks[i];
			if (b.length > 0) {
				var book = new Book().setup(b);
				if (this.bookAsinsInDB.indexOf('"' + book.asin + '"') < 0)
					this.books.push(book);
			}
		}
		if (this.books.length == 0) {
			this.importSuccess();
		} else {
			for (var j = 0; j < this.books.length; j++) {
				this.addBook(this.books[j]);
			}
		}
	},
	loadBooks: function() {
		this.$.kindleImport.loadBookData(enyo.bind(this, 
			function(books) {
				var msg = "";
				for (var i = 0; i < books.length; i++) {
					//msg += books[i];
					if(books[i].indexOf("86") > -1)
						msg = books[i];
				}
				new File("file:///media/internal/.kindle-import/" + msg, this.createNewMobi.bind(this), this);
			}
		));
	},
	booksInDB: function(asin) {
		var fquery = { "select": ["asin"],
                       "from":"com.palm.kindle.books:1" };
        this.$.findBooksEntry.call({query:fquery});
	},
	findResult: function(inSender, inResponse) {
		this.bookAsinsInDB = enyo.json.stringify(inResponse);
	},
	delBooks: function() {
		var q = { "from":"com.palm.kindle.books:1", "where":[{"prop":"guid","op":"=","val":":A6CD34B2"}] };   
        this.$.delBooksEntry.call({query:q});
	},
	addBook: function(book) {
	    var param = {
			"_kind": "com.palm.kindle.books:1",
			"asin": book.asin,
			"author": book.author,
			"authorIndex": book.author,
			"bookFilePath": "/media/internal/.kindle-import/" + book.file,
			"coverImagePath": "",
			"guid": ":A6CD34B2",
			"isDeleted": "0",
			"locationsTotal": "15000",
			"locationsCompleted": "1",
			"nearestLocation": "0",
			"numMarkups": "0",
			"title": book.title,
			"titleIndex": book.title,
			"type": "EBOK",
			"isArchived": "false",
			"downloadProgress": 100,
			"lastAccessed": new Date().getTime(),
			"numMarkups": 0
		};
		var objs = [param];
		this.$.addBooksEntry.call({objects: objs});
	}, 
	importSuccess: function(inSender, inResponse) {
		this.openDialog(this.books.length + " were successfully imported", true);
		
		setTimeout(enyo.bind(this, function() {
			this.books = [];
			this.bookAsinsInDB = [];
		}), 3000);
		
	},
	deleteSuccess: function(inSender, inResponse) {
		this.openDialog("Imported books were removed from Kindle", true);
	},
	dbFailure: function(inSender, inResponse) {
		this.openDialog("Operation failed", true);
	},
	createNewDoc: function(file, doc) {
		if (!file.ready) {
			this.openDialog("Could not load file: " + file.getBasename());
			return;
		}
		new DocReader(file, this.createNewPPrs.bind(this));
	},
	createNewPPrs: function(file, doc) {
		if (doc == null) {
			new PPrsReader(file, this.createNewMobi.bind(this), null);
			return;
		}
		this.openDialog("It's a Doc");
	},
	createNewMobi: function(file, doc) {
		//if (doc == null) {
			new MobiReader(file, this.handleNewMobi.bind(this), null);
			//return;
		//}
		//this.openDialog("It's a PPrs");
	},
	handleNewMobi: function(file, doc) {
		//A mobi file should have a full name
		var name = doc.header.mobi.fullName;
		if (name == null || name.length <= 0) {
			name = doc.pdb.name;	
		} else {
			//We must replace HTML escape sequences
			name = HTMLParser.translateEscapes(name);
		}
		
		/*var msg = "";
		for (var i = 0; i < doc.attribute.length; i++)
			msg += doc.attribute[i];
			
		this.openDialog(msg);*/
		
		
		this.openDialog(doc.header.mobi.fullName + // Aspho Fields
						" " + doc.header.attribute.recordCount + // 178
						" " + doc.header.attribute.recordSize + // 4096
						" " + doc.pdb.name + // Aspho_Fields
						" " + doc.header.exth.coverImage + //<center><img label="00002"/></center>
						" " + doc.pdb.appInfoId + //0
						" " + doc.pdb.numRecords + //187
						" " + doc.pdb.sortInfoID // 0
						);
		
		
		/*
			in doc.header.attribute
			******************
		 	compression: 0,
	        textLength: 0,
	        *recordCount: 0,
	        *recordSize: 0,
	        *currReadingPos: 0
		    *this.name="";
			this.version = 0;
			
			in doc.header.mobi
			**************************
			headerLen: 0,
			firstNonBookRecord: 0,
			*fullName: null,
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
			
			in doc.header.exth
			********************
			id: "",
			headerLen: 0,			
			recordCount: 0,
			*coverImage: ""
			
			in doc
			*******************
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
			*this.appInfoId = 0;
			*this.sortInfoID = 0;
			this.type = "NONE";
			this.creator = "DEFD";
			this.uniqueIDseed = 0;
			this.nextRecordListID = 0;
			
			*this.numRecords = 0;
		*/
	},
	showAbout: function(inSender, inResponse) {
		this.openDialog("Kindle Import - Use at your own risk!");
	},
	openDialog: function(msg, autoClose) {
		this.$.dialog.setContent(msg);
		this.$.dialog.openAtCenter();
		if (typeof autoClose !== 'undefined' && autoClose === true) {
			setTimeout(enyo.bind(this, function(){
				this.$.dialog.close();
			}), 2000);
		}
	}
});

enyo.kind({
	name: "Book",
	asin: "",
	title: "",
	author: "",
	file: "",
	setup: function(bookString) {
		var bookArray = bookString.split("|");
		this.asin = bookArray[0];
		this.title = bookArray[1];
		this.author = bookArray[2];
		this.file = bookArray[3];
		
		return this;
	}
});