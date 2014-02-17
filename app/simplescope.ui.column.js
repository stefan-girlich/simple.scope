var simplescope = simplescope || {};

simplescope.ui = simplescope.ui || {};


simplescope.ui.Column = function Column(entries) {

	var self = this;

	var entries = entries,
		cbEntries = {	// callback for entries
			onEdit: function() {
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

	// not: an Entry not enable/disable for drag, opttional
	this.setEntriesDragEnabled = function(enabled, not) {
		entries.forEach(function(el) {
			if(!not || not !== el)	{
				el.dragEnabled = enabled;
			}
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

	var $add_panel = $('<div class="panel color1"></div>');
	var $btn_add = $('<div class="btn add"></div>');
	var $text_input = $('<span contentEditable="true" spellcheck="false" class="tf"></span');

	$add_panel.append($text_input, $btn_add);
	this.$el.append($add_panel);

	// on text input focus: listen for key presses
	$text_input.focus(function() {
		$(window.document).keypress(onKeyPress);
	});

	// on text input blur: stop listening for key presses
	$text_input.blur(function() {
		$(window.document).unbind('keypress', onKeyPress);
	});

	$btn_add.click(onAddButtonClick);
	$btn_add.mousewheel(onAddButtonMouseWheel);

	var color = 1;

	function onAddButtonClick(evt) {

		createEntry();

	} // onAddButtonClick


	function onAddButtonMouseWheel(evt, delta, deltaX, deltaY) {

		color += deltaY > 0 ? 1 : -1;

		if(color < 0) {
			color = simplescope.ui.COLOR_CNT - 1; 
		}else if(color > simplescope.ui.COLOR_CNT - 1) {
			color = 0;
		}

		for(var i=0; i<simplescope.ui.COLOR_CNT; i++) {
			$add_panel.removeClass('color' + i);
		}

		$add_panel.addClass('color' + color);

	} // onAddButtonMouseWheel


	function onKeyPress(evt) {
		// 13: ENTER
		// 10: Ctrl+ENTER in Chrome
		if((evt.which === 13 || evt.which === 10) && (evt.ctrlKey || evt.metaKey)) {	// "Ctrl+ENTER" or "Cmd/Meta+ENTER"
			createEntry();
		}
	} // onKeyPress

	function createEntry() {
		
		var newLabel = $text_input.html(),
			newEntry = new simplescope.ui.Entry(newLabel, color, cbEntries),
			$newEl = newEntry.$el,
			$ph = $('<div class="entry placeholder created"></div>');

		$newEl.wrap($ph);
		$ph = $newEl.parent();	// retrieve lost ref
		$add_panel.before($ph);

		// TODO vendor prefix / cross browser
		$ph.bind('webkitTransitionEnd', function(evt) {
			$newEl.unwrap();
			cb.onChange();
		})

		// trigger open animation
		$ph.height($newEl.outerHeight(true));

		// empty text input
		$text_input.html('');

		// reset color to default
		for(var i=0; i<simplescope.ui.COLOR_CNT; i++) {
			$add_panel.removeClass('color' + i);
		}

		color = 1;

		$add_panel.addClass('color' + color);
	}
};