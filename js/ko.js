/*jshint -W083 */
// Blank array for all the filtered markers
var markers_filter = [];


function resizeMap() {
    try {
        document.getElementById("map");
        google.maps.event.trigger(map, "resize");
    } catch (err) {
        console.log("unable to trigger resize");
    }
}

// This function is used for class bindings
function ViewModel() {
    var self = this;

    // If the filter window is to be shown
    self.shouldShowMessage = ko.observable(true);

    //  click binding for showing filter location pane
    self.showWindow = function() {
        self.shouldShowMessage(!self.shouldShowMessage());
        resizeMap();
    };

    // returns class for left pane
    self.optionStatus = ko.pureComputed(function() {
        var width = $(window).width();
        if (width > 529) {
            return self.shouldShowMessage() ? "options-box" : "options-box-hide";
        } else {

            return self.shouldShowMessage() ? "options-box" : "options-box-hide-with-filter";
        }
    }, ViewModel);

    //returns class for right pane 
    self.mapStatus = ko.pureComputed(function() {

        var width = $(window).width();

        if (width > 529) {
            return self.shouldShowMessage() ? "map_wrapper" : "map-only";
        } else {
            return !self.shouldShowMessage() ? "map_wrapper-with-filter" : "map_wrapper";
        }
    }, ViewModel);
}

//This function is used for binding user data such as filtered location.
function MapsModel() {
    var self = this;

    // This variable is used for binding input text for filter search
    self.filterLocation = ko.observable();

    // True if left pane visible 
    self.isListVisible = ko.observable(false);

    self.defaultItems = ko.observableArray(default_locations);

    self.setMarkerForDefaultList = function() {
        var largeInfowindow = new google.maps.InfoWindow();

        // hideListings(markers_filter)
        self.hideListings();

        var defaultIcon = makeMarkerIcon('0091ff');
        var marker = new google.maps.Marker({
            position: this.location,
            title: this.title,
            animation: google.maps.Animation.DROP,
            id: 1,
            map: map,
            icon: defaultIcon,
            optimized: false // stops the marker from flashing
        });

        // Create a "highlighted location" marker color for when the user
        // mouses over the marker.
        var highlightedIcon = makeMarkerIcon('FFFF24');

        // Two event listeners - one for mouseover, one for mouseout,
        // to change the colors back and forth.
        marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });
        marker.addListener('click', function() {
            populateInfoWindow(marker, largeInfowindow);
        });

        map.setCenter(this.location);
        map.setZoom(15);

        markers_filter.push(marker);

        populateInfoWindow(marker, largeInfowindow);

    };
    // List of all the location for `self.fliterLocation` 
    self.items = ko.observableArray();

    // Sanity check 
    self.throttledFilterLocation = ko.computed(self.filterLocation)
        .extend({
            rateLimit: {
                timeout: 500,
                method: "notifyWhenChangesStop"
            }
        });

    self.filterDefaultLocation = ko.observable('');

    // Used to filter default locations from the `self.defaultItems`. This is case sensitive.
    this.filterDefaultLocationList = ko.computed(function() {

        return ko.utils.arrayFilter(self.defaultItems(), function(item) {
            if (self.filterDefaultLocation() == undefined)
                return true;
            else if (item.title.indexOf(self.filterDefaultLocation()) === -1)
                return false;
            else
                return true;
        });
    });

    this.filterDefaultLocationList.subscribe(function(list) {
        // var marker_filter = [];
        // 
        // markers_filter = [];
        var defaultIcon = makeMarkerIcon('0091ff');
        var highlightedIcon = makeMarkerIcon('FFFF24');
        var largeInfowindow = new google.maps.InfoWindow();
        var filteredDefaultmarkerList = [];
        for (var index = 0; index < list.length; index++) {
            var position = list[index].location;
            var title = list[index].title;
            // Create a marker per location, and put into markers array.
            var marker = new google.maps.Marker({
                position: position,
                title: title,
                animation: google.maps.Animation.DROP,
                id: index,
            });
            marker.addListener('click', function onClickFunction() {
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

            // marker.setMap(map);

            filteredDefaultmarkerList.push(marker);

            // self.items.push(marker);
        }

        self.hideListings();
        showListings(filteredDefaultmarkerList);
    });

    // Fetches locations using google maps api and populates the `markers_filter`.
    // This function waits untill user has finished typing.
    self.throttledFilterLocation.subscribe(function(newValue) {
        self.filterDefaultLocation('');
        if (self.filterLocation().length <= 0) {
            return;
        }

        self.hideListings();

        self.items([]);
        markers_filter = [];

        // Return the geocoding for filtered locations
        zoomToArea(newValue).then(function(response) {
            if (response.status) {

                var list = response.results;

                var defaultIcon = makeMarkerIcon('0091ff');
                var largeInfowindow = new google.maps.InfoWindow();

                // Create a "highlighted location" marker color for when the user
                // mouses over the marker.
                var highlightedIcon = makeMarkerIcon('FFFF24');

                for (var index = 0; index < list.length; index++) {
                    var add;
                    var item = {
                        location: list[index].geometry.location,
                        address: list[index].formatted_address
                    };

                    var marker = new google.maps.Marker({
                        position: list[index].geometry.location,
                        title: list[index].address_components[0].short_name,
                        animation: google.maps.Animation.DROP,
                        id: index,
                        icon: defaultIcon,
                        optimized: false // stops the marker from flashing
                    });

                    marker.addListener('click', function onClickFunction() {
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

                    markers_filter.push(marker);

                    self.items.push(marker);
                }

                showListings(markers_filter);
                self.isListVisible(true);
            } else {
                alert('Ooppsss, Something Went wrong!!');
            }
        });
    });

    // List Item that is selected
    self.selectedItem = function() {
        var location = {
            lat: this.position.lat(),
            lng: this.position.lng()
        };

        // populateInfoWindow(this,google.maps.InfoWindow());
        // this.trigger('click');
        map.setCenter(location);
        map.setZoom(15);

        var event = new google.maps.event.trigger(this, 'click');
        self.items([]);
        self.isListVisible(false);
        self.filterLocation('');
    };

    // Binding to show listings
    self.showListings = function() {
        self.filterLocation('');
        // if (markers_filter.length)
        //     showListings(markers_filter);

        hideListings(markers);

        if (markers_filter.length)
            hideListings(markers_filter);
        showListings(markers);

    };

    //Binding to hide listings
    self.hideListings = function() {

        if (markers.length) {
            hideListings(markers);

        }
        // If filtered locations are present then clear
        if (markers_filter.length) {
            hideListings(markers_filter);
            markers_filter = [];
            self.items([]);
            self.isListVisible(false);
            // self.filterLocation('');
        }
    };
}

var RootModel = {
    view: new ViewModel(),
    maps: new MapsModel()
};
ko.applyBindings(RootModel);

$(window).resize(function() {
    resizeMap();
});