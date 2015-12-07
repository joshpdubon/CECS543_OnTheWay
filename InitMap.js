// Variable to create map
var map;
var csulb = {lat: 33.783, lng: -118.114};

// Variables to limit algorithm to run within the constraints of the API
var numPoints = 20;
var numCandidates = 9;
var searchRadius = 1000; // meters
var result;

// Variables to manipulate the origin, destination, and stop-off points
var autocomp_origin;
var autocomp_dest;
var autocomp_stop;
var origin_place;
var dest_place;
var stop_keyword;

// Direction service variables
var directionsService;
var directionsDisplay;

// Variables that will store path information
var initialDist;
var pathPoints;
var stopCandidates;
var candDetails;
var markers = [];


/*
	Function that initializes the map area and assigns the autocomplete
	features to the appropriate text boxes. This function is called when
	the Google Maps API has been loaded.
*/
function initMap() {
	// Initialize the map element centered at CSULB
	map = new google.maps.Map(document.getElementById('map'), {
		center: csulb,
		zoom: 15
	});

	// Add autocomplete to origin textbox
	autocomp_origin = new google.maps.places.Autocomplete(
		(document.getElementById('origin')),
		{types: []}
	);
		
	// Add autocomplete to destination textbox
	autocomp_dest = new google.maps.places.Autocomplete(
		(document.getElementById('dest')),
		{types: []});
	
	// Add autocomplete to stop off location textbox
	autocomp_stop = new google.maps.places.SearchBox(document.getElementById('stoploc'));
	
	// Add listener to set the autocomplete bias when the maps viewport changes
	map.addListener('bounds_changed', function() {
		autocomp_origin.bindTo('bounds', map);
		autocomp_dest.bindTo('bounds', map);
		autocomp_stop.bindTo('bounds', map);
	});

	// Initialize the direction service objects
	directionsService = new google.maps.DirectionsService;
	directionsDisplay = new google.maps.DirectionsRenderer;
	
	// Apply handlers to the various buttons
	document.getElementById('findRoute').onclick = findRoute;
	document.getElementById('refreshPage').onclick = refreshPage;
	document.getElementById('findStop').onclick = findStopOff;
	document.getElementById('select1').onclick = addStop1;
	document.getElementById('select2').onclick = addStop2;
	document.getElementById('select3').onclick = addStop3;
	document.getElementById('select4').onclick = addStop4;
	document.getElementById('select5').onclick = addStop5;
	
	// Set infowindow for markers
	infowindow = new google.maps.InfoWindow();
} // End initMap


/*
	Function that retrieves the origin and destination points from the text
	boxes and displays the route on the map. This function also stores
	information about the path that is genereated such as, the overall
	distance and  an array of points that lie on the path. It finishes by
	unhiding the section on the screen that allows the user to enter the
	stop-off keyword.
*/
function findRoute() {
	// Capture the origin and destination from the textboxes
	origin_place = autocomp_origin.getPlace();
	dest_place = autocomp_dest.getPlace();
	
	// Create request for directions
	var request = {
		origin: origin_place.geometry.location,
		destination: dest_place.geometry.location,
		travelMode: google.maps.TravelMode.DRIVING
	};

	// Display the directions on the map
	directionsDisplay.setMap(map);
	directionsService.route(request, function(result, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			removeMarkers();
			directionsDisplay.setDirections(result);
			
			// Get points along the path
			getPointsOnPath(result);
			
			// Store distance for path straight from origin to destination
			initialDist = result.routes[0].legs[0].distance.value;
			
			// Display the section on the webpage to enter a stop-off location
			document.getElementById('stopsec').style.display = 'block';
		}
		else {
			alert(status);
		}
	});
} //End findRoute


/*
	This function is called by findRoue and it is used to retrieved the desired
	number of points along the path and stores them in an array. In the interest
	of performance, the number of points are limited by the variable numPoints.
	
	@param result is a Google Maps DirectionResult object that stores the path
		between the user's specified origin and destination points.
*/
function getPointsOnPath(result) {
	var index;
	var offset;
	var marker;
	
	// Make sure points array is empty
	pathPoints = [];
	
	// Calculate the number of points along the path to skip
	offset = Math.floor(result.routes[0].overview_path.length / numPoints);
	
	// Loop through overview_path array and get the number of desired points
	for(index = 0; index < result.routes[0].overview_path.length; index += offset) {
		pathPoints.push(result.routes[0].overview_path[index]);
	}
	
	// Add destination point if needed
	if(result.routes[0].overview_path.length % numPoints != 0) {
		pathPoints.push(result.routes[0].overview_path[result.routes[0].overview_path.length - 1]);
	}
} // End getPointsOnPath



/*
	Function that finds potential stop off locations by performing a radar
	search through the Google Maps API. It is triggered by the user pushing the
	Find Stop-Off button.
*/
function findStopOff() {
	
	// Clear out array that stores the potential stop locations
	stopCandidates = [];
	
	// Retrieve the search keyword from the textbox
	stop_keyword = document.getElementById('stoploc').value;
	
	// Find soutwest corner of the bounded region we will be searching
	var southwest = {
		lat: Math.min(origin_place.geometry.location.lat(), dest_place.geometry.location.lat()),
		lng: Math.min(origin_place.geometry.location.lng(), dest_place.geometry.location.lng())
	};
	
	// Find northeast corner of the bounder region we will be searching
	var northeast = {
		lat: Math.max(origin_place.geometry.location.lat(), dest_place.geometry.location.lat()),
		lng: Math.max(origin_place.geometry.location.lng(), dest_place.geometry.location.lng())
	};
	
	// Create a place service variable to perform a radar search
	var service = new google.maps.places.PlacesService(map);
	service.radarSearch({
		//bounds: new google.maps.LatLngBounds(southwest, northeast),
		bounds: map.getBounds(),
		keyword: stop_keyword
	}, addCandidates);
} // End findStopOff



/*
	Function that stores all of the potential stop off locations in an array
	and then sorts the array by distance from the path. This is the callback
	function that is used for the radar search. Due to the limitations of the
	Google Maps API, only the 9 closest potential stop-off locations are stored
	in the array for the next step in the algorithm.
	
	@param results is a Google Maps API object that stores the information
		returned by the radar search.
	@param status is the status code returned by the radar search.
*/
function addCandidates(results, status) {
	// Check status of the search
	if (status === google.maps.places.PlacesServiceStatus.OK) {
		// Loops through each result of the search and adds an element to the candidate array
		for (var i = 0; i < results.length; ++i) {
			stopCandidates.push(results[i]);
		}

		// Sort locations by distance to path
		stopCandidates.sort(function(x, y) {
			if(getShortestDist(x) < getShortestDist(y)) {
				return -1;
			}
			else if(getShortestDist(x) > getShortestDist(y)) {
				return 1;
			}
			else {
				return 0;
			}
		});
		
		// Only keep the desired number of locations
		while(stopCandidates.length > numCandidates) {
			stopCandidates.pop();
		}
		
		// Calculate total trip distance for each potential stop off location and display the top 5
		getTotalDist();
	}
	else {
		alert(status);
	}
} // End addCandidates



/*
	Function that calculates the shortest distance between the indicated
	location and one of the points along the path. It is used to sort the
	results of the radar search by their distance to the path.
	
	@param searchLoc is a Google Maps API object that stores information
		one of the locations returned by the radar search.
	@return The shortest distance in meters to the path.
*/
function getShortestDist(searchLoc) {
	var shortestDist;
	var compareDist;
	
	shortestDist = google.maps.geometry.spherical.computeDistanceBetween(pathPoints[0], searchLoc.geometry.location);
	
	// Find the shortest distance to the path
	for(var i = 1; i < pathPoints.length; ++i) {
		compareDist = google.maps.geometry.spherical.computeDistanceBetween(pathPoints[i], searchLoc.geometry.location);
		if(compareDist < shortestDist) {
			shortestDist = compareDist;
		}
	}
	
	return shortestDist;
} // End getShortestDist



/*
	Function that calculates the total distance for the entire trip through
	each candidate location. It uses the distance matrix to calculate the
	distances for each location. Only the 5 locations with the shortest
	overall path is kept and displayed to the user.
*/
function getTotalDist() {

	// Obtain list of origins and destinations
	var orgs = [];
	var dests = [];
	
	orgs.push(origin_place.geometry.location);
	for(var i = 0; i < stopCandidates.length; ++i) {
		orgs.push(stopCandidates[i].geometry.location);
	}
	
	for(var i = 0; i < stopCandidates.length; ++i) {
		dests.push(stopCandidates[i].geometry.location);
	}
	dests.push(dest_place.geometry.location);
	
	// Use a distance matrix to compute the total trip distance
	var matService = new google.maps.DistanceMatrixService();
	matService.getDistanceMatrix(
		{
			origins: orgs,
			destinations: dests,
			travelMode: google.maps.TravelMode.DRIVING
		}
		, function(response, status) {
			if (status == google.maps.DistanceMatrixStatus.OK) {
				// Store the total distance for each candidate into a new array
				candDetails = [];
				for(var i = 0; i < stopCandidates.length; ++i) {
					candDetails.push([ stopCandidates[i],
						response.rows[0].elements[i].distance.value
						+ response.rows[i+1].elements[stopCandidates.length].distance.value
					]);
				}
				
				// Sort the array based on the total trip distance
				candDetails.sort(function(x, y) {
					if(x[1] < y[1]) {
						return -1;
					}
					else if(x[1] > y[1]) {
						return 1;
					}
					else {
						return 0;
					}
				});
				
				// Only keep the top 5 locations
				while(candDetails.length > 5) {
					candDetails.pop();
				}
				
				// Display the top 5 locations to the user
				dispTop5();
			}
			else {
				alert(status);
			}
		}
	);
} // End getTotalDist



/*
	Function that displays the top 5 stop off location candidates to the user.
*/
function dispTop5() {
	// Input distances and names into the correct DOM locations
	for(var i = 0; i < 5; ++i) {
		// Convert added distance from meters to miles
		document.getElementById("dist" + (i+1)).innerHTML = Math.round((candDetails[i][1] - initialDist) * 0.000621371 * 100) / 100 + " mi";
	}

	// Add additional details for each location and display them to the screen
	for(var i = 0; i < 5; ++i) {
		addLocDetails(i);
	}

	// Remove any markers from the map
	removeMarkers();
	
	// Place markers on the map for the five candidates
	for(var i = 0; i < candDetails.length; ++i) {
		createMarker(candDetails[i][0]);
	}
	
	// Display the section on the webpage to select the suggested stop off location
	document.getElementById('stopsel').style.display = 'block';
} // End dispTop5



/*
	Function that uses a PlacesService to get additional details for the
	indicated candidate location. This information is displayed to the user
	to aid them in selection.

	@param index is the index of the location in the candDetails array.
*/
function addLocDetails(index) {
	var infoServ = new google.maps.places.PlacesService(map);
	infoServ.getDetails(candDetails[index][0], function(result, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			document.getElementById("det" + (index+1)).innerHTML = "<b>" + result.name + "</b>,&nbsp;" + result.formatted_address;
		}
		else {
			alert(status);
		}
	});
} // End addLocDetails



/*
	Function that displays the directions with the indicated stop off location
	added to the route.
	
	@param index is the index of the user's selected stop-off location in the 
		candDetails array.
*/
function addStop(index) {
	// Remove markers from map
	removeMarkers();
	
	// Create request for directions including the stop off location
	var request = {
		origin: origin_place.geometry.location,
		destination: dest_place.geometry.location,
		waypoints: [ {location: candDetails[index-1][0].geometry.location, stopover: false} ],
		travelMode: google.maps.TravelMode.DRIVING
	};

	// Display the directions on the map
	directionsDisplay.setMap(map);
	directionsService.route(request, function(result, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(result);
			
			// Create string that contains all of the necessary instructions
			var instructionsStr = "<h3>Directions</h3><table class=\"table table-bordered table-condensed\"><tr><th>Step</th><th>Instructions</th><th>Distance</th></tr>"
			for(var i = 0; i < result.routes[0].legs[0].steps.length; ++i) {
				instructionsStr = instructionsStr + "<tr><td>" + (i+1) + ".</td><td>" + result.routes[0].legs[0].steps[i].instructions
					+ "</td><td>" + result.routes[0].legs[0].steps[i].distance.text + "</td></tr>";
			}
			instructionsStr = instructionsStr + "</table>";
			
			// Insert instructions onto webpage
			document.getElementById('instructions').innerHTML = instructionsStr;
		}
		else {
			alert(status);
		}
	});
	
	// Create a marker for the selected stop off location
	createMarker(candDetails[index-1][0]);
	
	// Display the disclaimer
	document.getElementById('scrollNote').style.display = 'block';
} // End addStop



// Event handler for selection 1
function addStop1() {
	addStop(1);
}



// Event handler for selection 2
function addStop2() {
	addStop(2);
}



// Event handler for selection 3
function addStop3() {
	addStop(3);
}



// Event handler for selection 4
function addStop4() {
	addStop(4);
}



// Event handler for selection 5
function addStop5() {
	addStop(5);
}



// Event handler for reresh button
function refreshPage() {
	location.reload();
}



/*
	Function that creates a marker on the map and assigsn it an onclick
	handler to display the name and address of the location.
	
	@param place is Google Maps API place object.
*/
function createMarker(place) {
	var marker = new google.maps.Marker({
		map: map,
		position: place.geometry.location
	});
	markers.push(marker);
	google.maps.event.addListener(marker, 'click', function() {
		var infoServ = new google.maps.places.PlacesService(map);
		infoServ.getDetails(place, function(result, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				infowindow.setContent("<b>" + result.name + "</b><br/>" + result.formatted_address);
				infowindow.open(map, marker);
			}
			else {
				alert(status);
			}
		});
	});
} // End createMarker



/*
	Function that removes all markers from the map.
*/
function removeMarkers() {
	for(var i = 0; i < markers.length; ++i) {
		markers[i].setMap(null);
	}
} // End removeMarkers
