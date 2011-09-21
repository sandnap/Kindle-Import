enyo.kind({
	name: "HelpDialog",
	kind: "Popup",
	components: [
		{style: "font-size: 14px; padding: 20px", components: [
			{content: "<b>Kindle Import Help</b></br></br>", style: "font-size: 18px"},
			{content: "<br/>1. Copy the books you wish to import into /media/internal/.palmkindle on your TouchPad or " +
				"use Calibre and send the books to the device, or use the script written by m0ngr31 which can be downloaded " +
				"from http://www.joeipson.com/kindleSide.zip."},
			{content: "<br/>The file name(s) should be in one of the formats:<br/><i>Title - Author.mobi<br/>Title - Author - ASIN.mobi<br/>Title - Author - ASIN - Locations.mobi</i>"},
			{content: "<br/>2. Click on Load Books button to load the books from the .palmkindle folder"},
			{content: "3. Click on Import Books button to import the books into the database<br/><br/>"},
			{content: "You can use the Delete button to remove all books imported by this utility from Kindle.  This does not delete the book files."},
			{content: "<br/>Roadmap: Add support for cover images when sent from Calibre (m0ngr31 script supports this). Add fields to edit the book metadata"},
			{content: "<br/>Click anywhere outside of this dialog to close it"}
		]}
	]
});