define(["jquery", "underscore", "knockout", "xlabkey", "knockout.switch", "knockout.punches"], function($, _, ko, XLABKEY) {
    var Cage = function(room, cage, animals, VM) {
        var self = this;
        this.room    = ko.observable(room);
        this.cage    = ko.observable(cage);
        this.animals = ko.observableArray(animals);
        this.VM = VM;
        this.visible = ko.computed(function() {
            if ( self.VM && 'view' in self.VM && 'selectedCage' in self.VM) {
                if ( (VM.view() === 'perCage') && (VM.selectedCage() !== self.cage()) ) {
                    return false;
                }
                else {
                    return true;
                }
            }
            else {
                return true;
            }
        });
    };

    var Animal = function(config) {
        this.Id = ko.observable(config.id);
        this.demographics = config.demographics;
    };

    console.log("starting irreg obs", ko);
    var VM = {
        view: ko.observable(),
        selectRoom: function() {
            VM.getRoomData();
        },
        cages: ko.observableArray(),
        selectedRoom: ko.observable(''),
        getRoomData: function() {
            XLABKEY.Query.selectRows({
                schemaName: "study",
                queryName: "demographicsCurLocation",
                filterArray: [
                    LABKEY.Filter.create('room', VM.selectedRoom())
                ],
                success: function (data) {
                    console.log("success", data);
                    if (data.rows.length === 0 ) {
                        console.error("no animals found");
                    }
                    else if (data.rows.length > 1) {
                        var cageBuckets = {};
                        $.each(data.rows, function(index, animalRow) {
                            var cageid = animalRow.cage;

                            if ( !(cageid in cageBuckets ) ) {
                                cageBuckets[cageid] = new Cage(animalRow.room, cageid, [animalRow], VM);
                            }
                            else {
                                console.log(animalRow);
                                cageBuckets[cageid].animals.push(new Animal({id: animalRow.Id, demographics: animalRow}));
                            }
                        });

                        // TODO: this is very inefficient.  Use splice instead.
                        var cages = _.sortBy(_.values(cageBuckets), function(cage) {
                            return parseInt(ko.unwrap(cage.cage), 10)
                        });

                        $.each(cages, function(index, value) {
                            VM.cages.push(value);
                        });
                    }
                },
                failure: function (errorInfo) {
                    console.log("failed", errorInfo);
                }
            })
        },
        step: ko.observable(0)
    };

    VM.selectedCageIndex = ko.observable(0);

    VM.selectedCage = ko.computed(function() {
        var cage = VM.cages()[VM.selectedCageIndex()];

        if ( cage && 'cage' in cage ) {
            return cage.cage();
        }
        else {
            return 0;
        }
    });

    VM.SelectCage = function() {

    };

    VM.PreviousCage = function() {
        VM.selectedCageIndex(VM.selectedCageIndex() - 1);
        console.log(VM.selectedCage());
    };

    VM.NextCage = function() {
        VM.selectedCageIndex(VM.selectedCageIndex() + 1);
    };

    VM.ToggleView = function() {
        if ( this.view() === 'perCage' ) {
            this.view('');
        }
        else {
            this.view('perCage');
        }
    };

    return VM;
});
