var simplescope = {};

simplescope.factory = new function Factory() {

	this.buildPlaceholder = function(attr_class) {
		return $('<div class="entry placeholder ' + (attr_class || '') + '"></div>');
	};

	this.buildColumn = function(attr_class) {
		return $('<div class="col ' + (attr_class || '') + '"></div>');
	};

	this.buildEntry	= function(label, color) {
		var is_sep = !label || label.length <= 0 ? ' separator ' : '';
		return $('<div class="entry color' + color +is_sep+'">' +
						'<span class="label">'+label+'</span>' +
						'<div class="btn edit start_edit"></div><div class="btn delete start_delete"></div>' +
					'<div class="btn decline"></div><div class="btn accept"></div>' +
					'</div>'
				)
				.data('label', label).data('color', color);
	};

	this.buildAddPanel	 = function(attr_class) {
		return $('<div class="panel ' + (attr_class || '') + '"><div class="btn add"></div><input type="text" class="tf" /></div>');
	};

	this.buildEntryTextfield = function(attr_class, value) {
		return $('<input type="text" class="tf ' + (attr_class || '') + '" value="'+value+'"/><br class="clear" />');
	};
	
	return this;
};

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

	this.getPlaceholder = function(ix) {
		return $placeholders.eq(ix);
	}


	// initialize UI

	this.$el = $('<div class="col"></div>');	// root element


	// initialize entries: callbacks, add elements and placeholders to DOM
	this.$el.append($('<div class="entry placeholder"></div>'));
	for(var i=0; i<entries.length; i++) {
		entries[i].setCallback(cbEntries);
		this.$el.append(entries[i].$el);
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
		new simplescope.ui.Column(test_entries.slice(2))
	];

	var content = new simplescope.ui.Root(test_cols);
	body.append(content.$el);

	content.setCallback({onChange: onUiChange});

	function onUiChange() {
		alert('change!!!!!!!')
	};
});



$(function() {

	/* !!!!!!!!!!!!!!!!!  DEBUG  !!!!!!!!!!!!!!!!! 
	disable legacy code */

	return;



	setViewData(simplescope.model.restoreData());
	
	var cols = $('.col'), entries = cols.children('.entry');
	var drag_el, placeholder_el, placeholder_closest = null,
		dragstart_offset, dragstart_pos;
	
	entries.mousedown(onEntryDragStart);
	entries.mousewheel(onEntryScroll);
	cols.find('.panel .btn').mousedown(onPanelBtnDown);
	
	
	function onEntryDragStart(evt) {
		var th = $(this), parent_col = th.parent();
				placeholder_el = simplescope.factory.buildPlaceholder();
		drag_el = th;
		
		var evt_trgt = $(evt.target)[0];
		if($(evt.target).hasClass('btn')) {	// target is button?
			onEntryBtnDown.apply(evt.target, evt);
			return;
		}else
		if(evt_trgt === th.children('input.tf')[0]) {	// target is textfield?
			return;
		}else
		if(evt_trgt === th.is('.panel')) {	// target is panel?
			return;
		}
		
		placeholder_el = fillInPlaceholders(cols, drag_el);
		drag_el.next().addClass('no_anim');
		drag_el.next().height(drag_el.outerHeight(true));
		drag_el.hide().show(0);
		drag_el.next().removeClass('no_anim');
		
		th.width(th.width());
		th.css('padding', th.css('padding'));
		th.addClass('floating');
		
		dragstart_offset = {x: evt.offsetX, y: evt.offsetY};
		dragstart_pos	 = {x: drag_el.position().left, y: drag_el.position().top};
		
		th.css({left: evt.pageX - dragstart_offset.x, top: evt.pageY - dragstart_offset.y});
		
		th.addClass('mouseDisabled')
		
		$(window).mousemove(onEntryMouseDrag);
		$(window).mouseup(onEntryDragStop);
		onColMouseDrag.call(parent_col, evt);
	}
	
	function onEntryMouseDrag(evt) {
		
		drag_el.css({left: evt.pageX - dragstart_offset.x, top: evt.pageY - dragstart_offset.y});
		
		var inner_trgt;
		if($(evt.target).hasClass('col')) {
			inner_trgt = $(evt.target);
			
		}else if($(evt.target).hasClass('entry')) {
			inner_trgt = $(evt.target).parent();
		}else { // find closest column
			var closest = null, min_dist;
			cols.each(function() {
				var th = $(this);
					tmp_dist = Math.abs(drag_el.position().left + (drag_el.outerWidth() / 2) - (th.position().left + th.outerWidth() / 2));
				if(closest == null
						|| tmp_dist < min_dist) {
					closest = th;
					min_dist = tmp_dist;
				}
			});
			inner_trgt = closest;
		}
		onColMouseDrag.apply(inner_trgt, evt);
	}

	function onColMouseDrag(evt) {
		var trgt = $(this);
		var drag_el_posY = drag_el.position().top + drag_el.outerHeight() / 2;
		var ph_closest = null, tmp_dist;
		trgt.children('.placeholder').each(function() {
			if(ph_closest == null 
						|| Math.abs(drag_el_posY- ($(this).position().top + $(this).outerHeight() / 2)) < tmp_dist) {
				ph_closest = $(this);
				tmp_dist = Math.abs(drag_el_posY- ($(this).position().top + $(this).outerHeight() / 2))
			}
		});
		//ph_closest.addClass('no_anim');
		placeholder_el.css('height', 0);
		
		
		//var is_new = placeholder_closest[0] === ph_closest[0];
		ph_closest.css('height', drag_el.outerHeight(true));
		placeholder_closest = ph_closest;
	}
	
	function onEntryDragStop(evt) {
		$(window).unbind('mousemove', onEntryMouseDrag);
		$(window).unbind('mouseup', onEntryDragStop);
		
		drag_el.stop().animate({
			left: placeholder_closest.position().left,
			top: placeholder_closest.position().top
		}, {
			duration: 100,
			complete: function() {
				drag_el.removeClass('floating');
				drag_el.removeClass('mouseDisabled');
				drag_el.css({
					left: 'auto',
					top: 'auto'
				});
				drag_el.removeAttr('style');
				drag_el.insertBefore(placeholder_closest);
				placeholder_el.detach();
				
				if(drag_el.position().left == dragstart_pos.x
						&& drag_el.position().top == dragstart_pos.y) {
					console.log('ENTRY CLICKED OBSOLETE (?)')
				}
				
				simplescope.model.storeData(getViewData());
				
				drag_el = null;  placeholder_closest = null;
				dragstart_offset = null;
			}
		});
	}
	
	function onEntryBtnDown(evt) {
		var th = $(this), entry = $(this).parent(), label = entry.children('.label')
			btn_edit = 	entry.children('.btn.edit'),
			btn_del = 	entry.children('.btn.delete'),
			btn_acc = 	entry.children('.btn.accept'),
			btn_decl = 	entry.children('.btn.decline');

		if(th.is('.edit, .delete')) {
			
			
			if(th[0] === btn_edit[0])	{
				var tf = simplescope.factory.buildEntryTextfield('', label.text());
				label.hide().before(tf);
			}else {
				if(entry.is('.separator')) {
					deleteEntry(entry);
					return;
				}
			}
			
			btn_edit.hide(); btn_del.hide();
			btn_acc.show(); btn_decl.show();
			
			var mode;
			switch(th[0]) {
				case btn_edit[0]:	mode = 'edit'; break;
				case btn_del[0]:	mode = 'delete'; break;
				default:			mode = null;
			}

			entry.data('mode', mode);
		}else
		if(th.is('.accept, .decline')) {
			var tf = th.parent().children('input.tf');
			
			if(th.hasClass('accept')) {
				if(entry.data('mode') == 'edit') {
					label.text(tf.val());
					label.parent().data({label: tf.val(), color: label.parent().data().color});
					simplescope.model.storeData(getViewData());
				}else if(entry.data('mode') == 'delete'){
					deleteEntry(entry);
					return;
				}
			}
			
			tf.next('br.clear').detach();	// remove textfield and break
			tf.detach();
			th.parent().children('.btn.edit, .btn.delete').show();	// show edit and delete btns
			th.parent().children('.btn:NOT(.edit, .delete)').hide();	// hide others
			label.show();	// show label
			th.data('mode', null);
		}
	}
	
	function onPanelBtnDown(evt) {
		var th = $(this), panel = th.parent(), tf = panel.children('input.tf'),
			new_entry = simplescope.factory.buildEntry(tf.val(), 1);
		panel.before(new_entry);
		new_entry.wrap(simplescope.factory.buildPlaceholder('created'))
		var tmp_wrap = panel.parent().children('.placeholder.created');
		tmp_wrap.bind('webkitTransitionEnd', function(evt) {
			new_entry.removeClass('created');
			new_entry.unwrap();
			new_entry.mousedown(onEntryDragStart);
			new_entry.mousewheel(onEntryScroll);
			simplescope.model.storeData(getViewData());
		});
		tmp_wrap.height(new_entry.outerHeight(true));
		tf.val('');
	}
	
	
	function onEntryScroll(event, delta, deltaX, deltaY) {
		event.preventDefault();
		
		var th = $(this);
		var color_max = 6, curr_color = parseInt(th.data().color);
		curr_color += deltaY > 0 ? 1 : -1;
		if(curr_color < 0) {
			curr_color = color_max - 1; 
		}else if(curr_color > color_max - 1) {
			curr_color = 0;
		}
		th.data('color', curr_color);
			
		$(this).removeClass('color0').removeClass('color0 color1 color2 color3 color4 color5')
				.addClass('color'+curr_color);
		
		simplescope.model.storeData(getViewData());
	}
	
	
	function fillInPlaceholders(el_jq, drag_el) {
		var tmp_phs = [], tmp_ph;
		el_jq.each(function(ix, el) {
			var entry_last = ($(this).children('.entry').last());
			if($(this).children('.entry').size() <= 0) {
				tmp_ph = simplescope.factory.buildPlaceholder();
				tmp_phs.push(tmp_ph);
				$(this).prepend(tmp_ph);
			}
			$(this).children('.entry').each(function () {
				if($(this)[0] !== drag_el[0]) { // entry is not dragged entry?
					tmp_ph = simplescope.factory.buildPlaceholder();
					tmp_phs.push(tmp_ph);
					$(this).before(tmp_ph);
				}else {
				}
				if(entry_last[0] === $(this)[0]) {
					tmp_ph = simplescope.factory.buildPlaceholder();
					tmp_phs.push(tmp_ph);
					$(this).after(tmp_ph);
				}
			});
		});
		return $(tmp_phs).map(function() { return this.toArray(); });
	}
	
	function deleteEntry(entry) {
		var delete_wrap = simplescope.factory.buildPlaceholder('deleted');
		delete_wrap.height(entry.outerHeight(true));
		entry.wrap(delete_wrap);
		delete_wrap = entry.parent();
		delete_wrap.bind('webkitTransitionEnd', function(evt) {
			delete_wrap.detach();
			simplescope.model.storeData(getViewData());
		});
		delete_wrap.height(0);
	}
	
	
	// TODO to simplescope.view.setViewData(), getViewData() analogue, fillInPlaceHolder
	function setViewData(data) {
		var container_el = $('#content');
		//console.log(data)
		for(var i=0; i<data.length; i++) {		// for all columns
			var col_el = simplescope.factory.buildColumn(),
				btn_el = simplescope.factory.buildAddPanel();
			container_el.append(col_el)
			
			
			var entries = data[i].getEntries();
			for(var j=0; j<entries.length; j++) {
				col_el.append(simplescope.factory.buildEntry(entries[j].label, entries[j].color))
			}
			col_el.append(btn_el);
		}
	}
	
	function getViewData() {
		var res = [];
		cols.each(function() {
			var c = new simplescope.Column(), e_dat;
			$(this).children('.entry:NOT(.placeholder, .panel)').each(function() {
				e_dat = $(this).data();
				//console.log(e_dat)
				c.add(new simplescope.Entry(e_dat.label, e_dat.color));
			});
			res.push(c);
		});
		return res;
	}
});