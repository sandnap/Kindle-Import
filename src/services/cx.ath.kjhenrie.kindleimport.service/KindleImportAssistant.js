var libraries = MojoLoader.require(
	{ name: "foundations", version: "1.0" });
var fs = IMPORTS.require("fs");

var KindleImportAssistant = function(){
};
  
KindleImportAssistant.prototype = {
	run: function(f) {
		fs.readdir("/media/internal/.palmkindle/", function(err, filenames) {
			var books = [];
			for (var i = 0; i < filenames.length; i++) {
				if ( filenames[i].match(/.mobi$/) ) {
					books.push(filenames[i]);
				}
			}
			f.result = {
				"books": books
			};
		});
	}
};