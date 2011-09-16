enyo.kind({
	name: "HelpDialog",
	kind: "Popup",
	components: [
		{style: "font-size: 14px; padding: 20px", components: [
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
			{content: "2. Copy the books you wish to import into /media/internal/.palmkindle on your touchpad or use Calibre and send the books to the device"},
			{content: "3. Modify the book metadata if you do not like the defaults and/or deselect books you do not wish to import"},
			{content: "4. Click on Import Books button to import the books into the database<br/><br/>"},
			{content: "You can use the Delete button below to remove all books imported by this utility from Kindle.  This does not delete the book files."}
		]}
	]
});