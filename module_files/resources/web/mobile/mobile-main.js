requirejs(["jquery"], function($) {
    // Prevent jQuery Mobile from automatically enhancing everything, because we'll do that manually later.
    //$('body').attr('data-enhance', "false");
    $(document).on('mobileinit', function () {
        $.mobile.ignoreContentEnabled = true;
    });

    // Now, load JQM
    requirejs(["jquery", "jquery.mobile", "routes"], function($) {
        // Remove the flag so we can enhance at will.
        //$('body').attr('data-enhance', null);
        //$.mobile.ignoreContentEnabled = false;

        // Configure defaults for the jQuery Mobile loading message
        $.mobile.loader.prototype.options.textVisible = true;
        $.mobile.loader.prototype.options.text = "Loading...";

        requirejs(["knockout", "jquery", "jquery.breadcrumb", "jqm-easy", "knockout.switch", "knockout.punches"], function(ko, $) {
            // Enable punches for all pages.
            ko.punches.enableAll();

            ko.components.register('inline-textinput-button', {
                viewModel: {
                    require: "components/inline-textInput-button"
                },
                template: {
                    require: "jqm!components/inline-textInput-button"
                }
            });

            ko.components.register('kosp-input', {
                viewModel: {
                    require: "components/kosp-input"
                },
                template: {
                    require: "jqm!components/kosp-input"
                }
            });

            ko.components.register('ehr-irobs-cageview', {
                viewModel: {
                    require: "components/ehr-irobs-cageview"
                },
                template: {
                    require: "text!components/ehr-irobs-cageview.html"
                }
            });

            ko.components.register('ehr-irobs-animalview', {
                viewModel: {
                    require: "components/ehr-irobs-animalview"
                },
                template: {
                    require: "text!components/ehr-irobs-animalview.html"
                }
            });

            requirejs(["core", "jquery", "knockout", "ehrmobile", "knockout.mapping", "xlabkey", "display"], function(core, $, ko, EHRMobile) {
                $(document).ready(function () {
                    ko.applyBindings(PageViewModel);

                    EHRMobile.Utils.TestLogin(function(successful) {
                        if ( successful ) {
                            document.dispatchEvent(new CustomEvent('loginsuccess'));
                        }
                        else {
                            document.dispatchEvent(new CustomEvent("notauthorized"));
                        }

                        $('.div-hider').fadeOut();
                    });
                });
            });
        });
    });
});
