define(["jquery", "jquery.mobile"], function($, mobile) {
    $.mobile = mobile;

    var load = function(name, parentRequire, onload, config) {
        $.get(name + ".html", function(data) {
            var $factory = $(document.createElement('div')).css('display', 'none');
            $('body').append($factory);
            $factory.html(data);
            $factory.enhanceWithin();
            onload($factory.html());
            $factory.remove();
        });
    };

    return {
        load: load
    }
});
