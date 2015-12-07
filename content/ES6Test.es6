import * as es6test from "es6test";
import * as ko from "knockout";

var tests = ko.observableArray([
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

_.each(tests(), function(testObj) {
    testObj.result = testObj.test();
});

var y = async function() {
    var data = await $.get("");
    VM.title += data;
};

export { tests, y };