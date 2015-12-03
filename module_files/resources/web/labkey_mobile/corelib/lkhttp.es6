define(["jquery", "path", "knockout"], function($, path, ko) {
    var LKHTTP = {};

    var baseURL = function() {
        return "http://localhost:9080/labkey/";
    };
    LKHTTP.baseURL = baseURL;

    var defaultContainerPath = function() {
        return "WNPRC/EHR";
    };

    var makeRequest = function(url, config) {
        var useCors = true; // TODO: make this smarter
        config = config || {};

        if (useCors) {
            config.credentials = 'include';
        }
        else {
            config.credentials = 'same-origin';
        }

        config.headers = config.headers || {};
        config.headers['X-ONUNAUTHORIZED'] = "UNAUTHORIZED";

        return fetch(url, config).then(function(response) {
            if (response.status >= 200 && response.status < 300) {
                return response
            }
            else if (loginFailureErrorCodes.has(response.status)) {
                // TODO
                var data;
                var success = ko.observable(false);
                var callback = function() {
                    return makeRequest(url, config).then(function(promiseData) {
                        data = promiseData;
                        success(true);
                    });
                };
                waitingForLoginCallbacks.push(callback);
                var promise = new Promise(function(resolve, reject) {
                    var subscription = success.subscribe(function(val) {
                        if (val) {
                            resolve(data);
                            subscription.dispose();
                        }
                    });
                });

                document.dispatchEvent(new CustomEvent('authenticationfailure'));

                return promise;
            }
            else {
                var error = new Error(response.statusText);
                error.response = response;
                throw error;
            }
        });
    };

    var waitingForLoginCallbacks = [];
    LKHTTP.login = function(username, password) {
        var url = baseURL() + path.join('login','login.post');

        var formData = new FormData();
        formData.append('email', username);
        formData.append('password', password);

        return makeRequest(url, {
            method: 'post',
            body: formData
        }).then(function(){
            var curCallback;
            while (waitingForLoginCallbacks.length > 0) {
                curCallback = waitingForLoginCallbacks.shift();
                curCallback();
            }
        });
    };

    LKHTTP.registerPromiseWaitingForLogin = function(promise) {
        waitingForLoginPromises.push(promise);
    };

    LKHTTP.selectRows = function(schema, query, config) {
        // Check for required parameters
        if (!schema) {
            throw "You must specify a schemaName!";
        }
        if (!query) {
            throw "You must specify a queryName!";
        }

        var params = {
            schemaName: schema,
            'query.queryName': query
        };
        _.each(config, function(value, key) {
            params['query.' + key] = value;
        });

        if (params['query.columns']) {
            var columns = params['query.columns'];

            if (_.isArray(columns)) {
                columns = columns.join(",");
            }
            params['query.columns'] = columns;
        }

        /*
        if (config.parameters) {
            for (var propName in config.parameters) {
                if (config.parameters.hasOwnProperty(propName)) {
                    dataObject[config.dataRegionName + '.param.' + propName] = config.parameters[propName];
                }
            }
        }
        */

        var requestURL =  baseURL() + path.join('query', defaultContainerPath(), 'selectRows.api');

        var params = $.param(params);
        if (params.length > 0) {
            requestURL += "?" + params;
        }

        return makeRequest(requestURL).then(function(response) {
            return response.json();
        });
    };

    LKHTTP.getText = function(path) {
        return makeRequest(baseURL() + path).then(function(response) {
            return response.text();
        })
    };

    var loginFailureErrorCodes = new Set();
    loginFailureErrorCodes.add(401).add(403).add(404);
    LKHTTP.loginFailureErrorCodes = loginFailureErrorCodes;

    LKHTTP.get = function(url, config) {
        return makeRequest(url, config);
    };

    return LKHTTP;
});