# CECS543_OnTheWay
A Google Maps extension that will allow users to find a convenient location to stop at while in route to their final destination.

11/01/2015 - Loaded the files that we have so far to the repository. Currently, the website is capable of displaying the path once the user has entered an origin and destination. It also plots markers along the path that we will use to search for nearby stop-off locations and optimize the route.

MainScreen.html - The main html file for the website. It contains the necessary templates to house the map and all of the necessary controls.
MainScreen.css - A supplemental CSS file that provides additional styling to customize the website. The website makes use of some of the features of the Bootstrap framework, but it does not follow the full ideaology of the framework.
InitMap.js - The javascript file that loads the map and other controls that utilize the Google Maps API. Also contains all the other javascript to test out various pieces of the API. Some of the functions should be places into additional javascript files for convenience.