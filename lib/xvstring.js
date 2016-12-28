"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.analyzeString = analyzeString;
exports.tokenize = tokenize;
exports.substring = substring;
exports.stringToCodepoints = stringToCodepoints;
exports.codepointsToString = codepointsToString;
exports.upperCase = upperCase;
exports.lowerCase = lowerCase;
exports.matches = matches;
exports.replace = replace;
exports.stringLength = stringLength;
exports.stringJoin = stringJoin;
exports.concat = concat;

var _xregexp = require("xregexp");

var _xregexp2 = _interopRequireDefault(_xregexp);

var _xvtype = require("xvtype");

var _xvnode = require("xvnode");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function cache(depth) {
	var c = function () {
		this.depth = depth || 1;
		this.memo = {};
	};
	c.prototype.get = function (...a) {
		if (a.length !== this.depth) throw new Error("Cache 'get' received incorrect number of arguments");
		var k,
		    target = this.memo;
		while (a.length) {
			k = a.shift();
			target = target[k];
		}
		return target;
	};
	c.prototype.has = function (...a) {
		if (a.length !== this.depth) throw new Error("Cache 'has' received incorrect number of arguments");
		var ret;
		var k,
		    target = this.memo;
		while (a.length) {
			k = a.shift();
			ret = k in target;
			if (!ret) break;
			target = target[k];
		}
		return ret;
	};
	c.prototype.set = function (...a) {
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
	var str = (0, _xvtype._first)((0, _xvtype.string)($str));
	let pat = (0, _xregexp2.default)((0, _xvtype._first)($pat), "g");
	var ret = [];
	var index = 0;
	if (str) {
		str = str.toString();
		_xregexp2.default.replace(str, pat, function (...a) {
			var match = a.shift();
			var str = a.pop();
			var idx = a.pop();
			// the rest is groups
			if (idx > index) ret = ret.concat((0, _xvnode.element)("fn:non-match", (0, _xvnode.text)(str.substring(index, idx))));
			index = idx + match.length;
			if (a.length > 0) {
				var c = [];
				a.forEach(function (_, i) {
					if (_ !== undefined) {
						// nest optional groups that are empty
						// TODO nested groups
						if (_ !== "") {
							c.push((0, _xvnode.element)("fn:group", (0, _xvtype.seq)((0, _xvnode.attribute)("nr", Number(i + 1)), (0, _xvnode.text)(_))));
						} else {
							var last = c.length ? c[c.length - 1] : c;
							last.push((0, _xvnode.element)("fn:group", (0, _xvtype.seq)((0, _xvnode.attribute)("nr", Number(i + 1)))));
						}
					}
				});
				var e = (0, _xvnode.element)("fn:match", c);
				ret = ret.concat(e);
			} else if (match) {
				ret = ret.concat((0, _xvnode.element)((0, _xvtype.seq)("fn:match"), (0, _xvnode.text)(match)));
			}
		});
		if (index < str.length) ret.push((0, _xvnode.element)("fn:non-match", (0, _xvnode.text)(str.substr(index))));
	}
	return (0, _xvnode.element)("fn:analyze-string-result", ret);
}

function tokenize($str, $pat) {
	var str = (0, _xvtype._first)((0, _xvtype.string)($str));
	let pat = (0, _xregexp2.default)((0, _xvtype._first)($pat), "g");
	var ret = (0, _xvtype.seq)();
	if (str) {
		str.toString().split(pat).forEach(s => {
			ret = ret.concat(String(s));
		});
	}
	return ret;
}

function substring($_, $s, $l) {
	var _ = (0, _xvtype._first)((0, _xvtype.string)($_)),
	    s = Math.round((0, _xvtype._first)($s)) - 1;
	if (!$l) return _.substring(s);
	var l = (0, _xvtype._first)($l);
	return _.substring(s, s + Math.round(l));
}

function stringToCodepoints($str) {
	return (0, _xvtype.toSeq)((0, _xvtype._first)((0, _xvtype.string)($str)).split("")).map(a => a.codePointAt());
}

function codepointsToString($seq) {
	return (0, _xvtype.seq)($seq.reduce((acc, _) => acc + String.fromCodePoint(_), ""));
	//return seq($seq.map(_ => String.fromCodePoint(_)).join(""));
}

function upperCase($str) {
	return (0, _xvtype.seq)((0, _xvtype._first)($str).toUpperCase());
}

function lowerCase($str) {
	return (0, _xvtype.seq)((0, _xvtype._first)($str).toLowerCase());
}

function matches($str, $pat) {
	var str = (0, _xvtype._first)((0, _xvtype.string)($str));
	var pat = (0, _xvtype._first)($pat);
	if (pat === undefined) return error("xxx");
	var _cache = matches._cache = matches._cache || cache(2);
	str = (0, _xvnode._isNode)(str) ? str.data() : str;
	if (str === undefined) return (0, _xvtype.seq)(false);
	str = str.toString();
	pat = pat.toString();
	var ret;
	if (!_cache.has(pat, str)) {
		ret = _cache.set(str, pat, (0, _xregexp2.default)(pat, "g").test(str));
	} else {
		ret = _cache.get(str, pat);
	}
	return (0, _xvtype.seq)(ret);
}

function replace($str, $pat, $rep) {
	var str = (0, _xvtype._first)((0, _xvtype.string)($str)),
	    pat = (0, _xvtype._first)($pat),
	    rep = (0, _xvtype._first)($rep);
	if (pat === undefined || rep === undefined) return error("xxx");
	if (str === undefined) return (0, _xvtype.seq)();
	var rc = replace.repCache = replace.repCache ? replace.repCache : {};
	if (!rc[rep]) {
		rc[rep] = rep.toString().replace(/(^|[^\\])\\\$/g, "$$$$").replace(/\\\\\$/g, "\\$$");
	}
	str = str.toString();
	pat = pat.toString();
	/*if(!pc[pat]){
     pc[pat] = XRegExp.cache(pat,"g");
 }*/
	var ret;
	var _cache = replace.cache = replace.cache || cache(3);
	if (!_cache.has(str, pat, rep)) {
		ret = _cache.set(str, pat, rep, _xregexp2.default.replace(str, (0, _xregexp2.default)(pat, "g"), rc[rep], "all"));
	} else {
		ret = _cache.get(str, pat, rep);
	}
	return (0, _xvtype.seq)(ret);
}

function stringLength($str) {
	let str = (0, _xvtype._first)((0, _xvtype.string)($str));
	return (0, _xvtype.seq)(str !== undefined ? str.toString().length : 0);
}

function stringJoin($seq, $sep) {
	let sep = (0, _xvtype._first)($sep);
	return (0, _xvtype.seq)((0, _xvtype.string)($seq).join(sep !== undefined ? sep : ""));
}

function concat(...a) {
	return (0, _xvtype.seq)((0, _xvtype.string)((0, _xvtype.toSeq)(a)).join(""));
}