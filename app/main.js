$(function() {

	var body = $('body');

	var storage = new simplescope.db.LocalStorage(),
		data = storage.load();

	if(!data) {
		data = simplescope.dummydata.introduction;
	}

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
});