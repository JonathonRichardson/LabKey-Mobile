define(["jquery"], function($) {
    var LKHTTP = {};

    var defaultContainerPath = function() {
        return "WNPRC/EHR";
    };

    var makeRequest = function(url, config) {
        var useCors = false; // TODO: make this smarter
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

    LKHTTP.selectRows = function(schema, query, config) {
        // Check for required parameters
        if (!schemaName) {
            throw "You must specify a schemaName!";
        }
        if (!queryName) {
            throw "You must specify a queryName!";
        }

        config.dataRegionName = config.dataRegionName || "query";

        var dataObject = LABKEY.Query.buildQueryParams(
            schemaName,
            queryName,
            config.filterArray,
            config.sort,
            config.dataRegionName
        );

        if (config.viewName) {
            dataObject[config.dataRegionName + '.viewName'] = config.viewName;
        }

        if (config.columns) {
            var columns = config.columns;

            if (_.isArray(columns)) {
                columns = columns.join(",");
            }
            dataObject[config.dataRegionName + '.columns'] = columns;
        }

        if (config.parameters) {
            for (var propName in config.parameters) {
                if (config.parameters.hasOwnProperty(propName)) {
                    dataObject[config.dataRegionName + '.param.' + propName] = config.parameters[propName];
                }
            }
        }

        var requestURL =  LABKEY.ActionURL.buildURL('query', 'getQuery', config.containerPath);

        var params = $.params(dataObject);
        if (params.length > 0) {
            requestURL += "?" + params;
        }

        return makeRequest(requestURL);
    };

    return LKHTTP;
});