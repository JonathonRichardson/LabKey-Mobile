define(['underscore'], function(_) {
    /*
     * External wrappers for LABKEY functions.  The main purpose of this is for Ajax involved
     * functions, so that we can control the login screen.
     */
    var failureWrapper = function (callback) {
        return function (errorInfo) {
            if (!_.isUndefined(errorInfo) && (errorInfo.exception == 'Unauthorized')) {
                EHRMobile.Utils.LoginFailure();
            }
            else {
                // Now call normal handler
                callback(errorInfo);
            }
        }
    };

    var getContainer = function() {
        return "WNPRC/EHR";
    };

    var XLABKEY = {};

    XLABKEY.Utils = {
        generateUUID: function() {
            return LABKEY.Utils.generateUUID();
        }
    };

    XLABKEY.Meta = XLABKEY.Meta || {};

    XLABKEY.Query = XLABKEY.Query || {};

    XLABKEY.Query.selectRows = function(config) {
        //Save off current query.
        XLABKEY.Meta.currentQuery = function() {
            XLABKEY.Query.selectRows(config);
        };

        // Wrap the Success function
        var origSuccess = config.success || function(data) {};
        config.success = function(data) {
            XLABKEY.Meta.currentQuery = undefined;
            origSuccess(data);
        };

        // Set a proper container path.
        config.containerPath = getContainer();

        // Wrap the Failure function
        var origFailure = config.failure || function() {};
        config.failure = failureWrapper(origFailure);

        LABKEY.Query.selectRows(config);
    };

    XLABKEY.Query.saveRows = function(config) {
        //Save off current query.
        XLABKEY.Meta.currentQuery = function() {
            XLABKEY.Query.selectRows(config);
        };

        // Wrap the Success function
        var origSuccess = config.success || function(data) {};
        config.success = function(data) {
            XLABKEY.Meta.currentQuery = undefined;
            origSuccess(data);
        };

        // Set a proper container path.
        config.containerPath = getContainer();

        // Wrap the Failure function
        var origFailure = config.failure || function() {};
        config.failure = failureWrapper(origFailure);

        LABKEY.Query.saveRows(config);
    };

    XLABKEY.Query.deleteRows = function(config) {
        //Save off current query.
        XLABKEY.Meta.currentQuery = function() {
            XLABKEY.Query.selectRows(config);
        };

        // Wrap the Success function
        var origSuccess = config.success || function(data) {};
        config.success = function(data) {
            XLABKEY.Meta.currentQuery = undefined;
            origSuccess(data);
        };

        // Set a proper container path.
        config.containerPath = getContainer();

        // Wrap the Failure function
        var origFailure = config.failure || function() {};
        config.failure = failureWrapper(origFailure);

        LABKEY.Query.deleteRows(config);
    };

    return XLABKEY;
});