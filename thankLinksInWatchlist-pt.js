$( document ).ready( function () { 
(function (mw) {if (mw.config.get('wgNamespaceNumber') === -1) {
    mw.loader.using(['ext.thanks',  'jquery.confirmable', 'oojs-ui-core', 'oojs-ui-windows']).then(function () {
        mw.config.set( 'thanks-confirmation-required', true );
        tlw = {}
        tlw.addLinks = function () {
            var regex = /[?&]([^=#]+)=([^&#]*)/g,
            diffs, logs;
            // mw.hook( 'wikipage.content' ).remove(tlw.addLinks);
            diffs = $('.mw-changeslist-diff');
            diffs.each(function (i, diff) {
                var url = diff.href,
                    match, revid, $thankLink;
                while(match = regex.exec(url)) {
                    diff[match[1]] = match[2];
                }
                if (! $(diff).attr('data-thanks-link') || $(diff).attr('data-thanks-link') === 'false') {
                    if (diff.diff === 'prev'){
                        revid = diff.oldid;
                    } else {
                        revid = diff.diff;
                    }
                    $thankLink = $('<a class="mw-thanks-thank-link" title="Envie um agradecimento para este utilizador">agradecer</a>')
                        .attr('href',"//"+ window.location.host + "/wiki/Special:Thanks/" + revid)
                        .attr('data-revision-id', revid);
                    $thankLink.insertAfter(diff);
                    $(document.createTextNode(' | ')).insertAfter(diff);
                    $(diff).attr('data-thanks-link', 'True');
                }
            });
            logs = $('.mw-changeslist-log').not('.mw-collapsible');
            logs.each(function(i, log) {
                var logID, talk, $thankLink;
                if ((!$(log).attr('data-thanks-link') || $(log).attr('data-thanks-link') === 'false') && !log.dataset['mwLogaction'].startsWith('block')) {
                    logID = log.dataset['mwLogid'];
                    talk = $(log).find('.mw-usertoollinks-talk');
                    $thankLink = $('<a class="mw-thanks-thank-link" title="Envie um agradecimento para este utilizador">agradecer</a>')
                        .attr('href', "//" + window.location.host + "/wiki/Special:Thanks/Log/" + logID)
                        .attr('data-log-id', logID);
                    $thankLink.insertBefore(talk)
                    $(document.createTextNode(' | ')).insertBefore(talk);
                    $(log).attr('data-thanks-link', 'True');
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
                        $thankLink.before(
                            $( '<span class="mw-thanks-thank-confirmation">' ).text(
                                mw.msg( 'thanks-thanked', mw.user, '' ) )
                        );
                        $thankLink.remove();
                    }
                } );
            }
            // $thankLink is the element with the data-revision-id attribute
            // $thankElement is the element to be removed on success
            function sendThanks( $thankLink, $thankElement ) {
                var source, apiParams;

                if ( $thankLink.data( 'clickDisabled' ) ) {
                    // Prevent double clicks while we haven't received a response from API request
                    return false;
                }
                $thankLink.data( 'clickDisabled', true );

                // Determine the thank source (history, diff, or log).
                if ( mw.config.get( 'wgAction' ) === 'history' ) {
                    source = 'history';
                } else if ( mw.config.get( 'wgCanonicalSpecialPageName' ) === 'Log' ) {
                    source = 'log';
                } else {
                    source = 'diff';
                }

                // Construct the API parameters.
                apiParams = {
                    action: 'thank',
                    source: source
                };
                if ( $thankLink.data( 'log-id' ) ) {
                    apiParams.log = $thankLink.data( 'log-id' );
                } else {
                    apiParams.rev = $thankLink.data( 'revision-id' );
                }

                // Send the API request.
                ( new mw.Api() ).postWithToken( 'csrf', apiParams )
                    .then(
                        // Success
                        function () {
                            $thankElement.before( mw.message( 'thanks-thanked', mw.user, '' ).escaped() );
                            $thankElement.remove();
                            mw.thanks.thanked.push( $thankLink );
                        },
                        // Fail
                        function ( errorCode ) {
                            // If error occurred, enable attempting to thank again
                            $thankLink.data( 'clickDisabled', false );
                            switch ( errorCode ) {
                                case 'invalidrevision':
                                    OO.ui.alert( mw.msg( 'thanks-error-invalidrevision' ) );
                                    break;
                                case 'ratelimited':
                                    OO.ui.alert( mw.msg( 'thanks-error-ratelimited', mw.user ) );
                                    break;
                                case 'revdeleted':
                                    OO.ui.alert( mw.msg( 'thanks-error-revdeleted' ) );
                                    break;
                                default:
                                    OO.ui.alert( mw.msg( 'thanks-error-undefined', errorCode ) );
                            }
                        }
                    );
            }
            function addActionToLinks( $content ) {
                var $thankLinks = $content.find( 'a.mw-thanks-thank-link' );
                if ( mw.config.get( 'thanks-confirmation-required' ) ) {
                    $thankLinks.each( function () {
                        var $thankLink = $( this );
                        $thankLink.confirmable( {
                            i18n: {
                                confirm: mw.msg( 'thanks-confirmation2', mw.user ),
                                no: mw.msg( 'cancel' ),
                                noTitle: mw.msg( 'thanks-thank-tooltip-no', mw.user ),
                                yes: mw.msg( 'thanks-button-thank', mw.user, '' ),
                                yesTitle: mw.msg( 'thanks-thank-tooltip-yes', mw.user )
                            },
                            handler: function ( e ) {
                                e.preventDefault();
                                sendThanks( $thankLink, $thankLink.closest( '.jquery-confirmable-wrapper' ) );
                            }
                        } );
                    } );
                } else {
                    $thankLinks.click( function ( e ) {
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
            tlw.reloadThankedState = reloadThankedState;
            mw.hook( 'wikipage.content' ).add(tlw.addActionToLinks);
            mw.hook( 'wikipage.content' ).add(tlw.reloadThankedState);
            mw.hook( 'wikipage.diff' ).add( function ( $content ) {
                addActionToLinks( $content );
            } );
            } , {}, {
                "cancel": "Cancelar",
                "ok": "OK",
                "thanks-desc": "Adiciona ligações para agradecer usuários por suas edições, comentários, etc.",
                "thanks-thank": "{{GENDER:$1|{{GENDER:$2|agradecer}}}}",
                "thanks-thanked": "{{GENDER:$1|{{GENDER:$2|agradecido|agradecida}}}}",
                "thanks-button-thank": "{{GENDER:$1|{{GENDER:$2|Agradecer}}}}",
                "thanks-button-thanked": "{{GENDER:$1|{{GENDER:$2|Agradecido|Agradecida}}}}",
                "thanks-button-action-queued": "{{GENDER:$1|{{GENDER:$2|Agradecendo}}}}",
                "thanks-button-action-cancel": "Cancelar",
                "thanks-button-action-completed": "{{GENDER:$1|{{GENDER:$2|agradeceu|agradeceu}}}}",
                "thanks-error-undefined": "O agradecimento falhou (erro: $1). Tente de novamente.",
                "thanks-error-invalid-log-id": "A entrada do registo não foi encontrada",
                "thanks-error-invalid-log-type": "O tipo de registo '$1' não consta da lista branca dos tipos de registo permitidos.",
                "thanks-error-log-deleted": "A entrada de registo solicitada foi eliminada e não se pode dar agradecimentos por ela.",
                "thanks-error-invalidrevision": "ID de revisão inválido.",
                "thanks-error-revdeleted": "Não é possível enviar o agradecimento, porque a revisão foi eliminada.",
                "thanks-error-notitle": "Não foi possível encontrar o título da página",
                "thanks-error-invalidrecipient": "Não foi encontrado recipiente válido",
                "thanks-error-invalidrecipient-bot": "Bots não podem receber agradecimentos",
                "thanks-error-invalidrecipient-self": "Você não pode agradecer a si mesmo",
                "thanks-error-notloggedin": "Usuários anônimos não podem enviar agradecimentos",
                "thanks-error-ratelimited": "{{GENDER:$1|Você}} excedeu seu limite. Aguarde um pouco e tente novamente.",
                "thanks-error-api-params": "Tem de ser fornecido um dos parâmetros 'revid' ou 'logid'",
                "thanks-thank-tooltip": "{{GENDER:$1|Enviar}} uma notificação de agradecimento a {{GENDER:$2|este usuário|esta usuária}}",
                "thanks-thank-tooltip-no": "{{GENDER:$1|Cancelar}} a notificação de agradecimento",
                "thanks-thank-tooltip-yes": "{{GENDER:$1|Enviar}} a notificação de agradecimento",
                "thanks-confirmation2": "{{GENDER:$1|Enviar}} um agradecimento que será público?",
                "thanks-thanked-notice": "{{GENDER:$3|Você}} agradeceu a {{GENDER:$2|$1}}.",
                "thanks": "Enviar agradecimento",
                "thanks-submit": "Enviar agradecimento",
            }
        );
    });
}
})(mw)
 })
