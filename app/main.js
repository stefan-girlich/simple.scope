$(function() {

	var body = $('body');

	var storage = new simplescope.db.LocalStorage();
	
	storage.load(onDataLoaded);

	function onDataLoaded(data) {
		if(!data) {	// #build:demo:DROP
			// TODO impl ADD action in build.py for less redundant build actions
			data = simplescope.dummydata.introduction_demo;
			data = simplescope.dummydata.introduction; // #build:demo:DROP
		} // #build:demo:DROP

		var columns = [];
		for(var i=0; i<data.length; i++) {
			var colDat = data[i],
				entries = [];

			for(var j=0; j<colDat.length; j++) {
				entries.push(new simplescope.ui.Entry(colDat[j].label, colDat[j].color));
			}

			columns.push(new simplescope.ui.Column(entries));
		}


		var root = new simplescope.ui.Root(columns);
		body.append(root.$el);

		root.setCallback({onChange: onUiChange});

		function onUiChange() {
			storage.save(root.toJSONString());
		};
	}
});