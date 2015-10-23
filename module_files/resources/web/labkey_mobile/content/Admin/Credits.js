define(['knockout', 'text!./Credits.json', 'jquery'], function(ko, credits, $) {
    credits = JSON.parse(credits);

    var images = ko.observable(_.map(credits.images, function(val) {
        val.infoFields = [];

        $.each(val.info, function(key, value) {
            val.infoFields.push({
                key: key,
                value: value
            });
        });

        return val;
    }));

    var VM = {
        images: ko.observableArray(credits.images)
    };

    return VM;
});