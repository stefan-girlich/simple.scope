/** === TODO ===
- adapt drag changes in logic/db

*/


var simplescope = {};

simplescope.dummydata = {

	'introduction':		[

		[	// column 1
			{label: 'simple.scope', color: 1},
			{label: 'is a lightweight tool for taking notes.', color: 0},
			{label: 'Create new entries using the bottom text fields.', color: 2}
		],

		[	// column 2
			{label: 'Move entries by dragging them.', color: 5},
			{label: 'Edit or delete entries using the buttons.', color: 4},
			{label: 'Use your mouse wheel to change colors.', color: 3},
			{label: 'Create empty notes as separators:', color: 1},
			{label: '', color: 0},
			{label: 'Everything is stored only in your current web browser.', color: 2}
		]
	]
};


simplescope.db = {};


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


simplescope.ui = {};

simplescope.ui.Root = function Root(cols) {

	// TODO check cols


	var dragstart_offset,	// mousedown offset (px) relative to Entry element
		dragstart_pos,		// original Entry element position before mousedown
		draggedEntry = null,	// currently dragged Entry
		$focusPlaceholder = null,	// the placeholder currently closest to the dragged Entry element
		$focusCol = null;			// ... and its parent Column element


	var cbCols = {			// callback for all Columns
		onChange: function() {
			cb.onChange();
		},
		onEntryDragStart: function(dragEntry, evt) {
			draggedEntry = dragEntry;

			var el = draggedEntry.$el;

			// store dragstart/mousedown offset and original pos
			dragstart_offset = {x: evt.offsetX, y: evt.offsetY};
			dragstart_pos	 = {x: el.position().left, y: el.position().top};
		
			// apply absolute style
			el.css({left: evt.pageX - dragstart_offset.x, top: evt.pageY - dragstart_offset.y});
		
		
			$(window).mousemove(onWindowMouseDrag);
			$(window).mouseup(onWindowDragStop);

			for(var i=0; i<cols.length; i++) {
				cols[i].$el.mouseleave(cols[i].resetPlaceholders);
			}
		},

		onDropPositionChange: function(col, ph) {
			$focusPlaceholder = ph;	// store curr placeholder ref

			// for all Columns but the active one: reset placeholders
			for(var i=0; i<cols.length; i++) {
				if(cols[i] !== col) {
					cols[i].resetPlaceholders();
				}
			}
		}
	},
	cb;


	this.setCallback = function(callback) {
		cb = callback || {
			onChange: function() {}
		};
	}
	

	this.$el = $('<div id="content" />');

	for(var i=0; i<cols.length; i++) {
		cols[i].setCallback(cbCols);
		this.$el.append(cols[i].$el);
	}


	// TODO DOC Entry is dragged over Column
	function onWindowMouseDrag(evt) {

		var drag_el = draggedEntry.$el,
			closestCol = null;

		// apply absolute CSS according to cursor drag position
		drag_el.css({left: evt.pageX - dragstart_offset.x, top: evt.pageY - dragstart_offset.y});

		// find the column closest to the element's drag position
		for(var i=0; i<cols.length; i++) {
			var col_el = cols[i].$el;
			tmp_dist = Math.abs(drag_el.position().left + (drag_el.outerWidth() / 2) - (col_el.position().left + col_el.outerWidth() / 2));
			if(closestCol == null || tmp_dist < min_dist) {
				closestCol = cols[i];
				min_dist = tmp_dist;
			}
		}

		closestCol.onEntryDrag(draggedEntry, evt);
	}	// onWindowMouseDrag


	function onWindowDragStop(evt) {

		var $drag_el = draggedEntry.$el;

		$(window).unbind('mousemove', onWindowMouseDrag);
		$(window).unbind('mouseup', onWindowDragStop);

		for(var i=0; i<cols.length; i++) {
			cols[i].$el.unbind('mouseleave', cols[i].$el.resetPlaceholders);
		}

		// element is not dragged anymore, animated it to its new position
		$drag_el.stop().animate({
			left: $focusPlaceholder.position().left,
			top: $focusPlaceholder.position().top
		}, {
			duration: 100,
			complete: function() {

				// when the animation is completed: restore the overall default state

				$drag_el.removeClass('floating');
				$drag_el.removeClass('mouseDisabled');
				$drag_el.css({
					left: 'auto',
					top: 'auto'
				});

				// drop inline styles TODO necessary?
				$drag_el.removeAttr('style');

				// replace target placeholder
				$drag_el.insertBefore($focusPlaceholder);
				$focusPlaceholder.detach();

				$focusPlaceholder = null;

				for(var i=0; i<cols.length; i++) {
					cols[i].update(true);
				}

				cb.onChange();

				// TODO handle
				if($drag_el.position().left == dragstart_pos.x
						&& $drag_el.position().top == dragstart_pos.y) {
					console.log('ENTRY CLICKED OBSOLETE (?)')
				}
			}
		});

	}	// onWindowDragStop


	this.toJSONString = function() {

		var result = [];

		for(var i=0; i<cols.length; i++) {
			var colDat = [], entries = cols[i].getEntries();
			for(var j=0; j<entries.length; j++) {
				colDat.push({
					label: entries[j].getLabel(),
					color: entries[j].getColor(),
				});
			}
			result.push(colDat);
		}

		return JSON.stringify(result);
	}	// toJSONString
};	// simplescope.ui.Root



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
					$(this).children('.label').text(),
					color, cbEntries
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



simplescope.ui.Entry = function Entry(label, color, callback) {

	var self = this;

	var label = label || null, color = color || 0,
		cb;

	// === API ===

	this.setLabel = function(label) {
		this.label = label || null;
		// TODO apply
	}

	this.getLabel= function() {
		return label;
	}

	this.setColor = function(color) {
		this.color = color || 0;
		// TODO apply
	}

	this.getColor = function() {
		return color;
	}

	this.setCallback = function(callback) {
		cb = callback || {
			onEdit: function(newLabel) {},
			onDelete: function() {},
			onDragStart: function(el) {}
		};
	}

	/** Updates/overwrites internal model data with DOM data. 
	TODO UNUSED
	*/
	this.update = function() {
		label = $label.text();
		// TODO color
	}

	this.destroy = function() {
		// TODO IMPL
	}


	// defaults
	this.setCallback(callback);


	// initialize UI elements
	// TODO init through setter in favor of checks?
	var is_sep = !label || label.length <= 0 ? ' separator ' : '';
	this.$el = $('<div class="entry color' + color +is_sep+'"></div>');
	var $label = $('<span class="label">'+(is_sep ? '' : label)+'</span>'),
		$btn_edit = $('<div class="btn edit start_edit"></div>'),
		$btn_del = $('<div class="btn delete start_delete"></div>'),
		$btn_acc = $('<div class="btn accept"></div>'),
		$btn_decl = $('<div class="btn decline"></div>');

	this.$el.append($label, $btn_edit, $btn_del, $btn_acc, $btn_decl);


	$btn_edit.click(onButtonClick);
	$btn_del.click(onButtonClick);
	$btn_decl.click(onButtonClick);
	$btn_acc.click(onButtonClick);


	var buffAction = null;

	function onButtonClick(evt) {

		var t = evt.target;

		if(t === $btn_edit[0]) {
			toggleSafetyCtrl(true);
			buffAction = 'edit';
		}else if(t === $btn_del[0]) {
			toggleSafetyCtrl(true);
			buffAction = 'delete';
		}else if(t === $btn_decl[0]) {
			toggleSafetyCtrl(false);
			buffAction = null;
		}else if(t === $btn_acc[0]) {
			toggleSafetyCtrl(false);
			if(buffAction === 'edit') {
				alert('TODO trigger edit action')
			}else if(buffAction === 'delete') {
				alert('TODO trigger delete action')
			}
			buffAction = null;
		}
	}


	function toggleSafetyCtrl(active) {
		// TODO cooler way? refs to .hide and .show?
		if(active) {
			$btn_edit.hide();
			$btn_del.hide();
			$btn_acc.show();
			$btn_decl.show();
		}else {
			$btn_edit.show();
			$btn_del.show();
			$btn_acc.hide();
			$btn_decl.hide();
		}

	}

	// TODO refactor in named method
	this.$el.mousedown(function(evt) {

		var el = self.$el;

		if(evt.target !== el[0]) {
			// do nothing for starting drags on buttons etc.
			return;
		}

		// hack: apply placeholder height, bypassing CSS animation
		el.next().addClass('no_anim');
		el.next().height(el.outerHeight(true));
		el.hide().show(0);
		el.next().removeClass('no_anim');

		// fix dragged element width to CSS width
		el.width(el.width());
		el.css('padding', el.css('padding'));
		el.addClass('floating');
		el.addClass('mouseDisabled')

		// drag handling are handled by higher instances
		cb.onEntryDragStart(self, evt);
	});

	
};






$(function() {

	var body = $('body');


	/* !!!!!!!!!!!!!!!!!  DEBUG  !!!!!!!!!!!!!!!!! 
	dummy data */

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
		console.log('change!!!!!!!')

		storage.save(root.toJSONString());
	};
});