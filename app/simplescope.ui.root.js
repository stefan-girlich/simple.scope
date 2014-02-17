var simplescope = simplescope || {};

simplescope.ui = simplescope.ui || {};

simplescope.ui.Root = function Root(cols) {

	// TODO check cols


	var dragstart_offset,	// mousedown offset (px) relative to Entry element
		dragstart_pos,		// original Entry element position before mousedown
		draggedEntry = null,	// currently dragged Entry
		$focusPlaceholder = null,	// the placeholder currently closest to the dragged Entry element
		$focusCol = null;			// ... and its parent Column element


	var cbCols = {			// callback for all Columns
		onChange: function() {

			// store changes from DOM
			cols.forEach(function(col) {
				col.update(true);
			})

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
				// reset all placeholders whenever the dragged element leaves the column
				cols[i].$el.mouseleave(cols[i].resetPlaceholders);

				// disable text input for entries to prevent erronous selections while dragging
				cols[i].setEntriesInputEnabled(false);

				// prevent dragging for all entries currently not dragged
				cols[i].setEntriesDragEnabled(false, draggedEntry);
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

		// TODO callback method called from above!
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
					// adopt DOM changes into internal data structure
					cols[i].update(true);

					// enabled dragging for all Entries in the Column
					cols[i].setEntriesDragEnabled(true);
				}

				cb.onChange();
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