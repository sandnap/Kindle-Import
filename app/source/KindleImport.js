enyo.kind ({
	name: "KindleImport",
	kind: enyo.VFlexBox,
	books: [],
	bookAsinsInDB: "",
	importCount: 0,
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
				{content: "2. Create the folder /media/internal/.kindle-import on your touchpad and copy the books you wish to import into it"},
				{content: "3. Click on the button below to import the books not already in the database<br/><br/>"},
				{kind: enyo.Button, name: "fileSelectButton", content: "Import Books", onclick: "loadBooks"},
				{content: "You can use the Delete button below to remove all books imported by this utility from Kindle.  This does not delete the book files."},
				{kind: enyo.Button, name: "deleteBooksButton", content: "Delete All Imported Books From Kindle", onclick: "delBooks"},
				{content: "<br/>* The asin must be unique for each book. If you wish to follow the Kindle book naming conventions you will need to set the asin field to the field published on the" +
				" Amazon page for the book and the filename should be &lt;asin&gt;_EBOK.mobi."},
				{content: "Roadmap: Add support for cover images. Add fields to edit the book metadata, Do something about the hardcoded total locations value (currently 15000 to support large books)."},
				{content: "<br/><b>WARNING:  Use this application at your own risk. The author of this application is not responsible for damage caused or data lost while using this application.</b>"},
			]}
		]},
		{kind: "KindleImportService", name: "kindleImport"},
		{kind: "Popup", name:"dialog"},
		{name:"addBooksEntry", kind: "DbService", dbKind: "com.palm.kindle.books:1", method: "put", onFailure: "dbFailure"},
		{name:"delBooksEntry", kind: "DbService", dbKind: "com.palm.kindle.books:1", method: "del", onFailure: "dbFailure", onSuccess: "deleteSuccess"},
		{name:"findBooksEntry", kind: "DbService", dbKind: "com.palm.kindle.books:1", method: "find", onFailure: "dbFailure", onSuccess: "findResult"}
	],
	loadBooks: function() {
		this.booksInDB();
		this.$.kindleImport.loadBookData(enyo.bind(this, 
			function(titles) {
				var msg = "";
				var d = new Date();
				for (var i = 0; i < titles.length; i++) {
					var asin = "Y" + d.getFullYear() + "M" + d.getMonth() + "D" + d.getDate() +
						"H" + d.getHours() + "S" + d.getSeconds() + "N" + i;
					if (this.bookAsinsInDB.indexOf('"' + asin + '"') > -1)
						continue;
					var parts = titles[i].split(" - ");
					var title = parts[0];
					var author = parts[1].substring(0, parts[1].indexOf(".mobi"));
					var b = new Book();
					b.asin = asin;
					b.title = title;
					b.author = author;
					b.file = titles[i];
					this.importCount++;
					this.books.push(b);
				}
				// for now until the renderBookList function is implemented
				this.importBooks();
			}
		));
	},
	renderBookList: function() {
		// render a list of books in the import directory but not in the database
		// display the filename, asin, title, author, description?, locationsTotal, locationsCompleted
		// and allow all but the filename to be edited
	},
	importBooks: function() {
		// Loop through the books and add them
		for (var i = 0; i < this.books.length; i++)
			this.addBook(this.books[i]);
		
		this.importSuccess();
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
			"locationsTotal": book.locationsTotal,
			"locationsCompleted": book.locationsCompleted,
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
	importSuccess: function() {
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
	locationsTotal: 15000,
	locationsCompleted: 1,
	description: "",
	doImport: true,
	doDelete: false
});