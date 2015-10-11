define(["knockout", "xlabkey", "underscore", "ehrmobile-lookups"], function(ko, XLABKEY, _, Lookups) {
    var VM = {
        urlparams: {
            animalid: ko.observable('')
        },
        animal: {
            Id:                    ko.observable(''),
            Gender:                ko.observable(),
            Room:                  ko.observable(),
            Cage:                  ko.observable(),
            NumberOfAnimalsInCage: ko.observable(),
            HousingConditionRaw:   ko.observable(),
            Age:                   ko.observable(),
            Source:                ko.observable(),
            CalculatedStatus:      ko.observable(),
            Sire:                  ko.observable(),
            Dam:                   ko.observable(),
            MostRecentArrival:     ko.observable(),
            MostRecentBehavior:    ko.observable(),
            MostRecentDeparture:   ko.observable(),
            MostRecentTBDate:      ko.observable(),
            Weight:                ko.observable(),
            MostRecentWeightDate:  ko.observable(),
            Birthdate:             ko.observable(),
            Death:                 ko.observable(),
            Hold:                  ko.observable(),
            Medical:               ko.observable(),
            Prepaid:               ko.observable(),
            Assignments:           ko.observableArray()
        },
        errorMessage: ko.observable(''),
        hasError: ko.observable(false)
    };

    VM.animalId = ko.computed({
        read: function() {
            return VM.urlparams.animalid();
        },
        write: function(value) {
            VM.urlparams.animalid(value);
        }
    });

    VM.LookupAnimal = function () {
        VM.LookupAnimalById(VM.animalId());
    };

    // Set it up so that when/if we load parameters from the URL, we immediately load the animal data.
    var initialSubscription = VM.urlparams.animalid.subscribe(function() {
        VM.LookupAnimal();
        initialSubscription.dispose();
    });

    VM.LookupAnimalById = function(id) {
        console.log("Looking up the following animal: ",id);
        $.mobile.loading("show");
        VM.UpdateAnimal();

        XLABKEY.Query.selectRows({
            schemaName: "study",
            queryName: "demographics",
            viewName: "Abstract",
            filterArray: [
                LABKEY.Filter.create('Id', id)
            ],
            success: function (data) {
                console.log("success", data);
                if (data.rows.length === 0 ) {
                    VM.hasError(true);
                    VM.UpdateAnimal();
                    VM.errorMessage(id + ' is not a valid animal id.');
                }
                else if (data.rows.length > 1) {
                    VM.hasError(true);
                    VM.UpdateAnimal();
                    VM.errorMessage("An Unknown error occurred.")
                }
                else {
                    VM.hasError(false);
                    VM.errorMessage('');
                    VM.UpdateAnimal(data.rows[0]);
                }
                $.mobile.loading("hide");
            },
            failure: function (errorInfo) {
                console.log("failed", errorInfo);
                $.mobile.loading("hide");
            }
        })
    };

    VM.UpdateAnimal = function(info) {
        if (_.isUndefined(info) || info.Id == '' ) {
            info = { Id: '' };
        }
        VM.animal.Id(info.Id);
        VM.animal.Gender(info.gender);
        VM.animal.Room(info['Id/curLocation/room']);
        VM.animal.Cage(info['Id/curLocation/cage']);
        VM.animal.HousingConditionRaw(info['Id/curLocation/cond']);
        VM.animal.NumberOfAnimalsInCage(info['Id/numRoommates/AnimalsInCage']);
        VM.animal.Age(info['Id/age/AgeFriendly']);
        VM.animal.CalculatedStatus(info['calculated_status']);
        VM.animal.Source(info['origin']);
        VM.animal.Sire(info['sire'] || '');
        VM.animal.Dam(info['dam'] || '');
        VM.animal.MostRecentArrival(info['Id/MostRecentArrival/MostRecentArrival']);
        VM.animal.MostRecentBehavior(info['Id/MostRecentBehav/MostRecentBehav']);
        VM.animal.MostRecentDeparture(info['Id/MostRecentDeparture/MostRecentDeparture']);
        VM.animal.MostRecentTBDate(info['Id/MostRecentTB/MostRecentTBDate']);
        VM.animal.Weight(info['Id/MostRecentWeight/MostRecentWeight']);
        VM.animal.MostRecentWeightDate(info['Id/MostRecentWeight/MostRecentWeightDate']);
        VM.animal.Birthdate(info['birth']);
        VM.animal.Death(info['death']);
        VM.animal.Hold(info['hold']);
        VM.animal.Medical(info['medical']);
        VM.animal.Prepaid(info['prepaid']);

        _.each(info['Id/activeAssignments/Availability'], function(element, index, list) {
            var types = element.split(/,/);
            types = _.map(types, function(value, index, list) {
                return Lookups.lookupValue('assignments', value);
            });

            VM.animal.Assignments.push({
                Types: ko.observableArray(types)
            });
        });
    };

    VM.animal.HousingCondition = ko.computed(function() {
        return  Lookups.lookupValue('housing', ko.unwrap(VM.animal.HousingConditionRaw));
    });
    VM.animal.RoommateText = ko.computed(function() {
        var text = "";
        var numRoomates = VM.animal.NumberOfAnimalsInCage() - 1;

        if ( numRoomates === 0 ) {
            text = "no roomates"
        }
        else {
            text = numRoomates.toString() + " roomates";
        }

        return text;
    });
    VM.animal.IsDead = ko.computed(function(){
        if ( VM.animal.CalculatedStatus() === 'Dead') {
            return true;
        }
        else {
            return false;
        }
    });
    VM.animal.IsInCage = ko.computed(function(){
        var status = VM.animal.CalculatedStatus();
        if ( (status === "Dead") || (status === "Shipped") ){
            return false;
        }
        return true;
    });
    VM.animal.DisplaySource = ko.computed(function() {
        return Lookups.lookupValue('sources', ko.unwrap(VM.animal.Source));
    });

    VM.animalDataLoaded = ko.computed(function() {
        return (VM.animal.Id() != '');
    });
    VM.animal.HasAssignments = ko.computed(function() {
        return (VM.animal.Assignments().length > 0);
    });

    return VM;
});