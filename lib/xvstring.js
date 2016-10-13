"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.analyzeString = analyzeString;
exports.tokenize = tokenize;
exports.substring = substring;
exports.stringToCodepoints = stringToCodepoints;
exports.codepointsToString = codepointsToString;
exports.matches = matches;
exports.replace = replace;
exports.stringLength = stringLength;
exports.stringJoin = stringJoin;
exports.concat = concat;

var _xregexp = require("xregexp");

var _xregexp2 = _interopRequireDefault(_xregexp);

var _xvseq = require("xvseq");

var _xvnode = require("xvnode");

var _xvtype = require("xvtype");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function cache(depth) {
	var c = function c() {
		this.depth = depth || 1;
		this.memo = {};
	};
	c.prototype.get = function () {
		for (var _len = arguments.length, a = Array(_len), _key = 0; _key < _len; _key++) {
			a[_key] = arguments[_key];
		}

		if (a.length !== this.depth) throw new Error("Cache 'get' received incorrect number of arguments");
		var k,
		    target = this.memo;
		while (a.length) {
			k = a.shift();
			target = target[k];
		}
		return target;
	};
	c.prototype.has = function () {
		for (var _len2 = arguments.length, a = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
			a[_key2] = arguments[_key2];
		}

		if (a.length !== this.depth) throw new Error("Cache 'has' received incorrect number of arguments");
		var ret;
		var k,
		    target = this.memo;
		while (a.length) {
			k = a.shift();
			ret = target.hasOwnProperty(k);
			if (!ret) break;
			target = target[k];
		}
		return ret;
	};
	c.prototype.set = function () {
		for (var _len3 = arguments.length, a = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
			a[_key3] = arguments[_key3];
		}

		if (a.length !== this.depth + 1) throw new Error("Cache 'set' received incorrect number of arguments");
		var k,
		    target = this.memo;
		while (a.length > 2) {
			k = a.shift();
			if (!target[k]) target[k] = {};
			target = target[k];
		}
		k = a.shift();
		target[k] = a.shift();
		return target[k];
	};
	return new c();
}

function analyzeString($str, $pat) {
	var pat = _xregexp2.default.cache((0, _xvseq._first)($pat), "g");
	var str = (0, _xvseq._first)($str);
	var ret = [];
	var index = 0;
	_xregexp2.default.replace(str, pat, function () {
		for (var _len4 = arguments.length, a = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
			a[_key4] = arguments[_key4];
		}

		var match = a.shift();
		var str = a.pop();
		var idx = a.pop();
		// the rest is groups
		if (idx > index) ret = ret.concat((0, _xvnode.element)("fn:non-match", (0, _xvnode.text)(str.substring(index, idx))));
		index = idx + match.length;
		if (a.length > 0) {
			var c = a.reduce(function (pre, _, i) {
				if (_ !== undefined) {
					return pre.concat((0, _xvnode.element)("fn:group", (0, _xvseq.seq)((0, _xvnode.attribute)("nr", i + 1 + ""), (0, _xvnode.text)(_))));
				} else {
					return pre;
				}
			}, (0, _xvseq.seq)());
			var e = (0, _xvnode.element)("fn:match", c);
			ret = ret.concat(e);
		} else if (match) {
			ret = ret.concat((0, _xvnode.element)((0, _xvseq.seq)("fn:match"), (0, _xvnode.text)(match)));
		}
	});
	if (index < str.length) ret.push((0, _xvnode.element)("fn:non-match", (0, _xvnode.text)(str.substr(index))));
	return (0, _xvnode.element)("fn:analyze-string-result", ret);
}

function tokenize($str, $pat) {
	var pat = _xregexp2.default.cache((0, _xvseq._first)($pat), "g");
	var ret = (0, _xvseq.seq)();
	var str = (0, _xvseq._first)($str).valueOf();
	if (str !== "") {
		str.split(pat).forEach(function (s) {
			ret = ret.concat(String(s));
		});
	}
	return ret;
}

function substring($_, $a, $b) {
	return item($_).map(function (_) {
		return _.substring((0, _xvseq._first)($a), (0, _xvseq._first)($b));
	});
}

function stringToCodepoints($str) {
	return (0, _xvseq.toSeq)((0, _xvseq._first)($str).split("")).map(function (a) {
		return a.codePointAt();
	});
}

function codepointsToString($seq) {
	return (0, _xvseq.seq)($seq.map(function (_) {
		return String.fromCodePoint(_);
	}).join(""));
}

function matches($str, $pat) {
	var pat = _xregexp2.default.cache((0, _xvseq._first)($pat), "g");
	var str = (0, _xvseq._first)((0, _xvtype.string)($str)).valueOf();
	var _cache = matches._cache = matches._cache || cache(2);
	str = (0, _xvnode._isNode)(str) ? str.data() : str;
	if (str === undefined) return false;
	var ret;
	if (!_cache.has(pat.source, str)) {
		ret = _cache.set(str, pat.source, pat.test(str));
	} else {
		ret = _cache.get(str, pat.source);
	}
	return (0, _xvseq.seq)(ret);
}

function replace($str, $pat, $rep) {
	var pat = (0, _xvseq._first)($pat).valueOf();
	var rep = (0, _xvseq._first)($rep).valueOf();
	var str = (0, _xvseq._first)((0, _xvtype.string)($str)).valueOf();
	var rc = replace.repCache = replace.repCache ? replace.repCache : {};
	//var pc = replace.patCache = replace.patCache ? replace.patCache : {};
	if (!rc[rep]) {
		rc[rep] = rep.replace(/(^|[^\\])\\\$/g, "$$$$").replace(/\\\\\$/g, "\\$$");
	}
	/*if(!pc[pat]){
     pc[pat] = XRegExp.cache(pat,"g");
 }*/
	var ret;
	var _cache = replace.cache = replace.cache || cache(3);
	if (!_cache.has(str, pat, rep)) {
		ret = _cache.set(str, pat, rep, _xregexp2.default.replace(str, pat, rc[rep]));
	} else {
		ret = _cache.get(str, pat, rep);
	}
	return (0, _xvseq.seq)(ret);
}

function stringLength($_) {
	return item($_).map(function (_) {
		return _.length;
	});
}

function stringJoin($seq, $sep) {
	var sep = (0, _xvseq._first)($sep);
	return (0, _xvseq.seqOf)((0, _xvtype.string)($seq).join(sep !== undefined ? sep : ""));
}

function concat() {
	for (var _len5 = arguments.length, a = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
		a[_key5] = arguments[_key5];
	}

	return (0, _xvseq.seqOf)((0, _xvtype.string)((0, _xvseq.toSeq)(a)).flatten(true).join(""));
}