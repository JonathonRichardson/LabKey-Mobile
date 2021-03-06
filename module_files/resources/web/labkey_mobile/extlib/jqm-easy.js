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

    ko.bindingHandlers.tap = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            $(element).on("click", valueAccessor());
        },
        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {}
    };

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
            require: "text!../extlib/jqm-easy/jqm-header.html"
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
            require: "text!../extlib/jqm-easy/jqm-footer.html"
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
            require: "text!../extlib/jqm-easy/jqm-panel.html"
        }
    });

    var noOp = function(){};

    ko.components.register('jqm-listview', {
        viewModel: {
            createViewModel: function(params, componentInfo) {
                params = params || {};
                var $element  = $(componentInfo.element);
                var $listview = $element.find('[data-role="listview"]');
                var attributes = new AttributeAccessor({element: componentInfo.element});

                var inset = false;
                if (attributes.get('inset') == "true") {
                    inset = true;
                }

                var split = false;
                if (attributes.get('split') == "true") {
                    split = true;
                }

                var splitIcon = "arrow-r";
                if ( attributes.get('split-icon') !== null ) {
                    splitIcon = attributes.get('split-icon')
                }

                // Check if we were passed an observableArray.  If not, turn it into one.
                if (!ko.isObservable(params.listitems)) {
                    // Ensure the contents are an array
                    if ( !_.isArray(ko.unwrap(params.listitems)) ) {
                        params.listitems = [params.listitems];
                    }

                    params.listitems = ko.observableArray(params.listitems)
                }
                else if ( !('push' in params.listitems) ){
                    params.listitems = ko.observableArray(ko.unwrap(params.listitems));
                }

                var VM = {
                    listitems: params.listitems,
                    jqmEnhance: function() {
                        $listview.listview({
                            inset: inset,
                            splitIcon: splitIcon
                        });

                        params.listitems.subscribe(function() {
                            $listview.listview('refresh');
                        });
                    },
                    split: ko.observable(split)
                };

                return VM;
            }
        },
        template: {
            require: "text!../extlib/jqm-easy/jqm-listview.html"
        }
    });

    ko.components.register('jqm-select', {
        viewModel: {
            createViewModel: function(params, componentInfo) {
                var $element = $(componentInfo.element);
                var $select  = $element.find('select');

                var VM = {
                    options: params.options,
                    placeholder: params.placeholder || "",
                    value: params.value || ko.observable(),
                    jqmEnhance: function() {
                        $select.selectmenu();

                        params.options.subscribe(function() {
                            $select.selectmenu('refresh');
                        });
                    }
                };

                return VM;
            }
        },
        template: {
            require: "text!../extlib/jqm-easy/jqm-select.html"
        }
    });

    ko.observable.fn.withPausing = function() {
        this.notifySubscribers = function() {
            if (!this.pauseNotifications) {
                ko.subscribable.fn.notifySubscribers.apply(this, arguments);
            }
        };

        this.sneakyUpdate = function(newValue) {
            this.pauseNotifications = true;
            this(newValue);
            this.pauseNotifications = false;
        };

        return this;
    };

    function generateUUID(){
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    }

    ko.components.register('jqm-popup', {
        viewModel: {
            createViewModel: function(params, componentInfo) {
                var $element  = $(componentInfo.element);
                var innerHTML = componentInfo.templateNodes;

                var $popup;

                var open = ko.observable(false).withPausing();
                if ( ('open' in params) && ko.isObservable(params.open) ) {
                    open = params.open.withPausing();
                }

                var VM = {
                    innerVM:    params.innerVM || {},
                    open:       open,
                    id:         generateUUID(),
                    innerHTML:  innerHTML,
                    jqmEnhance: function(elements) {
                        $popup = $element.find('.popupTarget').popup({
                            afterclose: function() {
                                open.sneakyUpdate(false);
                            }
                        });

                        open.subscribe(function(value){
                            if ( value === true ) {
                                $popup.popup('open');
                            }
                            else {
                                $popup.popup('close');
                            }
                        });

                        if (open()) {
                            $popup.popup('open');
                        }
                    }
                };

                return VM;
            }
        },
        template: {
            require: "text!../extlib/jqm-easy/jqm-popup.html"
        }
    });

    ko.components.register('jqm-button', {
       viewModel: {
           createViewModel: function(params, componentInfo) {
               var $element  = $(componentInfo.element);
               var innerHTML = componentInfo.templateNodes;
               var attributes = new AttributeAccessor({element: componentInfo.element});

               var inline = false;
               if (attributes.get('inline') == "true") {
                   inline = true;
               }

               var getInitializedButton = function() {
                   return $element.find('.buttonTarget').button({
                       inline:   inline,
                       enhanced: true,
                       theme:    'a'
                   });
               };

               var disableButton = function() {
                   getInitializedButton().button('disable');
               };
               var enableButton = function() {
                   getInitializedButton().button('enable');
               };

               if (ko.isObservable(params.disabled)) {
                   params.disabled.subscribe(function(value) {
                       if (value) {
                           disableButton();
                       }
                       else {
                           enableButton();
                       }
                   });
               }
               else {
                   // If we didn't pass in a disabled function, get one that leaves the button always enabled.
                   params.disabled = function() {
                       return false;
                   }
               }

               // Ensure we have a function.
               if(!_.isFunction(params.click)) {
                   params.click = function() {};
               }

               var VM = {
                   innerHTML: innerHTML,
                   tap: params.click,
                   jqmEnhance: function(elements) {
                       $element.attr('data-enhance', null);
                       var $button = getInitializedButton();

                       // Not sure why, but the buttom initialization seems to ignore the inline option, so we force
                       // it manually here.
                       if (!inline) {
                           $button.button({inline: false});
                       }

                       if (params.disabled()) {
                           $button.button('disable');
                       }
                   }
               };

               return VM;
           }
       },
        template: {
            require: "text!../extlib/jqm-easy/jqm-button.html"
        }
    });
});