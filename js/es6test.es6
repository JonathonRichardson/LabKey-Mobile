define([],function() {
    var returnObj = {};

    var interpolatedWord = "success";
    returnObj.stringTest = `This is a ${interpolatedWord}!`;

    returnObj.generator123 = function* () {
        yield 1;
        yield 2;
        return 3;
    };

    return returnObj;
});