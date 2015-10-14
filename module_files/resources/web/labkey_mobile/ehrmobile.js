define(["classify", "jquery", "underscore", "ehrmobile-lookups", "xlabkey"], function(Classify, $, _, Lookups, XLABKEY) {
    var EHRMobile = {
        Utils: {
            LoginFailureData: {}
        },
        Config: {
            BaseURL: function() { return "" } //TODO: Make this function more robust, for PhoneGap
        },
        Authentication: {
            LoginFailureData: {}
        }
    };

    var EHRAjaxRequest = Classify.newClass({
        constructor: function(config) {
            this.relativePath = config.relativePath;
            this.ajaxConfig   =  config.ajaxConfig || {};

            // URL Parameters
            if (('params' in config) && _.isUndefined(config.params)) {
                this.URLParams = config.params;
            }
            else {
                this.URLParams = null;
            }

            this.dontIgnoreAuthenticationFailure = !!config.dontIgnoreAuthenticationFailure;

            // Define our handler
            if (typeof config.handler === 'function') {
                this.handler = config.handler;
            }
            else {
                this.handler = function(success, data) {
                    console.log("EHRAjax Request returned with a success value of '" + success.toString() + "' and the following data: ", data);
                }
            }
        },
        methods: {
            getSuccessCallback: function() {
                var self = this;
                return function(data, textStatus) {
                    self.handler(true, data);
                };
            },
            getFailureCallback: function() {
                var self = this;
                var loginFailureErrorCodes = {
                    401: true,
                    404: true,
                    403: true,
                    0:   true
                };
                return function (jqXHR, textStatus, errorThrown) {
                    if ( (jqXHR.status in loginFailureErrorCodes) && (!self.dontIgnoreAuthenticationFailure) ) {
                        EHRMobile.Utils.LoginFailure(this.relativePath, this.handler, this.URLParams); // TODO: is this too coupled?
                    }
                    else {
                        self.handler(false, {});
                    }
                };
            },
            getURL: function() {
                if ( this.relativePath.substr(0,1) === '/' ) { 
                  return EHRMobile.Config.BaseURL() + this.relativePath;
                }
                else {
                  return this.relativePath;
                }
            },
            getAJAXConfig: function() {
                var config = this.ajaxConfig;

                // Ensure that our headers include the flag to disable requests for basic auth
                if ( !('headers' in config) ) { config.headers = {}; }
                config.headers['X-ONUNAUTHORIZED'] = 'UNAUTHORIZED';

                // Success
                config.success = this.getSuccessCallback();

                // Error
                config.error = this.getFailureCallback();

                // Query Parameters
                if ( this.URLParams !== null ) {
                    config.data = this.URLParams;
                }

                return config;
            },
            fire: function() {
                $.ajax(this.getURL(), this.getAJAXConfig());
            }
        }
    });

    EHRMobile.Utils.Get = function(relativePath, handler, URLParams) {
        // We don't need to set method since GET is default method.
        var config = {
            relativePath: relativePath,
            handler: handler
        };
        if (!_.isUndefined(URLParams)) {
            config.params = URLParams;
        }

        var request = new EHRAjaxRequest(config);
        request.fire();
    };

    EHRMobile.Utils.LoginFailure = function (relativePath, handler, URLParams) {
        // Cache this information so that we can do it again.
        if (!(  _.isUndefined(relativePath) || _.isUndefined(handler) )) {
            EHRMobile.Utils.LoginFailureData = {
                relativePath: relativePath,
                handler: handler,
                URLParams: URLParams || ""
            };
        }
        console.log("Login failed.  URL Hash: ", document.location.hash);

        // Fire an event to indicate that we failed to login.
        document.dispatchEvent(new CustomEvent("notauthorized"));
    };

    EHRMobile.Utils.TestLogin = function(callback) {
        // This is an Ajax call that will check to see if we are logged in, and, if not, attempt to log us in.
        var checkLoginRequest = new EHRAjaxRequest({
            //relativePath: "security/ensureLogin.view",
            relativePath: "/project/home/begin.view",
            dontIgnoreAuthenticationFailure: true,
            handler: function(successful, data) {
                if (successful) {
                    callback(true, data);
                }
                else {
                    callback(false,  {});
                }
            }
        });

        checkLoginRequest.fire();
    };

    EHRMobile.Utils.LoginBootstrap = function() {
        EHRMobile.Utils.Get('LABKEYJavascriptAPI.view', function (success, data) {
            /*
             * We have to tell the LabKey JS API that the DOM is done loading, but before anything tries to use any LABKEY APIs,
             * so we'll insert a quick script after labkey.js is loaded.  Note that this needs to keep the wildcard in order
             * to ensure that it works in development as well as production.  You also can't use jQuery, because that would
             * either execute or strip (depending on the options you pass) the script tags when jQuery parses the HTML.
             */
            var DomDoneScript = '<script type="text/javascript">LABKEY.loadScripts();</script>';
            var fixedData = data.replace(/(?:<script.*labkey\.js.*?<\/script>)/, '$&' + DomDoneScript);

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

            Lookups.eventToFire = function() {
                document.dispatchEvent(new CustomEvent('logincompleted', {
                    detail: {
                        displayName: LABKEY.Security.currentUser.displayName.replace(/\s.*$/, '')
                    }
                }));
            };
            Lookups.loadAll();
        });
    };
    $(document).on('loginsuccess', EHRMobile.Utils.LoginBootstrap);

    EHRMobile.Utils.Login = function (username, password) {
        var Data = EHRMobile.Utils.LoginFailureData;
        if (("relativePath" in Data) && ("handler" in Data) && ("URLParams" in Data)) {
            EHRMobile.Utils.Get(Data.relativePath, Data.handler, Data.URLParams);
        }

        var success = function (data, textStatus) {
            var Data = EHRMobile.Utils.LoginFailureData;

            if (_.isFunction(XLABKEY.Meta.currentQuery)) {
                XLABKEY.Meta.currentQuery();
            }
            else if (("relativePath" in Data) && ("handler" in Data) && ("URLParams" in Data)) {
                EHRMobile.Utils.Get(Data.relativePath, Data.handler, Data.URLParams);
            }

            // Clear all the data.
            EHRMobile.Utils.LoginFailureData = {};

            EHRMobile.Utils.LoginBootstrap();
        };

        // If we determine that we need to log in, this is the request that will actually log us in.
        var actualLoginRequest = new EHRAjaxRequest({
            // Note that you have to form the URL manually, because LabKey expects the email to include '@', as
            // opposed to it's encoded version.
            relativePath: "/login/login.post" + "?email=" + username + "&password=" + password,
            ajaxConfig:   {
                method: 'POST',
                headers: {'Content-Type': "x-www-form-urlencoded"},
                statusCode: {
                    0:   function () { success() },
                    302: function () { success() }
                }
            },
            handler: function(successful, data) {
                if ( successful ) {
                    success(data);
                }
                else {
                    // Fire an event to indicate that we failed to login
                    document.dispatchEvent(new CustomEvent('loginfailure'));
                }
            }
        });

        EHRMobile.Utils.TestLogin(function(successful) {
            if ( successful ) {
                success()
            }
            else {
                actualLoginRequest.fire();
            }
        });
    };
    $(document).on('attemptlogin', function(e) {
        EHRMobile.Utils.Login(e.originalEvent.detail.username, e.originalEvent.detail.password);
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
    $(document).on('attemptlogout', EHRMobile.Utils.Logout);

    return EHRMobile;
});
