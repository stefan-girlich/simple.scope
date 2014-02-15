var simplescope = simplescope || {};

simplescope.db = simplescope.db || {};


// TODO check for localstorage

simplescope.db.LocalStorage = function LocalStorage(storageKey) {
	storageKey = storageKey || 'simplescope.localstorage_default';

	this.save = function(data) {

		localStorage.setItem(storageKey, data);
	}

	this.load = function() {
		var data = localStorage.getItem(storageKey);
		if(!data)	return null;

		return JSON.parse(data);
	}
};