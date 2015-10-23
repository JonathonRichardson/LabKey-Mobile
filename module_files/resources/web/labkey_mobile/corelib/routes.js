define(["jquery", "jquery.mobile", "jqm-router", "core"], function($, mobile, Router, core) {
    var currentPage = null;
    var myRouter = new $.mobile.Router({
        "#mainContentPage": {
            handler: function(type, match, ui, page, e, timeoutID) {
                var self = myRouter.routes.pagebeforechange["#mainContentPage(?:[?](.*))?$"];
                console.log("handling before show event", myRouter);
                var queryString = match[0];
                var data = myRouter.getParams(queryString);

                if ( currentPage === data.page ) {
                    console.log('staying on same page');
                    e.preventDefault();
                    return;
                }

                if ('state' in data) {
                    data.state = JSON.parse(data.state);
                }

                if ( !('page' in data) ) {
                    data.page = "LandingPage"
                }

                core.LoadPageInternal(data.page.replace(/\./, "/"), data.state);
                currentPage = data.page;
            },
            events: "bC",
            argsre: true,
            step: "url"
        }
    });

    return myRouter;
});