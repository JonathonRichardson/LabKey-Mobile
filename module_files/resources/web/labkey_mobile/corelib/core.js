define(["jquery", "jquery.mobile", "underscore", "knockout", "knockout.mapping", "../corelib/content-manifest","display", "jquery.ui"],
function($,        mobile,          _,            ko,         mapping,            pageManifest) {
    ko.mapping = mapping;
    $.mobile = mobile;

    PageViewModel = {
        loginInfo: {
            username: ko.observable(),
            password: ko.observable(),
            state:    ko.observable()
        },
        user: ko.mapping.fromJS({
            UserId: "-1",
            DisplayName: "Unknown"
        }),
        BreadCrumbs: ko.observableArray(),
        PageViewModels: {}
    };

    var _switchToPage = function(page) {
        var curHashParams = location.hash;
        if ( curHashParams.indexOf("?") === -1 ) {
            curHashParams = "";
        }
        else {
            curHashParams = curHashParams.substr(curHashParams.indexOf("?") + 1);
        }
        $.mobile.changePage('#' + page + '?' + curHashParams);
    };

    $(document).on('loginsuccess', function() {
        PageViewModel.loginInfo.state('loggingin');
    });

    $(document).on('notauthorized', function(e) {
        PageViewModel.loginInfo.state('');
        _switchToPage('loginPage');
    });

    $(document).on('logincompleted', function(e) {
        var eventData = e.originalEvent.detail;

        if ( eventData && 'displayName' in eventData ) {
            PageViewModel.user.DisplayName(eventData.displayName);
        }

        _switchToPage('mainContentPage');
    });


    // Add a line to the bottom of the dialog whenever we fail to log in.
    $(document).on('loginfailure', function() {
        // TODO:  Decouple this from the UI
        $('#loginDialog').append($(document.createElement('p')).text("login failed..."));

        PageViewModel.loginInfo.state('');
    });

    $(document).on('loginstartattempt', function() {
        PageViewModel.loginInfo.state('loggingin')
    });

    var URLUtils = {
        encodeState: function(data) {
            return encodeURI(JSON.stringify(data));
        },
        decodeState: function(string) {
            return JSON.parse(decodeURI(string));
        },
        encodePageName: function(pageName) {
            return pageName.replace(/\//, '.');
        },
        decodePageName: function(pageName) {
            return pageName.replace(/\./, '/');
        },
        encodePageReference: function(pagename, data) {
            var params = { page: this.encodePageName(pagename) };

            if ( data ) {
                params.state = this.encodeState(data);
            }
            var encodedPageRef = "#mainContentPage?" + $.param(params);

            return encodedPageRef;
        }
    };
    PageViewModel.URLUtils = URLUtils;

    PageViewModel.login = function() {
        document.dispatchEvent(new CustomEvent('attemptlogin', {
            'detail': {
                username: ko.unwrap(PageViewModel.loginInfo.username),
                password: ko.unwrap(PageViewModel.loginInfo.password)
            }
        }));

        document.dispatchEvent(new CustomEvent('loginstartattempt'));
    };

    PageViewModel.logout = function() {
        document.dispatchEvent(new CustomEvent('attemptlogout'));
    };

    PageViewModel.LoadPage = function(pageName, data) {
        var fullPageReference = PageViewModel.URLUtils.encodePageReference( pageName, data );
        $.mobile.changePage( fullPageReference, { allowSamePageTransition: true, transition: 'none' } );
    };

    PageViewModel.LoadPageInternal = function (pageName, stateData) {
        console.log("Trying to load " + pageName + ".html ...");

        var metadata      = pageManifest[pageName];
        var viewModelName = "../content/" + pageName;
        var templateName  = "jqm!../content/" + pageName;

        var $mainContainer = $('#mainContainer');
        var $currentPage   = $mainContainer.children().filter('[data-bind]');

        // Grab the page hierarchy
        var pageList = pageName.split("/");

        // LandingPage is special, and shouldn't appear
        if ( pageList[0] === 'LandingPage' ) { pageList.shift(); }

        // Grab the old breadcrumbs
        var oldHierarchy = _.map(PageViewModel.BreadCrumbs.removeAll(), function(value, index) {
            return value.rawName;
        });

        var firstPage = false;
        var onSameTree;
        // Determine if we're going down the hierarchy
        if ($mainContainer.children().length === 0) {
            firstPage = true;
        }
        else if ( (oldHierarchy.length > pageList.length) && _.isEqual(oldHierarchy.slice(0,pageList.length), pageList) ) {
            // We are going up
            onSameTree = { direction: 'up'};
        }
        else if ( (oldHierarchy.length < pageList.length) && _.isEqual(oldHierarchy, pageList.slice(0,oldHierarchy.length)) ) {
            // We are going down
            onSameTree = { direction: 'down'};
        }

        var isReady = ko.observable(false);
        var fadeOutConfig = {
            duration: 200,
            queue: false,
            complete: function() {
                isReady(true);
                window.setTimeout(function() {
                    console.log("removing old page: ", $currentPage);
                    $currentPage.remove();
                }, 10000);
            }
        };

        if (firstPage) {
            $currentPage.hide();
            isReady(true)
        }
        else if ( onSameTree ) {
            if ( onSameTree.direction === 'up') {
                $currentPage.hide('slide', {direction: 'right', complete: function(){ isReady(true) }}).fadeOut(fadeOutConfig);
            }
            else {
                $currentPage.hide('slide', {direction: 'left', complete: function() {isReady(true)}}).fadeOut(fadeOutConfig);
            }
        }
        else {
            // Neither
            $currentPage.fadeOut(fadeOutConfig);
        }

        var setupPage = function (ViewModel, template) {
            // In case the page doesn't give itself a local ViewModel, give it a default one.
            if (!ViewModel) { ViewModel = {}; }

            // Grab any information from the query string.
            var merge = function(firstObj, secondObj) {
                var key;
                for (key in secondObj) {
                    if ( (key in firstObj) && ko.isObservable(firstObj[key]) ) {
                        firstObj[key]( ko.unwrap(secondObj[key]) );
                    }
                    else {
                        firstObj[key] = ko.unwrap(secondObj[key]);
                    }
                }
                return firstObj;
            };
            if ( stateData ) {
                ViewModel.urlparams = ViewModel.urlparams || {};
                merge(ViewModel.urlparams, stateData);
            }

            //Actually assign the ViewModel to our "global" object.
            PageViewModel.PageViewModels[pageName] = ViewModel;

            var paint = function() {
                // Update the breadcrumbs
                var fullPath = "";
                _.each(pageList, function(value, index) {
                    if ( fullPath === "" ) {
                        fullPath = value;
                    }
                    else {
                        fullPath += "/" + value;
                    }

                    PageViewModel.BreadCrumbs.push({
                        location: fullPath,
                        pageExists: pageManifest[fullPath].hasHTML,
                        rawName: value,
                        Name: value.replace(/([A-Z])/g, ' $1'),
                        isLast: (index === pageList.length-1)
                    });
                });

                // So that this element can pretend to be it's own element, but still have access to the
                // root ViewModel, use the "with" binding.
                var $newContent = $($.parseHTML('<div data-bind="with: PageViewModels[\'' + pageName + '\']"></div>'));
                $newContent.html(template);
                $newContent.hide();
                $mainContainer.append($newContent);

                // Clean the node for Knockout, and then re-bind the PageViewModel to this element.
                var node = $newContent.get(0);
                ko.cleanNode(node);
                ko.applyBindings(PageViewModel, node);

                var show = function() {
                    // Determine if we're going down the hierarchy
                    if ( onSameTree ) {
                        if ( onSameTree.direction === 'up' ) {
                            $newContent.show('slide', {direction: 'left'} );
                        }
                        else {
                            $newContent.show('slide', {direction: 'right'} );
                        }
                    }
                    else {
                        $newContent.fadeIn();
                    }
                };

                if (isReady()) {
                    show();
                }
                else {
                    isReady.subscribe(show);
                }

            };

            paint();

            // Shim to fix footer
            var $footer = $('body').children('[data-role="footer"]');
            if ( $footer.length > 0 ) {
                $('jqm-footer').append($footer);
            }
        };

        var requirements = [templateName];
        if ( metadata.hasVM ) {
            requirements.push(viewModelName);
        }

        // Actually load the page
        requirejs(requirements, function() {
            var template = arguments[0];
            var VM       = arguments[1] || {};
            setupPage(VM, template);
        });

    };

    PageViewModel.Back     = function () {
        window.history.back();
    };

    PageViewModel.GoHome = function() {
        $.mobile.changePage('#mainContentPage', { transition: 'none' });
    };

    PageViewModel.ShowMenuPanel = function() {
        var $menuPanel = $("#jqm-panel-menu");
        $menuPanel.trigger('updatelayout');
        $menuPanel.panel('open');
    };

    PageViewModel.ShowAccountPanel = function() {
        var $accountPanel = $("#jqm-panel-account");
        $accountPanel.trigger('updatelayout');
        $accountPanel.panel("open");
    };


    return PageViewModel;
});

