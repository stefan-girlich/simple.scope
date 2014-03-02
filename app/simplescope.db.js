var simplescope = simplescope || {};

simplescope.db = simplescope.db || {};


// TODO check for localstorage

simplescope.db.RemoteStorage = function RemoteStorage() {

	this.save = function(data, cb) {

		// TODO kill prev req

		$.ajax('/api/storage', {
			dataType: 'json',
			type: 'POST',
			data: data,
			success: function(jqXHR, txtStatus) {
				cb(jqXHR);
			},
			error: function(jqXHR, txtStatus, errThrown) {
				cb(jqXHR.responseText, true);
			}
		});
	}

	this.load = function(cb) {
		dataType: 'json',
		$.ajax('/api/storage', {
			type: 'GET',
			success: function(jqXHR, txtStatus) {
				cb(jqXHR);
			},
			error: function(jqXHR, txtStatus, errThrown) {
				// TODO
				cb(txtStatus, true)
			}
		});
	}
};



simplescope.db.LocalStorage = function LocalStorage(storageKey) {
	storageKey = storageKey || 'simplescope.localstorage_default';

	this.save = function(data) {

		localStorage.setItem(storageKey, data); // #build:demo:DROP
	}

	this.load = function(cb) {
		var data = localStorage.getItem(storageKey);
		if(!data)	{
			data = null;
		}else {
			data = JSON.parse(data);
		}

		cb(data);
	}
};