define(['knockout', 'knockout.punches', 'text!./inline-textInput-button.html', "knockout.switch"], function(ko, punches, htmlTemplate) {
    var ViewModelGenerator = function(params) {
        var textInBox;
        if ( ko.isObservable(params.inputBoxText) ) {
            textInBox = params.inputBoxText;
        }
        else {
            textInBox = ko.observable(params.inputBoxText);
        }

        var VM = {
            click: params.click || function() {},
            buttonText: ko.observable(params.buttonText || "Submit"),
            inputBoxText: textInBox,
            inputBoxLabel: ko.observable(params.inputBoxLabel)
        };

        return VM;
    };

    return {
        viewModel: ViewModelGenerator,
        template:  htmlTemplate
    };
});