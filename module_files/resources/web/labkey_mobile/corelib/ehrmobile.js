define(["classify", "jquery", "underscore", "ehrmobile-lookups", "lkhttp", "xlabkey", "path"], function(Classify, $, _, Lookups, LKHTTP, XLABKEY, path) {
    var isMobileApp = function() {
        var app = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
        if ( app ) {
            // PhoneGap application
            return true;
        } else {
            // Web page
            return false;
        }
    };

    var EHRMobile = {
        Utils: {
            LoginFailureData: {}
        },
        Config: {
            BaseURL: function() {
                if (!isMobileApp()) {
                    //TODO: grab this out of LABKEY client API.
                    return "http://localhost:9080/labkey/";
                }
                else {
                    //TODO: Make this function more robust, for PhoneGap
                }
            }
        },
        Authentication: {
            LoginFailureData: {}
        }
    };

    EHRMobile.Utils.LoginBootstrap = function() {
        return LKHTTP.getText('/{@{ModuleName}@}/LABKEYJavascriptAPI.view').then(function (data) {
            /*
             * We have to tell the LabKey JS API that the DOM is done loading, but before anything tries to use any LABKEY APIs,
             * so we'll insert a quick script after labkey.js is loaded.  Note that this needs to keep the wildcard in order
             * to ensure that it works in development as well as production.  You also can't use jQuery, because that would
             * either execute or strip (depending on the options you pass) the script tags when jQuery parses the HTML.
             */
            var DomDoneScript = '<script type="text/javascript">LABKEY.loadScripts();</script>';
            var fixedData = data.replace(/(?:<script.*labkey\.js.*?<\/script>)/, '$&' + DomDoneScript);

            /*
             * Remove CSS From the scripts.
             */
            fixedData = fixedData.replace(/<link.*?rel="stylesheet">/g, '');

            // "Hide" RequireJS, because Raphael's "eve" module is AMD aware, and it'll break Raphael from loading.
            var _require = require, _define  = define, _requirejs = requirejs;
            require = define = requirejs = undefined;

            //Add Javascript and CSS to support LABKEY JS APIs
            $('head').append(fixedData);

            // Restore RequireJS
            require   = _require;
            define    = _define;
            requirejs = _requirejs;

            //Mark the Dom as being complete
            $('body').append();

            // Add a header to all AJAX requests through the LABKEY API
            LABKEY.Ajax.DEFAULT_HEADERS['X-ONUNAUTHORIZED'] = "UNAUTHORIZED";

            return Lookups.loadAll();
        });
    };

    $(document).on('authenticationfailure', function() {
        PageViewModel.Authentication.showLoginPopup();
    });

    EHRMobile.Utils.Logout = function () {
        var failureWrapper = function (jqXHR, textStatus, errorThrown) { console.log("Failed to logout.") };

        var success = function (data, textStatus) {
            console.log("Successfully logged out.");
            $.mobile.changePage("#loginPage");
            location.reload();
        };

        var URL = EHRMobile.Config.BaseURL() + "/login/home/logout.view";

        $.ajax(URL, {
            success: success,
            error: failureWrapper,
            headers: {
                'Content-Type': "x-www-form-urlencoded"
            }
        });
    };

    return EHRMobile;
});
