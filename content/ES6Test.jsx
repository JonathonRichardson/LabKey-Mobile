define(['es6test', 'knockout'], function(es6test, ko) {
    var VM = {};

    VM.tests = ko.observableArray([
        {
            name: "String Interpolation Test",
            test: function() {
                if (es6test.stringTest === "This is a success!") {
                    return true;
                }
                return false;
            }
        },
        {
            name: "Generator Test",
            test: function() {
                var gen = es6test.generator123();

                var retVal = gen.next();
                if ( (retVal.value !== 1) || (retVal.done !== false) ) {
                    return false
                }

                retVal = gen.next();
                if ( (retVal.value !== 2) || (retVal.done !== false) ) {
                    return false
                }

                retVal = gen.next();
                if ( (retVal.value !== 3) || (retVal.done !== true) ) {
                    return false
                }

                return true;
            }
        }
    ]);

    _.each(VM.tests(), function(testObj) {
        testObj.result = testObj.test();
    });

    VM.y = async function() {
        var data = await $.get("")
        VM.title += data;
    };

    console.log("JSX!!!!", VM);

    return VM;
});