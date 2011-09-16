enyo.kind ({
	name: "KindleImport",
	kind: enyo.VFlexBox,
	books: [],
	bookTitlesInDB: "",
	importCount: 0,
	components: [
		{kind: "AppMenu", name: "appMenu", lazy: false, components: [
			{caption: $L("Help"), onclick: "showHelp"},
			{caption: $L("About"), onclick: "showAbout"},
		]},
		{kind: enyo.Header, content: "Kindle Book Import (Sideload)"},
		{kind: "Scroller", flex: 1, components: [
			{style: "font-size: 14px; padding: 20px", components: [
				{content: "<b>You can use this application to import Kindle compatible books into the Kindle application. Please read this page and the Help documentation (in the menu) before using this application.</b>"},
				//{kind: "ImportList", name: "importList"},
				{kind: "VirtualRepeater", name: "importList",
					onSetupRow: "setupRow", components: [
						{kind: "Item", layoutKind: "HFlexLayout", components: [
							{name: "fileName", flex: 1},
							{name: "asin"},
							{name: "title"},
							{name: "author"},
							{name: "locations"},
						]}
					]
				},
				{kind: enyo.Button, name: "loadBooksButton", content: "Load Books", onclick: "loadBooks"},
				{kind: enyo.Button, name: "importbooksButton", content: "Import Books", onclick: "importBooks"},
				{kind: enyo.Button, name: "deleteBooksButton", content: "Delete All Imported Books From Kindle", onclick: "delBooks"},
				{content: "<br/>* The asin and title must be unique for each book."},
				{content: "Roadmap: Add support for cover images. Add fields to edit the book metadata, Do something about the hardcoded total locations value (currently 15000 to support large books)."},
				{content: "<br/><b>WARNING:  Use this application at your own risk. The author of this application is not responsible for damage caused or data lost while using this application.</b>"},
			]}
		]},
		{kind: "KindleImportService", name: "kindleImport", flex: 1},
		{kind: "Popup", name:"dialog"},
		{kind: "HelpDialog", name:"help"},
		{name:"addBooksEntry", kind: "DbService", dbKind: "com.palm.kindle.books:1", method: "put", onFailure: "dbFailure"},
		{name:"delBooksEntry", kind: "DbService", dbKind: "com.palm.kindle.books:1", method: "del", onFailure: "dbFailure", onSuccess: "deleteSuccess"},
		{name:"findBooksEntry", kind: "DbService", dbKind: "com.palm.kindle.books:1", method: "find", onFailure: "dbFailure", onSuccess: "findResult"}
	],
	setupRow: function(inSender, inIndex) {
		var row = this.books[inIndex];
		if (row) {
			var space = "          ";
			var title = row.title;
			if (row.title.length > 20)
				title = title.substring(0, 20) + "...";
			var file = row.file;
			if (row.file.length > 30)
				file = file.substring(0, 30) + "... .mobi";
			this.$.fileName.setContent(file + space);
			this.$.asin.setContent(row.asin + space);
			this.$.title.setContent(title + space);
			this.$.author.setContent(row.author + space);
			this.$.locations.setContent(row.locationsTotal);
			return true;
		}
	},
	loadBooks: function() {
		//this.booksInDB();
		this.$.kindleImport.loadBookData(enyo.bind(this, 
			function(titles) {
				var msg = "";
				var d = new Date();
				for (var i = 0; i < titles.length; i++) {
					var asin = "Y" + d.getFullYear() + "M" + d.getMonth() + "D" + d.getDate() +
						"H" + d.getHours() + "S" + d.getSeconds() + "N" + i;
					var parts = titles[i].split(" - ");
					var title = parts[0];
					if (this.bookTitlesInDB.indexOf('"' + title + '"') > -1)
						continue;
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
				//this.importBooks();
				this.renderBookList();
			}
		));
	},
	renderBookList: function() {
		// render a list of books in the import directory but not in the database
		// display the filename, asin, title, author, description?, locationsTotal, locationsCompleted
		// and allow all but the filename to be edited
		this.$.importList.render();//load(this.books);
	},
	importBooks: function() {
		// Loop through the books and add them
		for (var i = 0; i < this.books.length; i++)
			this.addBook(this.books[i]);
		
		this.importSuccess();
	},
	booksInDB: function(title) {
		var fquery = { "select": ["title"],
                       "from":"com.palm.kindle.books:1" };
        this.$.findBooksEntry.call({query:fquery});
	},
	findResult: function(inSender, inResponse) {
		this.bookTitlesInDB = enyo.json.stringify(inResponse);
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
			"bookFilePath": "/media/internal/.palmkindle/" + book.file,
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
	showHelp: function(inSender, inResponse) {
		this.$.help.openAtCenter();
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