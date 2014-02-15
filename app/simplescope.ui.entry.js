var simplescope = simplescope || {};

simplescope.ui = simplescope.ui || {};


simplescope.ui.Entry = function Entry(label, color, callback, $domEl) {

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

	this.setInputEnabled = function(enabled) {
		$label.attr('contentEditable', enabled ? 'true' : 'false')
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


	// === initialize UI elements ===


	var $label, $btn_edit, $btn_del, $btn_acc, $btn_decl;

	if(!$domEl) {
		// no existing DOM element given, create new one

		// TODO init label through setter in favor of checks?
		var is_sep = !label || label.length <= 0;
		this.$el = $('<div class="entry color' + color + (is_sep ? ' separator ' : '') +'"></div>');

		// TODO spell check could be optional
		$label = $('<span contentEditable="false" spellcheck="false" class="label tf">'+(is_sep ? '' : label)+'</span>');
		$btn_edit = $('<div class="btn edit start_edit"></div>');
		$btn_del = $('<div class="btn delete start_delete"></div>');
		$btn_acc = $('<div class="btn accept"></div>');
		$btn_decl = $('<div class="btn decline"></div>');

		this.$el.append($label, $btn_edit, $btn_del, $btn_acc, $btn_decl);

	}else {
		// DOM element exists, collect references

		this.$el = $domEl;
		$label = $domEl.children('.label');
		$btn_edit = $domEl.children('.btn.edit');
		$btn_del = $domEl.children('.btn.delete');
		$btn_acc = $domEl.children('.btn.accept');
		$btn_decl = $domEl.children('.btn.decline');

		// throw away any previous listeners
		$label.unbind();
		$btn_edit.unbind();
		$btn_del.unbind();
		$btn_acc.unbind();
		$btn_decl.unbind();
	}

	$label.click('click', onLabelClick);
	$label.blur(onLabelBlur);
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

	function onLabelClick(evt) {

		// already in text input mode, nothing TODO
		// TODO reading from DOM is bad practice
		if($label.attr('contentEditable') === 'true') {
			return;
		}

		self.setInputEnabled(true);
		
		var el = $(this)[0];

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

	function toggleTextInput(active) {
		// TODO IMPL
	}


	this.$el.mousedown(onMouseDown);
	this.$el.mouseup(onMouseUp);


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
		cb.onEntryDragStart(self, evt);

	}

	function onLabelBlur(evt) {
		self.setInputEnabled(false);
	}

};