enyo.kind({
	name: "HelpDialog",
	kind: "Popup",
	components: [
		{style: "font-size: 14px; padding: 20px", components: [
			{content: "<b>Kindle Import Help</b></br></br>", style: "font-size: 18px"},
			{content:"<br/>1. You must grant the cx.ath.kjhenrie.kindleimport application 'create' permission for com.palm.kindle.books:1." +
					" One method for doing this is to create a file named <i>com.palm.kindle</i> with the contents below in the /etc/palm/db/permissions folder on the TouchPad. You will need to restart the TouchPad after creating this file." +
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
			{content: "2. Copy the books you wish to import into /media/internal/.palmkindle on your TouchPad or use Calibre and send the books to the device"},
			{content: "&nbsp;&nbsp;The file name(s) should be in the format <i>Title - Author - ASIN.mobi</i>.  <b>ASIN is optional.</b>"},
			{content: "3. (Coming Soon!) Modify the book metadata if you do not like the defaults and/or deselect books you do not wish to import"},
			{content: "4. Click on Load Books button to load the books from the .palmkindle folder"},
			{content: "5. Click on Import Books button to import the books into the database<br/><br/>"},
			{content: "You can use the Delete button to remove all books imported by this utility from Kindle.  This does not delete the book files."},
			{content: "<br/>Roadmap: Add support for cover images. Add fields to edit the book metadata"},
			{content: "<br/>Click anywhere outside of this dialog to close it"}
		]}
	]
});