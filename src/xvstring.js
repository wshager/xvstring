import XRegExp from "xregexp";

import { seq, toSeq, _isSeq, _first, subsequence, remove, head, tail, count, reverse, insertBefore, string } from "xvtype";

import { element, attribute, text, _isNode } from "xvnode";

function cache(depth){
	var c = function(){
		this.depth = depth || 1;
		this.memo = {};
	};
	c.prototype.get = function(...a){
		if(a.length !== this.depth) throw new Error("Cache 'get' received incorrect number of arguments");
		var k, target = this.memo;
		while(a.length) {
			k = a.shift();
			target = target[k];
		}
		return target;
	};
	c.prototype.has = function(...a){
		if(a.length !== this.depth) throw new Error("Cache 'has' received incorrect number of arguments");
		var ret;
		var k, target = this.memo;
		while(a.length) {
			k = a.shift();
			ret = k in target;
			if(!ret) break;
			target = target[k];
		}
		return ret;
	};
	c.prototype.set = function(...a){
		if(a.length !== this.depth+1) throw new Error("Cache 'set' received incorrect number of arguments");
		var k, target = this.memo;
		while(a.length>2) {
			k = a.shift();
			if(!target[k]) target[k] = {};
			target = target[k];
		}
		k = a.shift();
		target[k] = a.shift();
		return target[k];
	};
	return new c();
}

export function analyzeString($str,$pat) {
	var str = _first(string($str));
	let pat = XRegExp(_first($pat),"g");
    var ret = [];
	var index = 0;
	if(str){
		str = str.toString();
		XRegExp.replace(str,pat,function(... a){
			var match = a.shift();
			var str = a.pop();
			var idx = a.pop();
			// the rest is groups
			if(idx > index) ret = ret.concat(element("fn:non-match",text(str.substring(index,idx))));
			index = idx + match.length;
			if(a.length > 0) {
				var c = [];
				a.forEach(function (_, i) {
					if (_ !== undefined) {
						// nest optional groups that are empty
						// TODO nested groups
						if(_ !== "") {
							c.push(element("fn:group",seq(attribute("nr",Number(i+1)),text(_))));
						} else {
							var last = c.length ? c[c.length-1] : c;
							last.push(element("fn:group",seq(attribute("nr",Number(i+1)))));
						}
					}
				});
				var e = element("fn:match",c);
				ret = ret.concat(e);
			} else if(match) {
				ret = ret.concat(element(seq("fn:match"),text(match)));
			}
		});
		if(index < str.length) ret.push(element("fn:non-match",text(str.substr(index))));
	}
	return element("fn:analyze-string-result",ret);
}

export function tokenize($str,$pat) {
	var str = _first(string($str));
	let pat = XRegExp(_first($pat),"g");
    var ret = seq();
	if(str) {
        str.toString().split(pat).forEach(s => {
            ret = ret.concat(String(s));
        });
    }
    return ret;
}

export function substring($_,$s,$l) {
	var _ = _first(string($_)),
		s = Math.round(_first($s)) - 1;
	if(!$l) return _.substring(s);
	var l = _first($l);
	return _.substring(s,s + Math.round(l));
}

export function stringToCodepoints($str){
	var str = _first($str);
	var ret = [];
	for(var i=0;i<str.length;i++){
		ret[i] = str.codePointAt(i);
	}
	return toSeq(ret);
}

export function codepointsToString($seq){
	return seq($seq.reduce((acc,_) => acc + String.fromCodePoint(_),""));
	//return seq($seq.map(_ => String.fromCodePoint(_)).join(""));
}

export function upperCase($str) {
	return seq(_first($str).toUpperCase());
}

export function lowerCase($str) {
	return seq(_first($str).toLowerCase());
}

export function normalizeSpace($str) {
	return seq(_first($str).replace(/^[\x20\x9\xD\xA]+|[\x20\x9\xD\xA]+$/g,"").replace(/[\x20\x9\xD\xA]+/g," "));
}

export function matches($str,$pat) {
    var str = _first(string($str));
	var pat = _first($pat);
	if(pat === undefined) return error("xxx");
	var _cache = matches._cache = matches._cache || cache(2);
    str = _isNode(str) ? str.data() : str;
	if(str === undefined) return seq(false);
	str = str.toString();
	pat = pat.toString();
    var ret;
    if(!_cache.has(pat,str)){
        ret = _cache.set(str,pat,XRegExp(pat,"g").test(str));
    } else {
        ret = _cache.get(str,pat);
    }
    return seq(ret);
}

export function replace($str,$pat,$rep) {
	var str = _first(string($str)),
    	pat = _first($pat),
    	rep = _first($rep);
	if(pat === undefined || rep === undefined) return error("xxx");
	if(str === undefined) return seq();
    var rc = replace.repCache = replace.repCache ? replace.repCache : {};
    if(!rc[rep]){
        rc[rep] = rep.toString().replace(/(^|[^\\])\\\$/g,"$$$$").replace(/\\\\\$/g,"\\$$");
    }
	str = str.toString();
	pat = pat.toString();
    /*if(!pc[pat]){
        pc[pat] = XRegExp.cache(pat,"g");
    }*/
	var ret;
    var _cache = replace.cache = replace.cache || cache(3);
    if(!_cache.has(str,pat,rep)) {
        ret = _cache.set(str,pat,rep,XRegExp.replace(str,XRegExp(pat,"g"),rc[rep],"all"));
    } else {
        ret = _cache.get(str,pat,rep);
    }
	return seq(ret);
}


const regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

export function stringLength($str) {
	let str = _first(string($str));
	return seq(str !== undefined ? str.replace(regexAstralSymbols,"_").toString().length : 0);
}

export function stringJoin($seq,$sep) {
	let sep = _first($sep);
	return seq(string($seq).join(sep !== undefined ? sep : ""));
}

export function concat(... a){
    return seq(string(toSeq(a)).join(""));
}

export function normalizeUnicode($str,$form) {
	var str = _first($str);
	var form = _first($form);
	return !str ? seq() : seq(!form ? str.normalize() : str.normalize(form.toUpperCase()));
}
