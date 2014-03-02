$(function() {

	var body = $('body');

	var storage = new simplescope.db.LocalStorage();
	storage = new simplescope.db.RemoteStorage();	// #build:local,demo:DROP	use local storage for local and demo builds
	
	storage.load(onDataLoaded);

	function onDataLoaded(data, err) {

		if(err) {
			alert('An unrecoverable error has occurred during loading, see log for details.')
			console.log(data)
			// TODO error handling
			return;
		}

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
			storage.save(root.toJSONString(), onDataSaved);
		};


		function onDataSaved(data, err) {
			if(err) {
				alert('An error has happened during saving, please see log.');
				console.log(data)

			}
		}
	}
});