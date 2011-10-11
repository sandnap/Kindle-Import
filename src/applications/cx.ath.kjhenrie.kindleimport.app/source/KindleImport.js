enyo.kind ({
	name: "KindleImport",
	kind: enyo.VFlexBox,
	books: [],
	covers: [],
	bookTitlesInDB: "",
	importCount: 0,
	importMode: false,
	updateMode: false,
	components: [
		{kind: "AppMenu", name: "appMenu", lazy: false, components: [
			{caption: $L("Help"), onclick: "showHelp"},
			{caption: $L("About"), onclick: "showAbout"},
		]},
		{kind: enyo.Header, content: "Kindle Book Import (Sideload)"},
		{kind: "Scroller", name: "scroller", flex: 1, components: [
			{style: "font-size: 14px; padding: 20px", components: [
				{content: "<b>You can use this application to import Kindle compatible books into the Kindle application. Please read this page and the Help documentation (in the menu) before using this application."},
				{kind: enyo.Button, name: "loadBooksButton", style: "margin-top: 20px;", content: "Load New Books", onclick: "loadBooks"},
				{kind: enyo.Button, name: "importbooksButton", disabled: true, content: "Import Books", onclick: "importBooks"},
				{kind: enyo.Button, name: "loadExistingBooksButton", style: "margin-top: 20px;", content: "Load Existing Books", onclick: "loadExistingBooks"},
				{kind: enyo.Button, name: "deleteSelectedBooksButton", disabled: true, content: "Delete Selected Books From Kindle", onclick: "confirmSelectDelete"},
				{kind: enyo.Button, name: "deleteBooksButton", content: "Delete All Imported Books From Kindle", onclick: "confirmDelete"},
				{kind: "VirtualRepeater", style: "margin-top: 20px;", name: "importList",
					onSetupRow: "setupRow", components: [
						{kind: "Item", name: "newBook", layoutKind: "HFlexLayout", components: [
							{name: "importCB", kind: "CheckBox", checked: true, style: "width: 15%", onclick: "unselectBook"},
							{name: "title", style: "width: 25%"},
							{name: "asin",  style: "width: 20%"},
							{name: "author",  style: "width: 25%"},
							{name: "locations", kind: "Input",  style: "width: 15%", onchange: "updateLocation"},
						]}
					]
				},
				{kind: "VirtualRepeater", style: "margin-top: 20px;", name: "existingList",
					onSetupRow: "setupExistingRow", components: [
						{kind: "Item", name: "existingBook", layoutKind: "HFlexLayout", components: [
							{name: "deleteCB", kind: "CheckBox", checked: false, style: "width: 15%", onclick: "selectExistingBook"},
							{name: "eTitle", style: "width: 25%"},
							{name: "eAsin",  style: "width: 20%"},
							{name: "eAuthor",  style: "width: 25%"},
							{name: "eLocations", kind: "Input",  style: "width: 15%", onchange: "updateExistingLocation"},
						]}
					]
				},
				{content: "<br/>* The asin and title must be unique for each book."},
				{content: "<br/><b>WARNING:  Use this application at your own risk. The author of this application is not responsible for damage caused or data lost while using this application.</b>"},
			]}
		]},
		{kind: "KindleImportService", name: "kindleImport", flex: 1},
		{kind: "Popup", name:"dialog"},
		{kind: "ModalDialog", name: "screen", content: "Operation in progress..."},
		{kind: "HelpDialog", name:"help"},
		{kind: "ModalDialog", name: "confirmDelete", components: [
			{content: "Are you sure you want to remove all imported books from Kindle?"},
			{kind: enyo.Button, name: "confirmDeleteButton", content: "Yes", onclick: "delBooks"},
			{kind: enyo.Button, name: "cancelDeleteButton", content: "No", onclick: "closeConfirmDelete"}
		]},
		{kind: "ModalDialog", name: "confirmSelectDelete", components: [
			{content: "Are you sure you want to remove the selected books from Kindle?"},
			{kind: enyo.Button, name: "confirmDeleteButton", content: "Yes", onclick: "delSelectBooks"},
			{kind: enyo.Button, name: "cancelDeleteButton", content: "No", onclick: "closeConfirmSelectDelete"}
		]},
		{name:"addBooksEntry", kind: "DbService", dbKind: "com.palm.kindle.books:1", method: "put", onFailure: "dbFailure"},
		{name:"mergeBooksEntry", kind: "DbService", dbKind: "com.palm.kindle.books:1", method: "merge", onFailure: "dbFailure"},
		{name:"delBooksEntry", kind: "DbService", dbKind: "com.palm.kindle.books:1", method: "del", onFailure: "dbFailure", onSuccess: "deleteSuccess"},
		{name:"delSelectBooksEntry", kind: "DbService", dbKind: "com.palm.kindle.books:1", method: "del", onFailure: "dbFailure"},
		{name:"findBooksEntry", kind: "DbService", dbKind: "com.palm.kindle.books:1", method: "find", onFailure: "dbFailure", onSuccess: "findResult"},
		{name:"findExistingBooksEntry", kind: "DbService", dbKind: "com.palm.kindle.books:1", method: "find", onFailure: "dbFailure", onSuccess: "findExistingResult"}
	],
	/********************************************************
	 *********** BEGIN RENDER IMPORT LIST FUNCTIONS *********
	 *********************************************************/
	loadBooks: function() {
		this.log("Enter loadBooks");
		this.showScreen();
		this.resetPage();
		this.importMode = true;
		this.updateMode = false;
		this.bookTitlesInDB = "";
		this.booksInDB();
	},
	booksInDB: function() {
		this.log("Enter booksInDB");
		var fquery = { "select": ["title"],
                       "from":"com.palm.kindle.books:1" };
        this.$.findBooksEntry.call({query:fquery});
	},
	findResult: function(inSender, inResponse) {
		this.log("Enter findResult (booksInDB)");
		this.bookTitlesInDB = enyo.json.stringify(inResponse);
		this.log("Book Title String: " + this.bookTitlesInDB);
		this.loadCoverData();
	},
	// LOAD THE COVER FILENAMES FROM THE coverCache DIRECTORY
	loadCoverData: function() {
		this.log("Enter loadCoverData");
		this.covers = [];
		this.$.kindleImport.loadCoverData(enyo.bind(this, 
			function(coverTitles) {
				this.log("Total covers found: " + coverTitles.length);
				for (var i = 0; i < coverTitles.length; i++) {
					this.log("Adding Cover: " + coverTitles[i]);
					this.covers.push(coverTitles[i]);
				}
				this.loadBookData();
			}
		))
	},
	// LOAD THE BOOKS FROM THE .palmkindle FOLDER AND RENDER THE IMPORT LIST
	loadBookData: function() {
		this.log("Enter loadBookData");
		this.$.kindleImport.loadBookData(enyo.bind(this, 
			function(titles) {
				this.log("Total Books Found: " + titles.length);
				var msg = "";
				var d = new Date();
				for (var i = 0; i < titles.length; i++) {
					// This book is not named appropriately for the import
					if (titles[i].indexOf(" - ") < 0)
						continue;
					
					var asin = "Y" + d.getFullYear() + "M" + d.getMonth() + "D" + d.getDate() +
						"H" + d.getHours() + "S" + d.getSeconds() + "N" + i;
					var parts = titles[i].split(" - ");
					var title = parts[0];
					if (this.bookTitlesInDB.indexOf('"' + title + '"') > -1)
						continue;
					var author = parts[1];
					var locationsTotal = 15000;
					if (parts.length == 2) {
						author = author.substring(0, parts[1].indexOf(".mobi"));
					} else if (parts.length == 3) {
						asin = parts[2].substring(0, parts[2].indexOf(".mobi"));
					} else if (parts.length == 4) {
						asin = parts[2];
						locationsTotal = parts[3].substring(0, parts[3].indexOf(".mobi"));
					}
					var b = new Book();
					b.asin = asin;
					b.title = title;
					b.author = author;
					b.file = titles[i];
					b.locationsTotal = locationsTotal;
					// Tell the book if we have a cover
					for (var j = 0; j < this.covers.length; j++) {
						if (this.covers[j].indexOf(title) > -1 && this.covers[j].indexOf(author) > -1)
							b.hasCover = true;
					}
					this.log("Adding Book: " + b.title);
					this.books.push(b);
				}
				if (this.books.length == 0)
					this.openDialog("There are no new books to import", true);
				else
					this.renderImportList();
					
				this.setImportButtonMode();
					
				this.hideScreen();
			}
		));
	},
	renderImportList: function() {
		this.log("Enter renderImportList");
		this.$.importList.render();
		this.$.scroller.scrollTo(0, 0);
	},
	setupRow: function(inSender, inIndex) {
		var row = this.books[inIndex];
		if (row) {
			this.log("Enter setUpRow for book: " + row.title);
			var title = row.title;
			if (row.title.length > 30)
				title = title.substring(0, 29) + "...";
			var author = row.author;
			if (row.author.length > 30)
				author = author.substring(0, 29) + "...";
			this.$.title.setContent(title);
			this.$.asin.setContent(row.asin);
			this.$.author.setContent(author);
			this.$.locations.setValue(row.locationsTotal);
			return true;
		}
	},
	/*********************************************************
	 *********** END RENDER IMPORT LIST FUNCTIONS ************
	 *********** BEGIN MODIFY IMPORT BOOKS FUNCTIONS *********
	 *********************************************************/
	updateLocation: function(inSender, inIndex) {
		this.books[inIndex.rowIndex].locationsTotal = this.$.locations.getValue();
	},
	unselectBook: function(inSender, inIndex) {
		if (this.$.importCB.checked == true)
			this.books[inIndex.rowIndex].doImport = true;
		else
			this.books[inIndex.rowIndex].doImport = false;
	},
	/*********************************************************
	 *********** END MODIFY IMPORT BOOKS FUNCTIONS ***********
	 ************** BEGIN BOOK IMPORT FUNCTIONS **************
	 *********************************************************/
	importBooks: function() {
		this.showScreen();
		// Loop through the books and add them
		for (var i = 0; i < this.books.length; i++) {
			if (this.books[i].doImport == true) {
				this.addBook(this.books[i]);
				this.importCount++;
			}
		}
		this.importSuccess();
		this.hideScreen();
	},
	addBook: function(book) {
	    var param = {
			"_kind": "com.palm.kindle.books:1",
			"asin": book.asin,
			"author": book.author,
			"authorIndex": book.author,
			"bookFilePath": "/media/internal/.palmkindle/" + book.file,
			"coverImagePath": book.getImage(),
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
		this.openDialog(this.importCount + " were successfully imported", true);
		
		setTimeout(enyo.bind(this, function() {
			this.resetPage();
		}), 2000);
	},
	/*********************************************************
	 *************** END BOOK IMPORT FUNCTIONS ***************
	 ******** BEGIN LOAD EXISTING BOOKS & RENDER LIST ********
	 *********************************************************/
	loadExistingBooks: function() {
		this.showScreen();
		this.resetPage();
		this.importMode = false;
		this.updateMode = true;
		this.loadBooksFromDB();
	},
	loadBooksFromDB: function(title) {
		var fquery = { "select": ["title", "asin", "author", "locationsTotal"],
                       "from":"com.palm.kindle.books:1", "where":[{"prop":"guid","op":"=","val":":A6CD34B2"}] };
        this.$.findExistingBooksEntry.call({query:fquery});
	},
	findExistingResult: function(inSender, inResponse) {
		this.books = [];
		for (var i = 0; i < inResponse.results.length; i++) {
			var b = new Book();
			b.asin = inResponse.results[i].asin;
			b.title = inResponse.results[i].title;
			b.author = inResponse.results[i].author;
			b.locationsTotal = inResponse.results[i].locationsTotal;
			this.books.push(b);
		}
		this.$.existingList.render();
		this.hideScreen();
		this.setDeleteButtonMode();
		this.$.scroller.scrollTo(0, 0);
	},
	setupExistingRow: function(inSender, inIndex) {
		var row = this.books[inIndex];
		if (row) {
			var title = row.title;
			if (row.title.length > 30)
				title = title.substring(0, 29) + "...";
			var author = row.author;
			if (row.author.length > 30)
				author = author.substring(0, 29) + "...";
			this.$.eTitle.setContent(title);
			this.$.eAsin.setContent(row.asin);
			this.$.eAuthor.setContent(author);
			this.$.eLocations.setValue(row.locationsTotal);
			return true;
		}
	},
	/*********************************************************
	 ******* END LOAD EXISTING BOOKS & RENDER LIST ***********
	 *********** BEGIN MODIFY EXIST BOOK FUNCTIONS ***********
	 *********************************************************/
	updateExistingLocation: function(inSender, inIndex) {
		var props = {"locationsTotal":this.$.eLocations.getValue()};
		var q = { "from":"com.palm.kindle.books:1", "where":[{"prop":"asin","op":"=","val":this.books[inIndex.rowIndex].asin}] };   
		this.$.mergeBooksEntry.call({query:q, "props":props});
	},
	selectExistingBook: function(inSender, inIndex) {
		if (this.$.deleteCB.checked == true)
			this.books[inIndex.rowIndex].doDelete = true;
		else
			this.books[inIndex.rowIndex].doDelete = false;
	},
	delSelectBooks: function() {
		this.closeConfirmSelectDelete();
		var t = 0;
		this.showScreen();
		for (var i = 0; i < this.books.length; i++) {
			if (this.books[i].doDelete == true) {
				var q = { "from":"com.palm.kindle.books:1", "where":[{"prop":"asin","op":"=","val":this.books[i].asin}] };   
				this.$.delSelectBooksEntry.call({query:q});
				t++;
			}
		}
		this.resetPage();
		this.hideScreen();
		this.openDialog(t + " books deleted", true);
	},
	confirmSelectDelete: function() {
		this.$.confirmSelectDelete.openAtCenter();
	},
	closeConfirmSelectDelete: function() {
		this.$.confirmSelectDelete.close();
	},
	/*********************************************************
	 ************ END MODIFY EXIST BOOK FUNCTIONS ************
	 ************ BEGIN DELETE ALL BOOKS FUNCTIONS ***********
	 *********************************************************/
	confirmDelete: function() {
		this.$.confirmDelete.openAtCenter();
	},
	closeConfirmDelete: function() {
		this.$.confirmDelete.close();
	},
	delBooks: function() {
		this.closeConfirmDelete();
		this.showScreen();
		var q = { "from":"com.palm.kindle.books:1", "where":[{"prop":"guid","op":"=","val":":A6CD34B2"}] };   
        this.$.delBooksEntry.call({query:q});
		this.hideScreen();
	}, 
	deleteSuccess: function(inSender, inResponse) {
		this.openDialog("Imported books were removed from Kindle", true);
		this.resetPage();
	},
	/*********************************************************
	 ************* END DELETE ALL BOOKS FUNCTIONS ************
	 **************** BEGIN SUPPORT FUNCTIONS ******&&&&&*****
	 *********************************************************/
	dbFailure: function(inSender, inResponse) {
		this.openDialog("Operation failed", true);
	},
	setImportButtonMode: function(noLoop) {
		this.$.importbooksButton.setDisabled(true);
		if (this.importMode == true && this.books.length > 0)
			this.$.importbooksButton.setDisabled(false);
		if (noLoop != true)
			this.setDeleteButtonMode(true);
	},
	setDeleteButtonMode: function(noLoop) {
		this.$.deleteSelectedBooksButton.setDisabled(true);
		if (this.updateMode == true && this.books.length > 0)
			this.$.deleteSelectedBooksButton.setDisabled(false);
		if (noLoop != true)
			this.setImportButtonMode(true);
	},
	resetPage: function() {
		this.books = [];
		this.$.importList.render();
		this.$.existingList.render();
		this.importMode = false;
		this.updateMode = false;
		this.covers = [];
		this.bookTitlesInDB = "";
		this.importCount = 0;
		this.setDeleteButtonMode();
		this.setImportButtonMode();
		this.$.scroller.scrollTo(0, 0);
	},
	showHelp: function(inSender, inResponse) {
		this.$.help.openAtCenter();
	},
	showAbout: function(inSender, inResponse) {
		this.openDialog("Kindle Import - v1.3.1");
	},
	openDialog: function(msg, autoClose) {
		this.$.dialog.setContent(msg);
		this.$.dialog.openAtCenter();
		if (typeof autoClose !== 'undefined' && autoClose === true) {
			setTimeout(enyo.bind(this, function(){
				this.$.dialog.close();
			}), 2000);
		}
	},
	showScreen: function() {
		this.$.screen.openAtCenter();
	},
	hideScreen: function() {
		this.$.screen.close();
	},
	log: function(message) {
		enyo.log(message);
	}
});

enyo.kind({
	name: "Book",
	asin: "",
	title: "",
	author: "",
	file: "",
	hasCover: false,
	locationsTotal: 15000,
	locationsCompleted: 1,
	description: "",
	doImport: true,
	doDelete: false,
	getImage: function() {
		if (this.hasCover)
			return "/media/internal/.palmkindle/coverCache/" + this.file.substring(0, this.file.indexOf(".mobi")) + ".jpg";
		else
			return "/media/cryptofs/apps/usr/palm/applications/cx.ath.kjhenrie.kindleimport.app/images/item-cover-default.png";
	}
});