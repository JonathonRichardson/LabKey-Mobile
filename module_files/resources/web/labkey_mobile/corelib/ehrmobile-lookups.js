define(["jquery", "knockout", "underscore", "xlabkey", "classify", "lkhttp"], function($, ko, _, XLABKEY, Classify, LKHTTP) {
    var getAccessorFunction = function(accessor) {
        // If we're already a function, return that.
        if (_.isFunction(accessor)) {
            return accessor;
        }

        // Otherwise, assume we're a string that's the key for the row we want to access.
        return function(row) {
            return row[accessor];
        }
    };

    var LookupTable = Classify.newClass({
        constructor: function(config) {
            config = config || {};
            this.name          = config.name;
            this.queryName     = config.queryName;
            this.schemaName    = config.schemaName || 'ehr_lookups';
            this.ko$dataLoaded = ko.observable(false);

            this.getKeyFunction   = getAccessorFunction(config.keyAccessor);
            this.getValueFunction = getAccessorFunction(config.valueAccessor);

            this.data = {};
            this.ko$values = ko.observableArray();
        },
        methods: {
            loadData: function() {
                var self = this;

                return LKHTTP.selectRows(self.schemaName, self.queryName).then(function (data) {
                    _.each(data.rows, function (row, index, list) {
                        self.data[self.getKeyFunction(row)] = row;
                        self.ko$values.push({
                            key:   self.getKeyFunction(row),
                            value: self.getValueFunction(row)
                        });

                        return Promise.resolve();
                    });

                    self.ko$dataLoaded(true);
                });
            },
            getValue: function(code) {
                var self = this;

                // Return "" if this entry doesn't exist or we were given a bad code.
                if (!self.ko$dataLoaded() || _.isUndefined(code) || (code === null) || !(code in self.data)) {
                    return "";
                }

                // Try to figure out a value
                var returnVal = self.getValueFunction(self.data[code]);

                // Translate us to a string.
                if (_.isUndefined(returnVal) || (returnVal === null) ) {
                    return "";
                }
                else {
                    return returnVal;
                }
            }
        }
    });

    var SetOfLookupTables = Classify.newClass({
        constructor: function(config) {
            config = config || {};
            var self = this;
            this.lookupTables = ko.observableArray();
            this.eventToFire  = config.eventToFireOnCompletion;

            this._tableIndex = {};
        },
        methods: {
            loadAll: function() {
                var promises = [];
                $.each(this.lookupTables(), function(index, value) {
                    promises.push(value.loadData());
                });
                return Promise.all(promises);
            },
            addTable: function(config) {
                var newTable = new LookupTable(config);
                this.lookupTables.push(newTable);
                this._tableIndex[config.name] = newTable;
            },
            lookupValue: function(lookupTableName, key) {
                if ( !(lookupTableName in this._tableIndex) ) {
                    throw "Lookup table was not found in SetOfLookupTables.";
                }

                var table = this._tableIndex[lookupTableName];
                return table.getValue(key);
            }
        },
        computeds: {
            allLoaded: {
                'function': function() {
                    var allLoaded = true;
                    $.each(this.lookupTables(), function (index, table) {
                        if (!table.ko$dataLoaded()) {
                            allLoaded = false;
                        }
                    });
                    return allLoaded;
                },
                subscription: function(newValue) {
                    var self = this;

                    // Only fire when value switches to true.
                    if (newValue === true) {
                        if (_.isFunction(self.eventToFire)) {
                            self.eventToFire.call();
                        }
                        else {
                            if ((self.eventToFire !== null)
                                    && (!_.isUndefined(self.eventToFire))
                                    && (self.eventToFire !== "")
                            ) {
                                document.dispatchEvent(new CustomEvent(self.eventToFire));
                            }
                        }
                    }
                }
            },
            valueHash: function() {
                var hash = {};
                jQuery.each(this.lookupTables(), function(i, table) {
                    hash[table.name] = table;
                });

                return hash;
            }
        }
    });

    var Lookups = new SetOfLookupTables();

    Lookups.addTable({
        name: 'housing',
        queryName:  'housing_condition_codes',
        keyAccessor: 'value',
        valueAccessor: function(row) {
            if (row.description !== null) {
                return row.description;
            }
            else if (row.title !== null) {
                return row.title;
            }
        }
    });

    Lookups.addTable({
        name:          'assignments',
        queryName:     'avail_codes',
        keyAccessor:   'value',
        valueAccessor: 'description'
    });

    Lookups.addTable({
        name:          'sources',
        queryName:     'source',
        keyAccessor:   'code',
        valueAccessor: 'meaning'
    });

    Lookups.addTable({
        name:          'feces-observations',
        queryName:     'obs_feces',
        keyAccessor:   'value',
        valueAccessor: 'title'
    });

    Lookups.addTable({
        name:          'menses-observations',
        queryName:     'obs_mens',
        keyAccessor:   'value',
        valueAccessor: 'title'
    });

    Lookups.addTable({
        name:          'other-observations',
        queryName:     'obs_other',
        keyAccessor:   'value',
        valueAccessor: 'title'
    });

    Lookups.addTable({
        name:          'trauma-location-observations',
        queryName:     'obs_tlocation',
        keyAccessor:   'value',
        valueAccessor: 'value'
    });

    Lookups.addTable({
        name:          'breeding-observations',
        queryName:     'obs_breeding',
        keyAccessor:   'value',
        valueAccessor: 'title'
    });

    Lookups.addTable({
        name:          'behavior-observations',
        queryName:     'obs_behavior',
        keyAccessor:   'value',
        valueAccessor: 'title'
    });

    Lookups.addTable({
        name:          'status',
        schemaName:    'study',
        queryName:     'qcstate',
        keyAccessor:   'RowId',
        valueAcceesor: 'Label'
    });

    Lookups.addTable({
        name:          'rooms_and_areas',
        queryName:     'rooms',
        keyAccessor:   'room',
        valueAcceesor: 'area'
    });

    return Lookups;
});