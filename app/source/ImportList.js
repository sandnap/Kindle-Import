enyo.kind({
	name: "ImportList",
	kind: "VirtualRepeater",
	books: [],
	onSetupRow: "setupRow", components: [
          {kind: "Item", layoutKind: "HFlexLayout", components: [
              {name: "caption", flex: 1},
              {kind: "Button", onclick: "buttonClick"}
          ]}
    ],
	setupRow: function(inSender, inIndex) {
		var row = this.books[inIndex];
		if (inIndex < 10) {
			this.$.caption.setContent("I am item: " + inIndex);
			this.$.button.setCaption("Button" + inIndex);
			return true;
		}
	},
	load: function(books) {
		this.books = books;
		this.render();
	}
});