// original by Enterprisey [[:en:User:Enterprisey]]
// https://en.wikipedia.org/w/index.php?oldid=732756722 version this is based
// https://en.wikipedia.org/w/index.php?title=User:Enterprisey/watchlist-notice.js current
// Script to warn of new changes to watched pages.
// Adds an notice besides the notification icon and adds a badge to the favicon.
// In chrome the favicon is seen in the tabs. 
var Favico, favicon;
mw.loader.using( 'mediawiki.util', function () {
	
	mw.loader.load('https://cdnjs.cloudflare.com/ajax/libs/favico.js/0.3.10/favico.min.js');
	var showNotice = function () {
 
		// Stick a "Watchlist update!" notice after the notification count
		$( "#pt-notifications-notice" ).after(
        	$( "<li>" ).append( $( "<a>" )
        		.text( "Watchlist update!" )
        		.css( {
        			"background-color": "green",
        			"color": "white",
        			"border-radius": "2px",
        			"padding": "0.25em 0.45em 0.2em",
        			"cursor": "pointer",
        			"font-weight": "bold",
        			"transition": "background-color 0.5s"
        		} )
        		.attr( "href", "/wiki/Special:Watchlist" )
        		.mouseover( updateNotice )
        	)
        	.attr( "id", "watchlist-update-notice" )
        );
		if (Favico != undefined && favicon === undefined) {
			favicon = new Favico({
				animation:'none'
			});
		} if (favicon != undefined) {
			favicon.badge(1);
		}
	};
	
	var updateNotice = function() {
		// Lighten the background color so the user knows we're updating
		$( "#watchlist-update-notice a" ).css( "background-color", "#7bff7b" );
		
		// Update the notice
		$.getJSON(
    		mw.util.wikiScript( 'api' ),
    		{
    			format: "json",
    			action: "query",
    			list: "watchlist",
    			wlshow: "unread",
    			wllimit: 1 // Because we're checking if there are *any* entries
    		} ).done(function( data ) {
    			if( !data.query ) return;
    			if( data.query.watchlist.length ) {
 
    				// There are new watchlist diffs to read, so show notice
    				if( !$( "#watchlist-update-notice" ).length ) {
    					
    					// That is, if it isn't shown already
    					showNotice();
    				} else {
    					
    					// There's already a notice, so change background
    					$( "#watchlist-update-notice a" ).css( "background-color", "green" );
    				}
    			} else {
    				
    				// No new watchlist diffs to read, so hide notice
    				$( "#watchlist-update-notice" ).remove();
					if (favicon) {
						favicon.reset();
					}
    			}
    		}
    	);
	};
 
    $( document ).ready( function () { 
	    updateNotice();
	    window.setInterval( updateNotice, 120000 );
    } );
} );
