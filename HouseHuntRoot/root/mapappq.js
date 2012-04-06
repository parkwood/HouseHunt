HH = (function(){
	var backToSearch = function(){
		$('#map_results').fadeOut();
		$('#splash').fadeIn();
	};
	
	var searchOnMap = function(where,type){
		$('#splash').fadeOut();
		$('#map_results').fadeIn();
		doAjax('http://api.nestoria.co.uk/api?country=uk&pretty=0&radius=5km&action=search_listings&place_name='+where+'&encoding=json&listing_type='+type,
				function(data){
				if(!data.response.locations && !data.response.listings){
					$('#error').html("<center><h1 class='simple floating'>No Results</h1> <br> Please try to broaden your search</center>");
					$('#map_results').fadeOut();
					$('#error').fadeIn().delay(2000).fadeOut();
					$('#splash').fadeIn();									
				}
				else{
				var center = data.response.locations[0]
				var latlng = new google.maps.LatLng(center.center_lat, center.center_long);
				
					 MAPAPP.draw(latlng, 13);
					 
					 $(data.response.listings).each(function(){
					    MAPAPP.addMarker(new google.maps.LatLng(this.latitude,this.longitude),this.summary);
					 })  
					 
				}
				});
			  
			    // update the map display
			    MAPAPP.updateDisplay();

	}
	
	
	return {searchOnMap:searchOnMap,
		backToSearch:backToSearch
	};
})();

MAPAPP = (function() {
    // initailise constants
    var DEFAULT_ZOOM = 8;
    
    // initialise variables
    var map = null,
        mainScreen = true,
        markers = [],
        markerContent = {};
        
    function activateMarker(marker) {
        // iterate through the markers and set to the inactive image
        for (var ii = 0; ii < markers.length; ii++) {
            markers[ii].setIcon('img/pin-inactive.png');
        } // for
        
        // update the specified marker's icon to the active image
        marker.setIcon('img/pin-active.png');
            
        // update the navbar title using jQuery
        $('#marker-nav .marker-title')
            .html(marker.getTitle())
            .removeClass('has-detail')
            .unbind('click');
            
        // if content has been provided, then add the has-detail
        // class to adjust the display to be "link-like" and 
        // attach the click event handler
        var content = markerContent[marker.getTitle()];
        if (content) {
            $('#marker-nav .marker-title')
                .addClass('has-detail')
                .click(function() {
                    $('#marker-detail .content').html(content);
                    showScreen('marker-detail');
                });
        } // if
        
        // update the marker navigation controls
        updateMarkerNav(getMarkerIndex(marker));
    } // activateMarker
        
    function addMarker(position, title, content) {
        // create a new marker to and display it on the map
        var marker = new google.maps.Marker({
            position: position, 
            map: map,
            title: title,
            icon: 'img/pin-inactive.png'
        });
        
        // save the marker content
        markerContent[title] = content;
        
        // add the marker to the array of markers
        markers.push(marker);
        
        // capture touch click events for the created marker
        google.maps.event.addListener(marker, 'click', function() {
            // activate the clicked marker
            activateMarker(marker);
        });
    } // addMarker
    
    function clearMarkers() {
        for (var ii = 0; ii < markers.length; ii++) {
            markers[ii].setMap(null);
        } // for
        
        markers = [];
    } // clearMarkers
    
    function getMarkerIndex(marker) {
        for (var ii = 0; ii < markers.length; ii++) {
            if (markers[ii] === marker) {
                return ii;
            } // if
        } // for 
        
        return -1;
    } // getMarkerIndex
    
    function initScreen() {
        // watch for location hash changes
        //setInterval(watchHash, 10);

        // next attach a click handler to all close buttons
        $('button.close').click(showScreen);
    } // initScreen
    
    function showScreen(screenId) {
        mainScreen = typeof screenId !== 'string';
        if (typeof screenId === 'string') {
            $('#' + screenId).css('left', '0px');

            // update the location hash to marker detail
            window.location.hash = screenId;
        }
        else {
            $('div.child-screen').css('left', '100%');
            window.location.hash = '';
        } // if..else
        
        scrollTo(0, 1);
    } // showScreen
    
    function sortMarkers() {
        // sort the markers from top to bottom, left to right
        // remembering that latitudes are less the further south we go
        markers.sort(function(markerA, markerB) {
            // get the position of marker A and the position of marker B
            var posA = markerA.getPosition(),
                posB = markerB.getPosition();

            var result = posB.lat() - posA.lat();
            if (result === 0) {
                result = posA.lng() - posB.lng();
            } // if
            
            return result;
        });
    } // sortMarkers
    
    function updateMarkerNav(markerIndex) {
        
        // find the marker nav element
        var markerNav = $('#marker-nav');
        
        // reset the disabled state for the images and unbind click events
        markerNav.find('img')
            .addClass('disabled')
            .unbind('click');
            
        // if we have more markers at the end of the array, then update
        // the marker state
        if (markerIndex < markers.length - 1) {
            markerNav.find('img.right')
                .removeClass('disabled')
                .click(function() {
                    activateMarker(markers[markerIndex + 1]);
                });
        } // if
        
        if (markerIndex > 0) {
            markerNav.find('img.left')
                .removeClass('disabled')
                .click(function() {
                    activateMarker(markers[markerIndex - 1]);
                });
        } // if
    } // updateMarkerNav
    
    function watchHash() {
        // this function monitors the location hash for a reset to empty
        if ((! mainScreen) && (window.location.hash === '')) {
            showScreen();
        } // if
    } // watchHash

    var init = function(myOptions) {
     

        // initialise the map
        map = new google.maps.Map(
            document.getElementById("map_canvas"),
            myOptions);
            
        
    };
    var module = {
        addMarker: addMarker,
        clearMarkers: clearMarkers,
        draw:function(position, zoomLevel){
        	   // define the required options
            var myOptions = {
                zoom: zoomLevel ? zoomLevel : DEFAULT_ZOOM,
                center: position,
                mapTypeControl: false,
                streetViewControl: false,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
        	if(map){
        		clearMarkers();
        		map.panTo(position)
        	}
        	else{
        		init(myOptions)
        	}
        },
        
        
        updateDisplay: function() {
        	//google.maps.event.trigger(map,'resize');
            // get the first marker
            var firstMarker = markers.length > 0 ? markers[0] : null;
            
            // sort the markers
            sortMarkers();

            // if we have at least one marker in the list, then 
            // initialize the first marker
            if (firstMarker) {
                activateMarker(firstMarker);
            } // if
        }
    };
    
    return module;
})();