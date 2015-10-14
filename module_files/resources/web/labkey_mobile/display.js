define(["knockout", "jquery", "jquery.breadcrumb"], function(ko, $) {
    /*
     * Note that this Requires core.js.  Eventually, I'd like to pull all of the page handling out of
     * there and add it to here.
     */

    // Navigation Binding Handler
    ko.bindingHandlers.NavigateTo = {
        init: function (element, valueAccessor, allBindingsAccessor, data, context) {
            $(element).click(function () {
                //console.log("ValueAccessor: ",valueAccessor, valueAccessor());
                context.$root.LoadPage(valueAccessor());
            });
        }
    };


    ko.bindingHandlers.InitHTML = {
        init: function (element, valueAccessor, allBindingsAccessor, data, context) {
            $(element).html(context.$data.HTML);
        }
    };

    ko.bindingHandlers.OnEnter = {
       init: function (element, valueAccessor, allBindingsAccessor, data, context) {
           $(element).on('keypress', function (e) {
               var key = e.which || e.keyCode;
               if (key === 13) { // 13 is enter
                   if ( typeof valueAccessor() === 'function' ) {
                       valueAccessor().call();
                   }
               }
           });
       }
    };

    // Activate all breadcrumbs
    $(document).ready(function () {
        // Need to explicitly use the global version, because jBreadCrumb doesn't work in AMD mode.
        jQuery(".breadCrumb").jBreadCrumb();
    });

});