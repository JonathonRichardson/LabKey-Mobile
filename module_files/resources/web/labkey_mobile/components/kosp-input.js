define(['knockout', 'knockout.punches', 'text!./kosp-input.html', "underscore", "knockout.switch", "jquery.mobile"], function(ko, punches, htmlTemplate, _) {
    var ViewModelGenerator = function(params) {
        if (!('type' in params)) {
            params.type = "text";
        }

        if (!ko.isObservable(params.value)) {
            params.value = ko.observable();
        }

        var VM = {
            value: params.value,
            text: params.text,
            guid: 'asfasdfsadf',
            type: params.type,
            init: function(elements) {
                var $root = $(elements).closest('kosp-input');
                $root.attr('data-enhance', null);
                $root.enhanceWithin();
            }
        };

        return VM;
    };

    return {
        viewModel: ViewModelGenerator,
        template:  htmlTemplate
    };
});