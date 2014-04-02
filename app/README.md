#simple.scope : app

##TODO for release v0.4
* update references on website (new filenames!)
* fix full live version, problem: current main.js contains RemoteStorage init code that would usually be dropped through build.py . solution: implement ADD operation for build script, let RemoteStorage code be //-d by default
* known bug: on note creation, remote data seems to be updated on animation end: reproduce visual error by frenzy-creating notes

###usability
* put caret next to click for nicer editing
* fix weird Apple Magic Mouse behaviour (disable or workaround easing)
* performance check


###long term
* cross-browser
* mobile/touch? idea: extend default desktop UI objects to feature mobile specific behavior
* mobile native clients
* server storage