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
			ret = target.hasOwnProperty(k);
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
	let pat = XRegExp.cache(_first($pat),"g");
    let str = _first($str);
	var ret = [];
	var index = 0;
	XRegExp.replace(str,pat,function(... a){
		var match = a.shift();
		var str = a.pop();
		var idx = a.pop();
		// the rest is groups
		if(idx > index) ret = ret.concat(element("fn:non-match",text(str.substring(index,idx))));
		index = idx + match.length;
		if(a.length > 0) {
			var c = a.reduce(function(pre,_,i){
				if(_ !== undefined) {
					return pre.concat(element("fn:group",seq(attribute("nr",i+1+""),text(_))));
				} else {
					return pre;
				}
			},seq());
			var e = element("fn:match",c);
			ret = ret.concat(e);
		} else if(match) {
			ret = ret.concat(element(seq("fn:match"),text(match)));
		}
	});
	if(index < str.length) ret.push(element("fn:non-match",text(str.substr(index))));
	return  element("fn:analyze-string-result",ret);
}

export function tokenize($str,$pat) {
	let pat = XRegExp.cache(_first($pat),"g");
    var ret = seq();
	let str = _first($str).valueOf();
    if(str !== "") {
        str.split(pat).forEach(s => {
            ret = ret.concat(String(s));
        });
    }
    return ret;
}

export function substring($_,$a,$b) {
	return item($_).map(function(_) { return _.substring(_first($a),_first($b));});
}

export function stringToCodepoints($str){
	return toSeq(_first($str).split("")).map(a => a.codePointAt());
}

export function codepointsToString($seq){
	return seq($seq.map(_ => String.fromCodePoint(_)).join(""));
}

export function matches($str,$pat) {
    let pat = XRegExp.cache(_first($pat),"g");
	let str = _first(string($str)).valueOf();
	var _cache = matches._cache = matches._cache || cache(2);
    str = _isNode(str) ? str.data() : str;
	if(str === undefined) return false;
    var ret;
    if(!_cache.has(pat.source,str)){
        ret = _cache.set(str,pat.source,pat.test(str));
    } else {
        ret = _cache.get(str,pat.source);
    }
    return seq(ret);
}

export function replace($str,$pat,$rep) {
    let pat = _first($pat).valueOf();
    let rep = _first($rep).valueOf();
	let str = _first(string($str)).valueOf();
    var rc = replace.repCache = replace.repCache ? replace.repCache : {};
    //var pc = replace.patCache = replace.patCache ? replace.patCache : {};
    if(!rc[rep]){
        rc[rep] = rep.replace(/(^|[^\\])\\\$/g,"$$$$").replace(/\\\\\$/g,"\\$$");
    }
    /*if(!pc[pat]){
        pc[pat] = XRegExp.cache(pat,"g");
    }*/
	var ret;
    var _cache = replace.cache = replace.cache || cache(3);
    if(!_cache.has(str,pat,rep)) {
        ret = _cache.set(str,pat,rep,XRegExp.replace(str,XRegExp.cache(pat),rc[rep],"all"));
    } else {
        ret = _cache.get(str,pat,rep);
    }
	return seq(ret);
}


export function stringLength($str) {
	let str = _first($str);
	return seq(str.length);
}

export function stringJoin($seq,$sep) {
	let sep = _first($sep);
	return seq(string($seq).join(sep !== undefined ? sep : ""));
}

export function concat(... a){
    return seq(string(toSeq(a)).flatten(true).join(""));
}
