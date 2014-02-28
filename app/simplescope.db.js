var simplescope = simplescope || {};

simplescope.db = simplescope.db || {};


// TODO check for localstorage

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