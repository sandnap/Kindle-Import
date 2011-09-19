enyo.kind({
	name: "KindleImportService",
	kind: enyo.Component,
	components: [
		{ kind: enyo.PalmService, name: "books", 
		  service: "palm://cx.ath.kjhenrie.kindleimport.service/",
		  method: "kindleImport",
		  onSuccess: "returnBookData" },
		{ kind: enyo.PalmService, name: "covers", 
		  service: "palm://cx.ath.kjhenrie.kindleimport.service/",
		  method: "kindleCover",
		  onSuccess: "returnCoverData" }],
	loadBookData: function(callback) {
		this.$.books.call({}, {"callback": callback});
	},
	returnBookData: function(inSender, inResponse, inRequest) {
		inRequest.callback(inResponse.books);
	},
	loadCoverData: function(callback) {
		this.$.covers.call({}, {"callback": callback});
	},
	returnCoverData: function(inSender, inResponse, inRequest) {
		inRequest.callback(inResponse.covers);
	}
});