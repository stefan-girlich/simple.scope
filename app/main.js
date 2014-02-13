var simplescope = {};

simplescope.Column = function Column(entries) {
	var entries = Array.isArray(entries) ? entries : [];
	
	this.getEntries = function() {
		return entries;
	};

	this.add = function(entry) {
		entries.push(entry);
	};
	
	this.simplify = function() {
		var res = [];
		for(var i=0; i<entries.length; i++) {
			res.push(entries[i].simplify());
		}
		return res;
	};
};

simplescope.Entry = function Entry(label, col) {
	
	this.label = label;
	this.color = col;
	
	var self = this;

	this.simplify = function() {
		return {'label':self.label, 'color':self.color};
	}
};

simplescope.model = new function Model() {
	var session_data = {};

	// dummy data
	var session_data_dummy = [
		       new simplescope.Column([
		        	new simplescope.Entry('simple.scope', 1),
		        	new simplescope.Entry('is a lightweight tool for taking notes.', 0),
		        	new simplescope.Entry('Create new entries using the bottom text fields.', 2)
		       ]),
		       new simplescope.Column([
					new simplescope.Entry('Move entries by dragging them.', 5),
					new simplescope.Entry('Edit or delete entries using the buttons.', 4),
					new simplescope.Entry('Use your mouse wheel to change colors.', 3),
					new simplescope.Entry('Create empty notes as separators:', 1),
					new simplescope.Entry('', 0),
					new simplescope.Entry('Everything is stored only in your current web browser.', 2)
		      ])
		];
	
	// no record exists, use dummy data
	if(!localStorage.getItem('current')) {
		localStorage.setItem('current', JSON.stringify([session_data_dummy[0].simplify(), session_data_dummy[1].simplify()]));

	// record exists, load
	}else {

		session_data = $.parseJSON(localStorage.getItem('current'));
		var tmp_sd = []; 
		for(var i=0; i<session_data.length; i++) {	// for all columns
			var tmp_col = new simplescope.Column();
			for(var j=0; j<session_data[i].length; j++) {	// for all entries
				tmp_col.add(new simplescope.Entry(session_data[i][j].label, session_data[i][j].color));
			}
			tmp_sd.push(tmp_col);
		}
		session_data = tmp_sd;
	}
	
	// TODO NAMING

	this.restoreData = function() {
		return session_data;
	};
	
	this.storeData = function(cols_entries) {
		session_data = cols_entries;
		// session data corrupt here!!!!
		var simpler = [];
		for(var i=0; i<session_data.length; i++) {
			simpler.push(session_data[i].simplify());
		}
		
		localStorage.setItem('current', JSON.stringify(simpler));
	}
	
	this.getDataEntry = function(col_ix, entry_ix) {
		return session_data[col_ix][entry_ix];
	};
};	// simplescope.Model






simplescope.ui = {};

simplescope.ui.Root = function Root(cols) {

	// TODO check cols


	var dragstart_offset,	// mousedown offset (px) relative to Entry element
		dragstart_pos,		// original Entry element position before mousedown
		draggedEntry = null,	// currently dragged Entry
		dropPlaceholder = null;	// the placeholder currently closest to the dragged Entry element


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
				cols[i].$el.mouseleave(cols[i].onEntryDragLeave);
			}
		},

		onDropPositionChange: function(col, ph) {
			$dropPlaceholder = ph;
		}
	},
	cb;


	this.setCallback = function(callback) {
		cb = callback || {
			onChange: function() {
				cb.onChange();
			}
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

		var drag_el = draggedEntry.$el;

		$(window).unbind('mousemove', onWindowMouseDrag);
		$(window).unbind('mouseup', onWindowDragStop);

		for(var i=0; i<cols.length; i++) {
			cols[i].$el.unbind('mouseleave', cols[i].$el.onEntryDragLeave);
		}

		if(typeof $dropPlaceholder === 'undefined') {
			alert('TODO handle click without drag, aborting.');
			return;
		}

		drag_el.stop().animate({
			left: $dropPlaceholder.position().left,
			top: $dropPlaceholder.position().top
		}, {
			duration: 100,
			complete: function() {

				console.log('complete yo.')
			
				drag_el.removeClass('floating');
				drag_el.removeClass('mouseDisabled');
				drag_el.css({
					left: 'auto',
					top: 'auto'
				});

				drag_el.removeAttr('style');
				drag_el.insertBefore($dropPlaceholder);
				$dropPlaceholder.detach();

				$dropPlaceholder = null;


				for(var i=0; i<cols.length; i++) {
					cols[i].updatePlaceholders();
				}

				// TODO handle
				if(drag_el.position().left == dragstart_pos.x
						&& drag_el.position().top == dragstart_pos.y) {
					console.log('ENTRY CLICKED OBSOLETE (?)')
				}
			}
		});

	}	// onWindowDragStop

};



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

				//$dropPlaceholder = dragEntry.$el.next('.placeholder');
				cb.onEntryDragStart(dragEntry, evt);
			}
		},
		cb,		// callback for this Column
		$placeholders,		// all placeholders
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

	this.onEntryDragLeave = function(evt) {
		$phActive = null;
		$placeholders.css('height', 0);
		console.log('left...')
	}

	this.updatePlaceholders = function() {
		$placeholders.detach();

		self.$el.prepend($('<div class="entry placeholder"></div>'));	// TODO REDUNDANT

		self.$el.children('.entry').not('.placeholder').each(function() {
			$(this).after($('<div class="entry placeholder"></div>'));	// TODO REDUNDANT
		});

		$placeholders = self.$el.children('.placeholder');
	}


	// initialize UI

	this.$el = $('<div class="col"></div>');	// root element


	// initialize entries: callbacks, add elements and placeholders to DOM
	this.$el.append($('<div class="entry placeholder"></div>'));
	for(var i=0; i<entries.length; i++) {
		entries[i].setCallback(cbEntries);
		this.$el.append(entries[i].$el);
		console.log(entries[i])
		this.$el.append($('<div class="entry placeholder"></div>'));
	}

	$placeholders = this.$el.children('.placeholder');	// TODO cool way to collect refs on creation?

	var $add_panel = $('<div class="panel"><div class="btn add"></div><input type="text" class="tf" /></div>');
	this.$el.append($add_panel);

	// TODO
};




simplescope.ui.Entry = function Entry(label, color, callback) {

	var self = this;

	var label = label || null, color = color || 0,
		cb;

		console.log('label: ' + label)

	// === API ===

	this.setLabel = function(label) {
		this.label = label || null;
		// TODO apply
	}

	this.setColor = function(color) {
		this.color = color || 0;
		// TODO apply
	}

	this.setCallback = function(callback) {
		cb = callback || {
			onEdit: function(newLabel) {},
			onDelete: function() {},
			onDragStart: function(el) {}
		};
	}

	this.destroy = function() {
		// TODO IMPL
	}


	// defaults
	this.setCallback(callback);


	// initialize UI elements
	var is_sep = !label || label.length <= 0 ? ' separator ' : '';
	this.$el = $('<div class="entry color' + color +is_sep+'"></div>');
	var $label = $('<span class="label">'+label+'</span>'),
		$btn_edit = $('<div class="btn edit start_edit"></div>'),
		$btn_del = $('<div class="btn delete start_delete"></div>'),
		$btn_acc = $('<div class="btn decline"></div>'),
		$btn_decl = $('<div class="btn accept"></div>');

	this.$el.append($label, $btn_edit, $btn_del, $btn_acc, $btn_decl);



	// attach handlers

	$btn_edit.click(function(evt) {
		// TODO setLabel
		cb.onEdit(label, color)
	});

	$btn_del.click(function(evt) {
		cb.onDelete();
	});

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

	var test_entries = [
		new simplescope.ui.Entry('testee!', 2),
		new simplescope.ui.Entry('wesh wesh?!', 0),
		new simplescope.ui.Entry('was geht?', 4),
		new simplescope.ui.Entry('que pasa?', 5),
		new simplescope.ui.Entry('SUP?!', 1),
	];

	var test_cols = [
		new simplescope.ui.Column(test_entries.slice(0,3)),
		new simplescope.ui.Column(test_entries.slice(3))
	];

	var content = new simplescope.ui.Root(test_cols);
	body.append(content.$el);

	content.setCallback({onChange: onUiChange});

	function onUiChange() {
		alert('change!!!!!!!')
	};
});