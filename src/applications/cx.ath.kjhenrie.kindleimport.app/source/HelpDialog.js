enyo.kind({
	name: "HelpDialog",
	kind: "Popup",
	components: [
		{style: "font-size: 14px; padding: 20px", components: [
			{content: "<b>Kindle Import Help</b></br></br>", style: "font-size: 18px"},
			{content: "1. Copy the books you wish to import into /media/internal/.palmkindle on your TouchPad or " +
				"use Calibre and send the books to the device, or use the script written by m0ngr31 (see http://forums.precentral.net/hp-touchpad-homebrew/297377-real-kindle-sideloading-solution.html for details)."},
			{content: "&nbsp;&nbsp;The file name(s) should be in the format <i>Title - Author.mobi, Title - Author - ASIN.mobi, or <i>Title - Author - ASIN - Locations.mobi</i></i>"},
			{content: "2. (Coming Soon!) Modify the book metadata if you do not like the defaults and/or deselect books you do not wish to import"},
			{content: "3. Click on Load Books button to load the books from the .palmkindle folder"},
			{content: "4. Click on Import Books button to import the books into the database<br/><br/>"},
			{content: "You can use the Delete button to remove all books imported by this utility from Kindle.  This does not delete the book files."},
			{content: "<br/>Roadmap: Add support for cover images when sent from Calibre (m0ngr31 script supports this). Add fields to edit the book metadata"},
			{content: "<br/>Click anywhere outside of this dialog to close it"}
		]}
	]
});