var simplescope = {};

simplescope.factory = new function Factory() {
	
	var fnct_buildPlaceholder = function(attr_class) {
		if(!attr_class)	attr_class = '';
		return $('<div class="entry placeholder ' + attr_class + '"></div>');
	};
	
	var fnct_buildColumn = function(attr_class) {
		if(!attr_class)	attr_class = '';
		return $('<div class="col ' + attr_class + '"></div>');
	};
	
	var fnct_buildEntry = function(label, color) {
		var is_sep = !label || label.length <= 0 ? ' separator ' : '';
		return $('<div class="entry color' + color +is_sep+'">' +
						'<span class="label">'+label+'</span>' +
						'<div class="btn edit start_edit"></div><div class="btn delete start_delete"></div>' +
					'<div class="btn decline"></div><div class="btn accept"></div>' +
					'</div>'
				)
				.data('label', label).data('color', color);
	};
	
	var fnct_buildAddPanel = function(attr_class) {
		if(!attr_class)	attr_class = '';
		return $('<div class="panel ' + attr_class + '"><div class="btn add"></div><input type="text" class="tf" /></div>');
	};
	
	var fnct_buildEntryTextfield = function(attr_class, value) {
		if(!attr_class)	attr_class = '';
		return $('<input type="text" class="tf ' + attr_class + '" value="'+value+'"/><br class="clear" />');
	};
	
	this.buildPlaceholder = fnct_buildPlaceholder;
	this.buildColumn	 = fnct_buildColumn;
	this.buildEntry	 = fnct_buildEntry;
	this.buildAddPanel	 = fnct_buildAddPanel;
	this.buildEntryTextfield = fnct_buildEntryTextfield;
	
	return this;
};

simplescope.Column = function Column(entries) {
	var entries = Array.isArray(entries) ? entries : [];
	
	var fnct_getEntries = function() {
		return entries;
	};
	var fnct_add = function(entry) {
		entries.push(entry);
	}
	;
	this.getEntries = fnct_getEntries;
	this.add = fnct_add;
	
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
	var session_data_dummy = [
		       new simplescope.Column([
		        	new simplescope.Entry('Abwasch!!', 2),
		        	new simplescope.Entry('Küche saubermachen', 1),
		        	new simplescope.Entry('Rechnungen', 3)
		       ]),
		       new simplescope.Column([
					new simplescope.Entry('Carlo', 2),
					new simplescope.Entry('Cokxxx!!', 0),
					new simplescope.Entry('Nuttn!!', 3),
					new simplescope.Entry('Isch komm auf die Party', 1),
					new simplescope.Entry('und mach Stress ohne Grund.', 2)
		      ])
		];
	
	// DUMMY fill localStorage
	if(!localStorage.getItem('current'))	localStorage.setItem('current', JSON.stringify([session_data_dummy[0].simplify(), session_data_dummy[1].simplify()]));

	if(localStorage.getItem('current')) {
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
	}else {
		console.log('empty current data set!')
	}
	
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
};









$(function() {
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