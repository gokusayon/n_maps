var map;
var clientID = 'T2QWMSK245PKMKIMQV152GJSNDRFVVXPH4P5AECAUFCE4GKF';
var clientSecret = 'ZJL4KRUOW4AYO4PDFX3SZCPCEUUUFRQWQMR1FJ0VYZD3YRGI';

// Create a new blank array for all the default locations.
var markers = [];

function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 28.6139391, lng: 77.2090212 },
        zoom: 13,
        mapTypeControl: false
    });

    // These are the real estate listings that will be shown to the user.
    // Normally we'd have these in a database instead.
    var locations = [
        { title: 'Rashtrapati Bhavan', location: { lat: 28.6144, lng: 77.1996 } },
        {
            title: 'National Zoological Park',
            location: {
                "lat": 28.6030,
                "lng": 77.2465
            }
        }, {
            title: 'Khan Market',
            location: {
                "lat": 28.6001,
                "lng": 77.2270
            }
        }, {
            title: 'Jawaharlal Nehru Stadium',
            location: {
                "lat": 28.5828,
                "lng": 77.2344
            }
        }, {
            title: 'India Gate',
            location: {
                "lat": 28.6129,
                "lng": 77.2295
            }
        }
    ];

    var largeInfowindow = new google.maps.InfoWindow();

    // The following group uses the location array to create an array of markers on initialize.
    for (var i = 0; i < locations.length; i++) {
        // Get the position from the location array.
        var position = locations[i].location;
        var title = locations[i].title;
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            id: i
        });
        // Push the marker to our array of markers.
        markers.push(marker);
        // Create an onclick event to open an infowindow at each marker.
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
        });
    }
}

// This function is used to get info from third party api 
// and populate infoWindow for map
function getDataFromFourSquare(latlng, query) {
    var deferred = $.Deferred();

    var url = 'https://api.foursquare.com/v2/venues/search?ll=' + latlng.lat() + ',' + latlng.lng() +
        '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118&query=' + query;

    var promise = $.ajax({
        type: 'POST',
        dataType: 'json',
        url: url,
        success: function(data) {
            var response = {
                url:'',
                street:'',
                city:'',
                phone:'',
                name:''
            };
            var results = data.response.venues[0];
            response.url = results.url;
            if (typeof response.url === 'undefined') {
                response.url = "";
            }
            response.street = results.location.formattedAddress[0];
            response.city = results.location.formattedAddress[1];
            response.phone = results.contact.phone;
            response.name = results.name;
            if (typeof response.phone === 'undefined') {
                response.phone = "";
            } else {
                response.phone = response.phone;
            }

            deferred.resolve({ status: true, response: response });
        }
    });

    // $.getJSON(foursquareURL).done(function(data) {


    return deferred.promise();

}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        // Clear the infowindow content to give the streetview time to load.
        infowindow.setContent('<div id="pano"></div>');

        getDataFromFourSquare(marker.position, marker.title).then(function(data) {
            if (data.status) {


                infowindow.setContent('<div><div class="title"><b>' + data.response.name + "</b></div>" +
                    '<div class="content"><a href="' + data.response.url + '">' + data.response.url + "</a></div>" +
                    '<div class="content">' + data.response.street + "</div>" +
                    '<div class="content">' + data.response.city + "</div>" +
                    '<div class="content">' + data.response.phone + '</div></div><div id="pano"></div>');

                // infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');

            } else {
                infowindow.setContent('<div class="title">' + marker.title + '</div><div id="pano"></div>');
            }
            infowindow.marker = marker;
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });
            var streetViewService = new google.maps.StreetViewService();
            var radius = 100;
            // In case the status is OK, which means the pano was found, compute the
            // position of the streetview image, then calculate the heading, then get a
            // panorama from that and set the options
            function getStreetView(data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
                    var nearStreetViewLocation = data.location.latLng;

                    var heading = google.maps.geometry.spherical.computeHeading(
                        nearStreetViewLocation, marker.position);
                    var panoramaOptions = {
                        position: nearStreetViewLocation,
                        pov: {
                            heading: heading,
                            pitch: 30
                        }
                    };
                    var panorama = new google.maps.StreetViewPanorama(
                        document.getElementById('pano'), panoramaOptions);
                } else {
                    infowindow.setContent('<div>' + marker.title + '</div>' +
                        '<div>No Street View Found</div>');
                }
            }
            // Use streetview service to get the closest streetview image within
            // 50 meters of the markers position
            streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
            // Open the infowindow on the correct marker.
            infowindow.open(map, marker);
        });

    }
}

function hideListings(array) {
    for (var i = 0; i < array.length; i++) {
        array[i].setMap(null);
    }
}

// This function takes in address value and returns the 
//geocoding for the place.
function zoomToArea(addressValue) {
    var deferred = $.Deferred();
    // Initialize the geocoder.
    var geocoder = new google.maps.Geocoder();
    // Get the address or place that the user entered.
    var address = addressValue;
    // Make sure the address isn't blank.
    if (address === '') {
        window.alert('You must enter an area, or address.');
        deferred.reject({ status: false, 'results': [] });
    } else {
        // Geocode the address/area entered to get the center. Then, center the map
        // on it and zoom in
        geocoder.geocode({
            address: address,
            componentRestrictions: { country: 'India', locality: 'New Delhi' }
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                // map.setCenter(results[0].geometry.location);
                // map.setZoom(15);
                deferred.resolve({ status: true, results: results });
            } else {
                deferred.reject({ status: false, 'results': [] });
                window.alert('We could not find that location - try entering a more' +
                    ' specific place.');
            }
        });
    }

    return deferred.promise();
}


// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}