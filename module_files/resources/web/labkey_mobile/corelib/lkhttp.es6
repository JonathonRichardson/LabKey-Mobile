define(["jquery", "path", "knockout"], function($, path, ko) {
    var LKHTTP = {};

    var baseURL = function() {
        return "http://localhost:8080/labkey/";
    };
    LKHTTP.baseURL = baseURL;

    var defaultContainerPath = function() {
        return "WNPRC/EHR";
    };
    LKHTTP.defaultContainerPath = defaultContainerPath;

    var makeURLForHTTPAction = function(action) {
        return baseURL() + path.join('query', defaultContainerPath(), `${action}.api`);
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

        /*
         * Some non-HTTP API actions require the CSRF key:
         *   https://www.labkey.org/wiki/home/Documentation/page.view?name=csrfProtection
         *
         * Once the LABKEY library has loaded, this will be added to all requests.  It is important
         * that no @CSRF protected actions are called before this loads, as they will simply appear
         * as 401 Unauthorized requests, indistinguishable from non-logged in requests.
         */
        var LABKEY = window.LABKEY || {};
        if ('CSRF' in LABKEY) {
            config.headers['X-LABKEY-CSRF'] = LABKEY.CSRF;
        }

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
        waitingForLoginCallbacks.push(promise);
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

        var requestURL = makeURLForHTTPAction('selectRows');

        params = $.param(params);
        if (params.length > 0) {
            requestURL += "?" + params;
        }

        return makeRequest(requestURL).then(function(response) {
            return response.json();
        });
    };

    // Define the types to accept for makeAPIRequest.
    var acceptableAPITypes = new Set();
    acceptableAPITypes.add('insert', 'update', 'delete');

    // A generic API request function, since updateRows/deleteRows/insertRows are so similar.
    var makeAPIRequest = function(type, schema, query, rows) {
        // Check the passed in parameters
        var error = !_.isString(schema) ? 'schema' : !_.isString(query) ? 'query' : !_.isArray(rows) ? 'rows' : "";
        if (error !== "") {
            throw `You must specify a valid value for the ${error} argument`;
        }

        // Check the passed in type
        if ( !acceptableAPITypes.has(type) ) {
            throw `${type} is not a valid action for the LabKey API.  Please select "insert", "update", or "delete".`;
        }

        var config = {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                schemaName: schema,
                queryName:  query,
                rows: rows
            })
        };

        return makeRequest(makeURLForHTTPAction(`${type}Rows`), config).then(function(response) {
            return response.json();
        })
    };

    LKHTTP.updateRows = function(schema, query, rows) { return makeAPIRequest('update', schema, query, rows) };
    LKHTTP.deleteRows = function(schema, query, rows) { return makeAPIRequest('delete', schema, query, rows) };
    LKHTTP.insertRows = function(schema, query, rows) { return makeAPIRequest('insert', schema, query, rows) };

    // API to execute raw SQL in LABKEY
    LKHTTP.executeSql = function(schema, sql) {
        return makeRequest(makeURLForHTTPAction('executeSQL'), {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                schemaName: schema,
                sql: sql
            })
        }).then(function(response) {
            return response.json();
        });
    };

    LKHTTP.getText = function(path) {
        return makeRequest(baseURL() + path).then(function(response) {
            return response.text();
        })
    };

    var loginFailureErrorCodes = new Set();
    loginFailureErrorCodes.add(401).add(403);
    LKHTTP.loginFailureErrorCodes = loginFailureErrorCodes;

    LKHTTP.get = function(url, config) {
        return makeRequest(url, config);
    };

    LKHTTP.post = function(url, data, config) {
        data = $.param(data);
        if (data.length > 0) {
            url += `?${data}`;
        }

        config = _.extendOwn(config || {}, {
            method: 'post'
            //body: JSON.stringify(data)
        });

        return makeRequest(url, config);
    };

    return LKHTTP;
});