var simplescope = simplescope || {};

simplescope.ui = simplescope.ui || {};


simplescope.ui.COLOR_CNT = 6;

simplescope.ui.Entry = function Entry(label, color, callback, $domEl) {


	var self = this;

	var label = label || null, color = color || 0,
		cb;

	var textInputMode = false;

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
			onEdit: function() {},
			onDelete: function() {},
			onEntryDragStart: function(el, evt, mouseDownOffset) {}
		};
	}

	this.dragEnabled = true;

	this.setInputEnabled = function(enabled) {
		$label.attr('contentEditable', enabled ? 'true' : 'false')
	}

	/** Updates/overwrites internal model data with DOM data. 
	TODO UNUSED
	*/
	this.update = function() {
		label = $label.html();
		is_sep = !label || label.length <= 0;
		// TODO color
	}

	this.destroy = function() {

		var $delete_wrap = $('<div class="entry placeholder"></div>');
		$delete_wrap.height(this.$el.outerHeight(true));
		this.$el.wrap($delete_wrap);
		$delete_wrap = this.$el.parent(); // retrieve lost reference

		// TODO vendor prefix / cross browser
		$delete_wrap.one('webkitTransitionEnd', function(evt) {
			$delete_wrap.detach();
			cb.onDelete();
		});

		// trigger closing animation
		$delete_wrap.height(0);
	}


	// defaults
	this.setCallback(callback);

	// TODO init label through setter in favor of checks?
	var is_sep = !label || label.length <= 0;


	// === initialize UI elements ===


	var $label, $btn_del, $btn_acc, $btn_decl;

	if(!$domEl) {
		// no existing DOM element given, create new one

		this.$el = $('<div class="entry color' + color + (is_sep ? ' separator ' : '') +'"></div>');

		// TODO spell check could be optional
		$label = $('<span contentEditable="false" spellcheck="false" class="label tf">'+(is_sep ? '' : label)+'</span>');
		$btn_del = $('<div class="btn delete start_delete"></div>');
		$btn_acc = $('<div class="btn accept"></div>');
		$btn_decl = $('<div class="btn decline"></div>');

		this.$el.append($label, $btn_del, $btn_acc, $btn_decl);

	}else {
		// DOM element exists, collect references

		this.$el = $domEl;
		$label = $domEl.children('.label');
		$btn_del = $domEl.children('.btn.delete');
		$btn_acc = $domEl.children('.btn.accept');
		$btn_decl = $domEl.children('.btn.decline');

		// throw away any previous listeners
		this.$el.unbind();
		$label.unbind();
		$btn_del.unbind();
		$btn_acc.unbind();
		$btn_decl.unbind();
	}

	this.$el.mousedown(onMouseDown);
	this.$el.mouseup(onMouseUp);
	$label.click('click', onLabelClick);
	$label.focus(onLabelFocus);
	$label.blur(onLabelBlur);
	$btn_del.click(onButtonClick);
	$btn_del.mousewheel(onButtonMouseWheel);
	$btn_decl.click(onButtonClick);
	$btn_acc.click(onButtonClick);

	$label.on('paste', simplescope.ui.onPaste);

	/* 
	TODO instead of using $.data with separate keys,
	everything should be stored in a single JS object that
	gets stored in the DOM through $.data
	major advantage: all transient data in one place
	*/

	function onButtonClick(evt) {

		var t = evt.target;

		if(t === $btn_del[0]) {

			if(is_sep) {
				self.destroy();
				return;
			}

			toggleSafetyCtrl(true);
			self.$el.data('buffered_action', 'delete')

		}else if(t === $btn_decl[0]) {

			toggleSafetyCtrl(false);
			buffAction = null;

		}else if(t === $btn_acc[0]) {

			toggleSafetyCtrl(false);

			self.destroy();
			self.$el.data('buffered_action', null)
		}
	}

	function onLabelClick(evt) {
		enterTextInputMode();
	}


	function enterTextInputMode() {
		// already in text input mode, nothing to do
		// TODO reading from DOM is bad practice
		if(textInputMode) {
			return;
		}

		self.setInputEnabled(true);
		
		var el = $label[0];

		// set caret to end of label text, default would be index 0 position
    	var range = document.createRange();
    	var sel = window.getSelection();
    	range.setStart(el.childNodes[0], el.childNodes[0].length);
    	range.collapse(true);
    	sel.removeAllRanges();
    	sel.addRange(range);
    	el.focus();
	}


	function toggleSafetyCtrl(active) {
		// TODO cooler way? refs to .hide and .show?
		if(active) {
			$btn_del.hide();
			$btn_acc.show();
			$btn_decl.show();
		}else {
			$btn_del.show();
			$btn_acc.hide();
			$btn_decl.hide();
		}
	}

	var mouseDownPos = null;

	function onMouseDown(evt) {

		var $el = $(evt.currentTarget);

		mouseDownPos = {
			x: evt.pageX - $el.position().left,
			y: evt.pageY - $el.position().top
		};
		
		// TODO bad practice: read from DOM
		if($(evt.target).hasClass('btn')) {
			// prevent dragging on buttons
			return;
		}

		if($(evt.target)[0] === $label[0] && textInputMode) {
			// allow drag text selection, prevent drag-moving the entry
			return;
		}

		if(!self.dragEnabled) {
			// do not listen for drag movement when not enabled
			return;
		}

		// listen for initial drag movement
		$el.one('mousemove', onDragStart);

		return;
	}

	function onMouseUp(evt) {

		var $currTrgt = $(evt.currentTarget),
			trgt = $(evt.target);

		// when there has been no movement between onMouseDown and onMouseUp,
		// onDragStart may be triggered, so unbind the listener
		$currTrgt.unbind('mousemove', onDragStart);

		var mouseUpPos = {
			x: evt.pageX - $currTrgt.position().left,
			y: evt.pageY - $currTrgt.position().top
		};


		if(mouseDownPos && mouseDownPos.x === mouseUpPos.x 
			&& mouseDownPos.y === mouseUpPos.y) {
			// it's a click!

			if(trgt[0] === $label[0]) {
				// label clicked

				// TODO handle
			}

		}

		mouseDownPos = null;
	}

	function onDragStart(evt) {

		var el = self.$el;

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

		self.setInputEnabled(false);

		// drag handling are handled by higher instances
		cb.onEntryDragStart(self, evt, mouseDownPos);

	}

	function onLabelFocus(evt) {
		textInputMode = true;
	}

	function onLabelBlur(evt) {

		/* NOTE: will also be triggered when blurring through click on button */

		self.setInputEnabled(false);
		textInputMode = false;

		if($label.html().length <= 0) {
			self.$el.addClass('separator');
		}else {
			self.$el.removeClass('separator');
		}

		// handle unfocussing as "save changes" action
		self.update();
		toggleSafetyCtrl(false);
		self.$el.data('buffered_action', null);
		cb.onEdit();
	}

	function onButtonMouseWheel(evt, delta, deltaX, deltaY) {

		color += deltaY > 0 ? 1 : -1;

		if(color < 0) {
			color = simplescope.ui.COLOR_CNT - 1; 
		}else if(color > simplescope.ui.COLOR_CNT - 1) {
			color = 0;
		}

		for(var i=0; i<simplescope.ui.COLOR_CNT; i++) {
			self.$el.removeClass('color' + i);
		}

		self.$el.addClass('color' + color);

		cb.onEdit();
	}
};