var str = require("../lib/xvstring");
var xvtype = require("xvtype");
var n = require("xvnode");
var s = require("xvseq");
const assert = require('assert');

function assertEq(a,b){
	assert.deepStrictEqual(a.toJS(),b.toJS(),`${a} is not equal to ${b}`);
}

assertEq(str.stringJoin(
	n.element("root",[
		n.element("a",n.text("bla")),
		n.element("b",n.text("bli"))
	])
),s.seq("blabli"));

assertEq(str.stringToCodepoints("abc"),s.seq(97,98,99));

assertEq(str.codepointsToString(s.seq(97,98,99)),s.seq("abc"));

assertEq(str.matches("bla","^bla$"),s.seq(true));

assertEq(str.replace("bla","l","x"),s.seq("bxa"));

console.log("all tests passed");
