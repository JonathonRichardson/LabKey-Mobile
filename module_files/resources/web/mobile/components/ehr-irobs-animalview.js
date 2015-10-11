define(['knockout', 'knockout.punches', 'text!./ehr-irobs-cageview.html', "underscore", "jquery", "knockout.switch", "jquery.mobile"], function(ko, punches, htmlTemplate, _, $) {
    var ViewModelGenerator = {
        createViewModel: function (params, componentInfo) {
            var $element = $(componentInfo.element);

            var VM = {
                animal: params.animal,
                init: function () {
                    $element.children().first().collapsible();
                    $element.find('form').enhanceWithin();
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