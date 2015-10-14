define(['knockout', 'knockout.punches', 'text!./ehr-irobs-cageview.html', "underscore", "jquery", "knockout.switch", "jquery.mobile"], function(ko, punches, htmlTemplate, _, $) {
    var ViewModelGenerator = {
        createViewModel: function (params, componentInfo) {
            var $element = $(componentInfo.element);

            var VM = {
                cage: params.cage,
                init: function () {
                    $element.children().first().collapsible();
                }
            };

            return VM;
        }
    };

    return {
        viewModel: ViewModelGenerator,
        template:  htmlTemplate
    };
});