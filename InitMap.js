// Variable to create map
var map;
var csulb = {lat: 33.783, lng: -118.114};
var numPoints = 20;
var result;
var searchRadius = 1000; // meters

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
var pathPoints;
var stopCandidates;

var infowindow;

// Initializes the map area and assigns autocomplete functions to text boxes
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
	
	// Apply handler to the Find Route button
	document.getElementById('findRoute').onclick = findRoute;
	document.getElementById('findStop').onclick = findStopOff;
	
	infowindow = new google.maps.InfoWindow();
}

// Retrieves the origin and destination points from the textboxes and displays the route on the map
function findRoute() {
	// Capture the origin and destination from the textboxes
	var origin_place = autocomp_origin.getPlace();
	var dest_place = autocomp_dest.getPlace();
	
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
			directionsDisplay.setDirections(result);
			getPointsOnPath(result);
		}
		else {
			alert(status);
		}
	});
	
	// Display the section on the webpage to enter a stop-off location
	document.getElementById('stopsec').style.display = 'block';
}

// Returns desired number of points along the path and stores them in an array
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

	/*
	// Display markers (for testing purposes)
	for(index = 0; index < pathPoints.length; ++index) {
		marker = new google.maps.Marker({
			position: pathPoints[index],
			map: map,
		});
	}
	*/
}

// Function that searches all of the points along the path for potential stop off locations
function findStopOff() {
	var index;
	
		// Display the section on the webpage to select the suggested stop off location
	document.getElementById('stopsel').style.display = 'block';
	
	// Clear out array that stores the potential stop locations
	stopCandidates = [];
	
	// Retrieve the search keyword from the textbox
	stop_keyword = document.getElementById('stoploc').value;
	
	// Create a place service variable
	var service = new google.maps.places.PlacesService(map);
	
	/*
	// Loop through every point along the path and perform a search
	for(index = 0; index < pathPoints.length; ++index) {
		service.textSearch({
			location: pathPoints[index],
			radius: searchRadius,
			query: stop_keyword,
			rankBy: google.maps.places.RankBy.DISTANCE
		}, addPoints); // Points are added to the candidate array using this callback function
	}
	*/
}

// Function that takes the result of a text search and computes the total distance of the trip
// that passes through each point that is returned
function addPoints(results, status) {
	// Check status of the text search
	if (status === google.maps.places.PlacesServiceStatus.OK) {
		// Loop through each result of the search and adds an element to the candidate array
		for (var i = 0; i < results.length; i++) {
			
		}
	}
	else {
		alert(status);
	}
}

function createMarker(place) {
	var placeLoc = place.geometry.location;
	var marker = new google.maps.Marker({
		map: map,
		position: place.geometry.location
	});
	google.maps.event.addListener(marker, 'click', function() {
		infowindow.setContent(place.name);
		infowindow.open(map, this);
	});
}
