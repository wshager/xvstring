import XRegExp from "xregexp";

import { seq, seqOf, toSeq, isSeq, _first, subsequence, remove, head, tail, count, reverse, insertBefore } from "xvseq";

import { element, attribute, text, _isNode } from "xvnode";

import { string } from "xvtype";


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
	let str = _first($str);
    var _cache;
    if(!matches._cache) matches._cache = new Map();
    if(!matches._cache.has(pat)) {
        _cache = new Map();
        matches._cache.set(pat,_cache);
    } else {
        _cache = matches._cache.get(pat);
    }
	str = _isNode(str) ? str.data() : str;
	if(str === undefined) return false;
    var ret;
    if(!_cache.has(str)){
        ret = str.match(pat) !== null;
        _cache.set(str,ret);
    } else {
        ret = _cache.get(str);
    }
    return seq(ret);
}

// TODO lazy
export function replace($str,$pat,$rep) {
    let pat = _first($pat).valueOf();
    let rep = _first($rep).valueOf();
	let str = _first($str).valueOf();
    var rc = replace.repCache = replace.repCache ? replace.repCache : {};
    //var pc = replace.patCache = replace.patCache ? replace.patCache : {};
    if(!rc[rep]){
        rc[rep] = rep.replace(/(^|[^\\])\\\$/g,"$$$$").replace(/\\\\\$/g,"\\$$");
    }
    /*if(!pc[pat]){
        pc[pat] = XRegExp.cache(pat,"g");
    }*/
    var c = replace.cache ? replace.cache : new Map();
    replace.cache = c;
    var cc,cpc,ret;
    if(!c.has(str)) {
        cc = new Map();
        c.set(str,cc);
    } else {
        cc = c.get(str);
    }
    if(!cc.has(pat)) {
        cpc = new Map();
        cc.set(pat,cpc);
    } else {
        cpc = cc.get(pat);
    }
    if(!cpc.has(rep)) {
        ret = XRegExp.replace(str,pat,rc[rep]);
        cpc.set(rep,ret);
    } else {
        ret = cpc.get(rep);
    }
	return seq(ret);
}


export function stringLength($_) {
	return item($_).map(function(_) {
        return _.length;
    });
}

export function stringJoin($seq,$sep) {
	let sep = _first($sep);
	return seqOf(string($seq).join(sep !== undefined ? sep : ""));
}

export function concat(... a){
    return seqOf(string(toSeq(a)).flatten(true).join(""));
}
