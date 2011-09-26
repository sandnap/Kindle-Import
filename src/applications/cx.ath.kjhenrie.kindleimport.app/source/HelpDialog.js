enyo.kind({
	name: "HelpDialog",
	kind: "Popup",
	components: [
		{style: "font-size: 14px; padding: 20px", components: [
			{content: "<b>Kindle Import Help</b></br></br>", style: "font-size: 18px"},
			{content: "<br/><b><u>Importing Books</u></b>"},
			{content: "1. Copy the books you wish to import into /media/internal/.palmkindle on your TouchPad or " +
				"use Calibre (version 0.8.20 or later includes cover image support) to send the books to the device " +
				"or use the script written by m0ngr31 which can be downloaded from http://www.joeipson.com/kindleSide.zip."},
			{content: "<br/>The file name(s) should be in one of the formats:<br/><i>Title - Author.mobi<br/>Title - Author - ASIN.mobi<br/>Title - Author - ASIN - Locations.mobi</i>"},
			{content: "<br/>2. Tap on the Load Books button to load the books from the .palmkindle folder"},
			{content: "3. (Optional) Deselect books that you do not wish to import"},
			{content: "4. (Optional) If you know the total locations in the book tap the locations value (default 15000) and set the number to the correct value. Tap outside of the text box to store the value."},
			{content: "5. Tap on the Import Books button to import the books into the database"},
			{content: "<br/><b><u>Removing All Imported Books</u></b>"},
			{content: "1. Tap on the Delete All Imported Books from Kindle button. This will only remove the book from the Kindle database.  The book file and cover images will still be in the .palmkindle folder."},
			{content: "<br/><b><u>Removing Selected Imported Books</u></b>"},
			{content: "1. Tap on the Load Existing Books Button"},
			{content: "2. Select the books you wish to delete by tapping the checkbox next to the title"},
			{content: "3. Tap on the Delete Selected Books from Kindle button. This will only remove the book from the Kindle database.  The book file and cover images will still be in the .palmkindle folder."},
			{content: "<br/><b><u>Modifying the Locations on Existing Books</u></b>"},
			{content: "1. Tap on the Load Existing Books Button"},
			{content: "2. Tap the locations value (default 15000) and set the number to the desired value. Tap outside of the text box to store the value."},
			{content: "<br/>Click anywhere outside of this dialog to close it"}
		]}
	]
});