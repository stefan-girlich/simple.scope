var simplescope = simplescope || {};

simplescope.ui = simplescope.ui || {};

// content has been pasted, strip potentially rich HTML data to plain text
simplescope.ui.onPaste = function(e) {
    e.preventDefault();
    var text = ((e.originalEvent).clipboardData.getData('text/plain') || '');
    document.execCommand('insertText', false, text);
}