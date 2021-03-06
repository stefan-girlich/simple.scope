var simplescope = simplescope || {};

simplescope.dummydata = {

	'introduction':		[

		[	// column 1
			{label: 'simple.scope', color: 1},
			{label: 'is a lightweight tool for taking notes.', color: 0},
			{label: 'Create new notes using the bottom panels with the plus buttons. You can use Ctrl/Cmd&nbsp;+&nbsp;ENTER on your keyboard.', color: 2}
		],

		[	// column 2
			{label: 'Move notes by dragging them.', color: 5},
			{label: 'Edit notes by clicking them and typing, delete entries by clicking the minus button.', color: 4},
			{label: 'Use your mouse wheel on the minus button to change entry colors.', color: 3},
			{label: 'Create empty notes as separators:', color: 1},
			{label: '', color: 0},
			{label: 'Everything is stored only in your current web browser.', color: 2}
		]
	],

	'demo_screenshot':	[
	
		[
			{"label":"fix ticket #312: <br>nasty flicker bug on soft keyboard appear","color":4},
			{"label":"@vince discuss Calabash Android test cases<br>","color":3},
			{"label":"club-mate<br>","color":2}
		],

		[
			{"label":"[backend project]","color":5},
			{"label":"evaluate node.js frameworks","color":1},
			{"label":"@sarah SDK doc?","color":1},
			{"label":null,"color":5},
			{"label":"http://www.youtube.com/watch?v=i5GhFL0OWq8","color":1},
			{"label":"whiteboards?","color":0}
		]
	]
};

// create enhanced introduction for the live demo version
var dummy_intro_demo = $.extend(true, [], simplescope.dummydata.introduction);
dummy_intro_demo[0].splice(2, 0, {
	'label': 	'This is the live demo, changes will be discarded when you refresh or close this website.',
	'color':	4
});
simplescope.dummydata.introduction_demo = dummy_intro_demo;