 $( document ).ready( function () { 
(function (mw) {if (mw.config.get('wgNamespaceNumber') === -1) {
	mw.loader.using(['ext.thanks',  'jquery.confirmable', 'oojs-ui-core', 'oojs-ui-windows']).then(function () {
		mw.config.set( 'thanks-confirmation-required', true );
        tlw = {}
		tlw.addLinks = function () {
            var regex = /[?&]([^=#]+)=([^&#]*)/g,
			diffs;
            // mw.hook( 'wikipage.content' ).remove(tlw.addLinks);
            diffs = $('.mw-changeslist-diff');
            diffs.each(function (i, diff) {
                var url = diff.href,
                    match;
                while(match = regex.exec(url)) {
                    diff[match[1]] = match[2];
                }
                if (! $(diff).attr('data-thanks-link') || $(diff).attr('data-thanks-link') === 'false') {
                    $thankLink = $('<a class="mw-thanks-thank-link" title="Envie um agradecimento para este utilizador">agradecer</a>')
                        .attr('href',"//"+ window.location.host + "/wiki/Special:Thanks/" + diff.diff)
                        .attr('data-revision-id', diff.diff);
                    $thankLink.insertAfter(diff);
                    $(document.createTextNode(' | ')).insertAfter(diff);
                    $(diff).attr('data-thanks-link', 'True')
                }
            });
        }
        tlw.addLinks();
        mw.hook( 'wikipage.content' ).add(tlw.addLinks);
        mw.loader.implement("ext.thanks.thankswatchlist", function ( ) {
            var $content = $('#content');
            function reloadThankedState() {
                $( 'a.mw-thanks-thank-link' ).each( function ( idx, el ) {
                    var $thankLink = $( el );
                    if ( mw.thanks.thanked.contains( $thankLink ) ) {
                        $thankLink.before( mw.msg( 'thanks-thanked' ) );
                        $thankLink.remove();
                    }
                } );
            }

            // $thankLink is the element with the data-revision-id attribute
            // $thankElement is the element to be removed on success
            function sendThanks( $thankLink, $thankElement ) {
                var source;

                if ( $thankLink.data( 'clickDisabled' ) ) {
                    // Prevent double clicks while we haven't received a response from API request
                    return false;
                }
                $thankLink.data( 'clickDisabled', true );

                if ( mw.config.get( 'wgAction' ) === 'history' ) {
                    source = 'history';
                } else {
                    source = 'diff';
                }

                ( new mw.Api ).postWithToken( 'csrf', {
                    action: 'thank',
                    rev: $thankLink.attr( 'data-revision-id' ),
                    source: source
                } )
                .then(
                    // Success
                    function ( data ) {
                        var username = $thankLink.closest(
                                source === 'history' ? 'li' : 'td'
                            ).find( 'a.mw-userlink' ).text();
                        // Get the user who was thanked (for gender purposes)
                        return mw.thanks.getUserGender( username );
                    },
                    // Fail
                    function ( errorCode, details ) {
                        // If error occured, enable attempting to thank again
                        $thankLink.data( 'clickDisabled', false );
                        switch ( errorCode ) {
                            case 'invalidrevision':
                                OO.ui.alert( mw.msg( 'thanks-error-invalidrevision' ) );
                                break;
                            case 'ratelimited':
                                OO.ui.alert( mw.msg( 'thanks-error-ratelimited', mw.user ) );
                                break;
                            default:
                                OO.ui.alert( mw.msg( 'thanks-error-undefined', errorCode ) );
                        }
                    }
                )
                .then( function ( recipientGender ) {
                    $thankElement.before( mw.message( 'thanks-thanked', mw.user, recipientGender ).escaped() );
                    $thankElement.remove();
                    mw.thanks.thanked.push( $thankLink );
                } );
            }

            function addActionToLinks( $content ) {
                if ( mw.config.get( 'thanks-confirmation-required' ) ) {
                    $content.find( 'a.mw-thanks-thank-link' ).confirmable( {
                        i18n: {
                            confirm: mw.msg( 'thanks-confirmation2', mw.user ),
                            noTitle: mw.msg( 'thanks-thank-tooltip-no', mw.user ),
                            yesTitle: mw.msg( 'thanks-thank-tooltip-yes', mw.user )
                        },
                        handler: function ( e ) {
                            var $thankLink = $( this );
                            e.preventDefault();
                            sendThanks( $thankLink, $thankLink.closest( '.jquery-confirmable-wrapper' ) );
                        }
                    } );
                } else {
                    $content.find( 'a.mw-thanks-thank-link' ).click( function ( e ) {
                        var $thankLink = $( this );
                        e.preventDefault();
                        sendThanks( $thankLink, $thankLink );
                    } );
                }
            }
            if ( $.isReady ) {
                // This condition is required for soft-reloads
                // to also trigger the reloadThankedState
                reloadThankedState();
            } else {
                $( reloadThankedState );
            }

            $( function () {
                addActionToLinks( $( 'body' ) );
            } );
            
            tlw.addActionToLinks = addActionToLinks;
            mw.hook( 'wikipage.content' ).add(tlw.addActionToLinks);
            mw.hook( 'wikipage.diff' ).add( function ( $content ) {
                addActionToLinks( $content );
            } );
            } , {}, {
                "cancel": "Cancelar",
                "ok": "OK",
                "thanks-confirmation2": "{{GENDER:$1|Enviar}} um agradecimento p\u00fablico por esta edi\u00e7\u00e3o?",
                "thanks-error-invalidrevision": "O ID de revis\u00e3o n\u00e3o \u00e9 v\u00e1lido.",
                "thanks-error-ratelimited": "{{GENDER:$1|Excedeu}} a sua frequ\u00eancia limite de edi\u00e7\u00f5es. Por favor, espere algum tempo e tente novamente.",
                "thanks-error-undefined": "A a\u00e7\u00e3o de agradecimento falhou (c\u00f3digo de erro: $1). Por favor, tente novamente.",
                "thanks-thank-tooltip-no": "{{GENDER:$1|Cancelar}} a notifica\u00e7\u00e3o de agradecimento",
                "thanks-thank-tooltip-yes": "{{GENDER:$1|Enviar}} a notifica\u00e7\u00e3o de agradecimento",
                "thanks-thanked": "{{GENDER:$1|{{GENDER:$2|agradecimento enviado}}}}"
            }
        );
    });
}
})(mw)
 })