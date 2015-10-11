define(["jquery", "jquery.mobile", "knockout", "underscore", "classify"], function($, $mobile, ko, _, Classify) {
    var AttributeAccessor = Classify.newClass({
        constructor: function(config) {
            this.element = config.element;
        },
        methods: {
            get: function(accessor, defaultValue) {
                var val = this.element.getAttribute(accessor);

                if (val === null && defaultValue) {
                    return defaultValue;
                }
                else {
                    return val;
                }
            }
        }
    });

    ko.components.register("jqm-header", {
        viewModel: {
            createViewModel: function(params, componentInfo) {
                var innerHTML = componentInfo.templateNodes;
                var $element  = $(componentInfo.element);

                var VM = {
                    Home: function($root) {
                        if ( $root && $root.GoHome && typeof($root.GoHome) === 'function') {
                            $root.GoHome();
                        }
                    },
                    title:     ko.observable(params.title),
                    innerHTML: innerHTML,
                    jqmEnhance: function() {
                        var $root = $element;

                        var $buttons = $root.find('button').addClass("ui-btn ut-btn-inline ui-mini ui-corner-all");
                        $buttons.first().addClass("ui-btn-left  ui-btn-icon-left" );
                        $buttons.last( ).addClass("ui-btn-right ui-btn-icon-right");
                        $root.attr('data-enhance', null);
                        $root.enhanceWithin();
                    }
                };

                return VM;
            }
        },
        template: {
            require: "text!lib/jqm-easy/jqm-header.html"
        }
    });

    ko.components.register("jqm-footer", {
        viewModel: {
            createViewModel: function(params, componentInfo) {
                var innerHTML = componentInfo.templateNodes;
                var $element  = $(componentInfo.element);

                var VM = {
                    innerHTML: innerHTML,
                    jqmEnhance: function(elements) {
                        $element.attr('data-enhance', null);
                        $element.enhanceWithin();
                    }
                };

                return VM;
            }
        },
        template: {
            require: "text!lib/jqm-easy/jqm-footer.html"
        }
    });

    ko.components.register('jqm-panel', {
        viewModel: {
            createViewModel: function(params, componentInfo) {
                var innerHTML = componentInfo.templateNodes;
                var $element  = $(componentInfo.element);

                var attributes = new AttributeAccessor({element: componentInfo.element});

                var VM = {
                    innerHTML: innerHTML,
                    jqmEnhance: function(elements) {
                        var $panel = $element;
                        $panel.attr('data-enhance',  null);
                        $panel.attr('data-role',     'panel');
                        $panel.attr('data-position', attributes.get('side',    'left'));
                        $panel.attr('data-theme',    attributes.get('theme',   'a'));
                        $panel.attr('data-display',  attributes.get('display', 'overlay'));
                        $panel.enhanceWithin();
                        $panel.panel();
                    }
                };

                return VM;
            }
        },
        template: {
            require: "text!lib/jqm-easy/jqm-panel.html"
        }
    });
});