let { domainOf, allDomainsOf } = require('./domain_utils.js');
let { stringStartsWith } = require('./utils.js');
let { Matcher, PrefixMatcher, DomainNameMatcher, TextPatterMatcher } = require('./matchers.js');

if (!String.prototype.eachLine) {
    String.prototype.eachLine = function eachLine(func, lineEnd) {
        lineEnd = lineEnd || "\n";

        let i, stop, lineNo = 0, startIdx = -1;
        for (i = 0; i < this.length; i++) {
            let character = this.charAt(i);
            if (character === lineEnd) {
                stop = func(this.substring(startIdx + 1, i), lineNo);
                if (stop === false) {
                    return;
                }

                startIdx = i;
                lineNo++;
            }
        }

        if (startIdx != i) {
            func(this.substring(startIdx + 1, i), lineNo);
        }
    };
} else {
    console.error("String#eachLine has been defined somewhere else!");
}

function isEmptyOrComment(line) {
    line = line.trim();
    return line.length === 0 || line.charAt(0) == '!';
}

function addValueToKey(obj, key, value) {
    let array = obj[key];
    if (!array) {
        array = [];
        obj[key] = array;
    }

    array.push(value);
}

function getParsedRules() {
    let data = require('sdk/self').data;
    let gfwlist = data.load('gfwlist.txt');

    let whiteList = {};
    let proxyList = {};
    let DEFAULT = '__default__';

    gfwlist.eachLine(function(line, idx) {
        if (idx == 0 || isEmptyOrComment(line)) {
            return true;
        }

        let matcher, toList;
        if (stringStartsWith(line, '@@')) { // White list
            let exp = line.substring(2);
            matcher = Matcher.parse(exp);
            toList = whiteList;
        } else {
            matcher = Matcher.parse(line);
            toList = proxyList;
        }


        if (matcher instanceof TextPatterMatcher) {
            if (matcher.isRegex()) {
                addValueToKey(toList, DEFAULT, matcher);
            } else {
                addValueToKey(toList, domainOf(matcher.expression), matcher);
            }
        } else {
            addValueToKey(toList, domainOf(matcher.expression), matcher);
        }

    });

    return { whiteList: whiteList, proxyList: proxyList };
}

exports.getParsedRules = getParsedRules;