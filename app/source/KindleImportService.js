enyo.kind({
	name: "KindleImportService",
	kind: enyo.Component,
	components: [
		{ kind: enyo.PalmService, name: "service", 
		  service: "palm://cx.ath.kjhenrie.kindleimport.service/",
		  method: "kindleImport",
		  onSuccess: "returnBookData" } ],
	loadBookData: function(callback) {
		this.$.service.call({}, {"callback": callback});
	},
	returnBookData: function(inSender, inResponse, inRequest) {
		inRequest.callback(inResponse.books);
	}
});