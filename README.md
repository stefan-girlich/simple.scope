# simple.scope

simple.scope is a minimalist organization tool for recent versions of WebKit- and Blink-based desktop web browsers.

## app/
This project contains the actual web app.

## /
This root directory contains the simple.scope project website.



## getting started
To use the web app, open app/index.htm (recent code) or website/build/*.htm (minified and demo builds) in your web browser. 
Opening website/index.htm will show you the website containing further information.



## changelog


###0.3 UNRELEASED
* fixed bug where bezerk-dragging could live notes stack in floating state
* fixed "stuttering" of opening gaps between notes when entry dragged
* let dropped note tween to final location smoooothly

###0.2
first release after rewrite and redesign

###0.1
initial release based on the legacy version


## TODO

### fix issues

* improve text input: Currently, you have to click the label text itself to be able to edit it; clicking the imaginary box around it won't suffice. Also, the caret for text editing will be placed at the end of the first line of text instead of being placed close to the click position. Not cool!

* visual bug: jumping when drag-moving with dragstart on a multi-line label, probably due to nested divs for each line

* fix apple magic mouse bug

* cross-browser compatibility: Firefox
* cross-browser compatibility: Opera
* cross-browser compatibility: Internet Explorer

### features
* editable separators on click
- no demo anymore, fully featured live version on

* touch
* server
* native mobile clients

### improvements
* implement setters using JS set/get
* HTML5 drag-and-drop API? seems to be slower in minimal test
* introduce ID system to avoid scanning the whole simple.scope DOM subtree after changes
* rewrite callbacks: object with functions (current) -> object props with "onstuffhashappened" naming

