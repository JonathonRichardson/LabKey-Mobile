define([], function() {
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

    var XLABKEY = {};

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
        config.containerPath = "WNPRC/EHR";

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
        config.containerPath = "WNPRC/EHR";

        // Wrap the Failure function
        var origFailure = config.failure || function() {};
        config.failure = failureWrapper(origFailure);

        LABKEY.Query.saveRows(config);
    };

    return XLABKEY;
});