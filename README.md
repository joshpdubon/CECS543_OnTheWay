# CECS543_OnTheWay
<b>In order to use this tool. Simply place all three of the below files into the same directory and then open the MainScreen.html file in your browser.</b><br/>

A Google Maps extension that will allow users to find a convenient location to stop at while in route to their final destination. The webpage was developed in Google Chrome, which is the recommended browser for this tool. The website should still function correctly in other browsers, but the formatting may not be consistent.

11/01/2015 - Loaded the files that we have so far to the repository. Currently, the website is capable of displaying the path once the user has entered an origin and destination. It also plots markers along the path that we will use to search for nearby stop-off locations and optimize the route. <br/>
11/15/2015 - Uploaded additional code that is working towards completing the main algorithm that finds the optimal stop-off locations.<br/>
11/29/2015 - Finished main algorithm and some additional functionality.

<b>MainScreen.html</b> - The main html file for the website. It contains the necessary templates to house the map and all of the necessary controls. <br/>
<b>MainScreen.css</b> - A supplemental CSS file that provides additional styling to customize the website. The website makes use of some of the features of the Bootstrap framework, but it does not follow the full ideology of the framework. <br/>
<b>InitMap.js</b> - The javascript file that loads the map and other controls that utilize the Google Maps API. Also contains all the other javascript to test out various pieces of the API. Some of the functions should be placed into additional javascript files for convenience. <br/>