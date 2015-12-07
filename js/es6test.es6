var interpolatedWord = "success";
var stringTest = `This is a ${interpolatedWord}!`;

var generator123 = function* () {
    yield 1;
    yield 2;
    return 3;
};

export {generator123, stringTest};