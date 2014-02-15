var simplescope = simplescope || {};

simplescope.ui = simplescope.ui || {};


simplescope.ui.Column = function Column(entries) {

	var self = this;

	var entries = entries,
		cbEntries = {	// callback for entries
			onEdit: function(newLabel) {
				cb.onChange();
			},
			onDelete: function() {
				cb.onChange();
			},
			onEntryDragStart: function(dragEntry, evt) {
				//self.onEntryDrag(dragEntry, evt);	// TESTEEEEINGNGSDNG
				// $phActive = dragEntry.$el;

				// TODO obtaining the placeholder reference like this seems a bit nasty
				cb.onDropPositionChange(self, dragEntry.$el.next('.placeholder'));
				cb.onEntryDragStart(dragEntry, evt);
			}
		},
		cb,		// callback for this Column
		$placeholders = null,		// all placeholders
		$phActive = null;	// currently active placeholder


	// === API ===

	this.setCallback = function(callback) {
		cb = callback || {
			onChange: function() {},
			onEntryDragStart: function(dragEntry, jqEvt) {},
			onDropPositionChange: function(column, placeholder) {}
		};
	}

	this.setEntriesInputEnabled = function(enabled) {
		entries.forEach(function(el) {
			el.setInputEnabled(enabled);
		});
	}

	// TODO DOC an entry is dragged over the col
	this.onEntryDrag = function(dragEntry, evt) {

		var trgt = self.$el;

		var drag_el = dragEntry.$el, tmp_dist,
			$phClosest = null;

		// abs pos in viewport
		var drag_el_posY = drag_el.position().top + drag_el.outerHeight() / 2;

		var ix = 0;
		$placeholders.each(function() {
			var $ph = $(this);
			var dist = Math.abs(drag_el_posY- ($ph.position().top + $ph.outerHeight() / 2));
			if($phClosest == null  || dist < tmp_dist) {
				
				$phClosest = $ph;
				tmp_dist = dist;
			}
			ix++;
		});

		$placeholders.css('height', 0);

		$phClosest.css('height', drag_el.outerHeight(true));

		// TODO fire only if there is an actual change
		cb.onDropPositionChange(self, $phClosest);

		$phActive = $phClosest;
	}

	/** Sets all existing placeholders to their default state. */
	this.resetPlaceholders = function(evt) {
		$phActive = null;
		$placeholders.css('height', 0);
	}

	/** Updates/overwrites stored data with data from DOM, 
	removes all existing placeholders and creates new default 
	placeholders for all Entries in this Column. 
	deep: re-read entry labels and colors from DOM
	*/
	this.update = function(deep) {

		if(deep) {

			$entries = this.$el.children('.entry').not($placeholders);

			var entriesNew = [];
			$entries.each(function() {

				var color;
				$(this).attr('class').split(' ').filter(function(val, ix, arr) {
					return val.indexOf('color') == 0;
				}).forEach(function(val) {
					color = parseInt(val.replace('color', ''));
				});

				entriesNew.push(new simplescope.ui.Entry(
					$(this).children('.label').html(),
					color, cbEntries,
					$(this)
				));
			});

			entries = entriesNew;
		}

		if($placeholders)	$placeholders.detach();

		self.$el.prepend($('<div class="entry placeholder"></div>'));	// TODO REDUNDANT

		self.$el.children('.entry').not('.placeholder').each(function() {
			$(this).after($('<div class="entry placeholder"></div>'));	// TODO REDUNDANT
		});

		$placeholders = self.$el.children('.placeholder');
	}

	this.getEntries = function() {
		return entries;
	}


	// initialize UI

	this.$el = $('<div class="col"></div>');	// root element


	// initialize entries: callbacks, add elements o DOM
	for(var i=0; i<entries.length; i++) {
		entries[i].setCallback(cbEntries);
		this.$el.append(entries[i].$el);
	}
	this.update(false);	// ... to create placeholders

	$placeholders = this.$el.children('.placeholder');	// TODO cool way to collect refs on creation?

	var $add_panel = $('<div class="panel"><div class="btn add"></div><input type="text" class="tf" /></div>');
	this.$el.append($add_panel);

	// TODO
};