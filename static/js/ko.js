function resizeMap() {
    document.getElementById("map");
    google.maps.event.trigger(map, "resize");
}

function viewModel() {
    var self = this;
    self.shouldShowMessage = ko.observable(true);
    self.incrementClickCounter = function() {
        self.shouldShowMessage(!self.shouldShowMessage());
        
    }
    self.optionStatus = ko.pureComputed(function() {
        return self.shouldShowMessage() ? "options-box" : "options-box-hide";
    }, viewModel);
    self.mapStatus = ko.pureComputed(function() {
        return self.shouldShowMessage() ? "map_wrapper" : "map-only";
    }, viewModel);
};

var markers_filter = [];

// This function will loop through the markers array and display them all.
function showListings(value) {
    
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < value.length; i++) {
        value[i].setMap(map);
        bounds.extend(value[i].position);
    }
    map.fitBounds(bounds);
}

function mapsModel() {
    var self = this;
    self.filterLocation = ko.observable();
    self.isListVisible = ko.observable(false);
    self.items = ko.observableArray();
    self.throttledFilterLocation = ko.computed(self.filterLocation).extend({ throttle: 1200 });
    self.throttledFilterLocation.subscribe(function(newValue) {

        self.items([]);
        markers_filter = [];
        // zoomToArea(newValue)
        // console.log(newValue)
        zoomToArea(newValue).then(function(response) {
            if (response.status) {

                var list = response.results;

                var largeInfowindow = new google.maps.InfoWindow();
                var defaultIcon = makeMarkerIcon('0091ff');

                // Create a "highlighted location" marker color for when the user
                // mouses over the marker.
                var highlightedIcon = makeMarkerIcon('FFFF24');

                
                for (var index in list) {
                    var add
                    var item = {
                        location: list[index].geometry.location,
                        address: list[index].formatted_address
                    }
                    
                    var marker = new google.maps.Marker({
                        position: list[index].geometry.location,
                        title: list[index].formatted_address,
                        animation: google.maps.Animation.DROP,
                        id: index
                    });

                    markers_filter.push(marker);
                    marker.addListener('click', function() {
                        populateInfoWindow(this, largeInfowindow);
                    }); 
                    // Two event listeners - one for mouseover, one for mouseout,
                    // to change the colors back and forth.
                    marker.addListener('mouseover', function() {
                        this.setIcon(highlightedIcon);
                    });
                    marker.addListener('mouseout', function() {
                        this.setIcon(defaultIcon);
                    });
                    self.items.push(item);
                }

                showListings(markers_filter);
                self.isListVisible(true);
            } else {
                alert('Ooppsss, Something Went wrong!!')
            }
        });
    });
    self.selectedItem = function() {
        var location = { lat: this.location.lat(), lng: this.location.lng() }

        map.setCenter(location);
        map.setZoom(15);
        // var marker = new google.maps.Marker({
        //     position: location,
        //     map: map,
        //     title: this.address,
        //     animation: google.maps.Animation.DROP,
        //     id: 1
        // });
        self.items([]);
        self.isListVisible(false);
    }

    self.showListings = function(){
        showListings(markers)
    }
    self.hideListings = function(){
        hideListings(markers)
    }
};

// var myObservableArray = ko.observableArray(); 

var rootModel = {
    view: new viewModel(),
    maps: new mapsModel()
}
ko.applyBindings(rootModel);
// ko.applyBindings(new mapsModel());