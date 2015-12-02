define(["jquery", "path"], function($, path) {
    var LKHTTP = {};

    var baseURL = function() {
        return "http://localhost:9080/labkey/";
    };
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

        return fetch(url, config);
    };

    LKHTTP.login = function(username, password) {
        var url = baseURL() + path.join('login','login.post');

        var formData = new FormData();
        formData.append('email', username);
        formData.append('password', password);

        return makeRequest(url, {
            method: 'post',
            body: formData
        });
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

    return LKHTTP;
});