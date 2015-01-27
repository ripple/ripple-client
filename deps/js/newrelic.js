
// modules are defined as an array
// [ module function, map of requires ]
//
// map of requireuires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (modules, cache, entry) {
    // Save the require from previous bundle to this closure if any
    var previousRequire = typeof __nr_require == "function" && __nr_require;

    function newRequire(name, jumped){
        if(!cache[name]) {
            if(!modules[name]) {
                // if we cannot find the the module within our internal map or
                // cache jump to the current global require ie. the last bundle
                // that was added to the page.
                var currentRequire = typeof __nr_require == "function" && __nr_require;
                if (!jumped && currentRequire) return currentRequire(name, true);

                // If there are other bundles on this page the require from the
                // previous one is saved to 'previousRequire'. Repeat this as
                // many times as there are bundles until the module is found or
                // we exhaust the require chain.
                if (previousRequire) return previousRequire(name, true);
                throw new Error('Cannot find module \'' + name + '\'');
            }
            var m = cache[name] = {exports:{}};
            modules[name][0].call(m.exports, function(x){
                var id = modules[name][1][x];
                return newRequire(id ? id : x);
            },m,m.exports);
        }
        return cache[name].exports;
    }
    for(var i=0;i<entry.length;i++) newRequire(entry[i]);

    // Override the current require with this new one
    return newRequire;
})
({1:[function(require,module,exports){
module.exports = function(sType, callback) {
  if ('addEventListener' in window) {
    return addEventListener(sType, callback, false)
  } else if ('attachEvent' in window) {
    return attachEvent("on" + sType, callback)
  }
}


},{}],2:[function(require,module,exports){
// This product includes Apache 2.0 licensed source derived from 'episodes'
// by Steve Sounders. Repository: http://code.google.com/p/episodes/
// 
//   Copyright 2010 Google Inc.
// 
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
// 
//        http://www.apache.org/licenses/LICENSE-2.0
// 
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
// 
//   See the source code here:
//        http://code.google.com/p/episodes/
// 
// This product includes MIT licensed source generated from 'Browserify'
// by James Halliday. Repository: https://github.com/substack/node-browserify.
// 
// This product includes MIT licensed source derived from 'TraceKit'
// by Onur Cakmak. Repository: https://github.com/occ/TraceKit
// 
//   TraceKit - Cross brower stack traces - github.com/occ/TraceKit
// 
//   Copyright (c) 2013 Onur Can Cakmak onur.cakmak@gmail.com and all TraceKit
//   contributors.
// 
//   Permission is hereby granted, free of charge, to any person obtaining a copy
//   of this software and associated documentation files (the 'Software'), to deal
//   in the Software without restriction, including without limitation the rights
//   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//   copies of the Software, and to permit persons to whom the Software is
//   furnished to do so, subject to the following conditions:
// 
//   The above copyright notice and this permission notice shall be included in
//   all copies or substantial portions of the Software.
// 
//   THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//   SOFTWARE.
// 
// All other components of this product are
// Copyright (c) 2010-2013 New Relic, Inc.  All rights reserved.
// 
// Certain inventions disclosed in this file may be claimed within
// patents owned or patent applications filed by New Relic, Inc. or third
// parties.
// 
// Subject to the terms of this notice, New Relic grants you a
// nonexclusive, nontransferable license, without the right to
// sublicense, to (a) install and execute one copy of these files on any
// number of workstations owned or controlled by you and (b) distribute
// verbatim copies of these files to third parties.  As a condition to the
// foregoing grant, you must provide this notice along with each copy you
// distribute and you must not remove, alter, or obscure this notice. All
// other use, reproduction, modification, distribution, or other
// exploitation of these files is strictly prohibited, except as may be set
// forth in a separate written license agreement between you and New
// Relic.  The terms of any such license agreement will control over this
// notice.  The license stated above will be automatically terminated and
// revoked if you exceed its scope or violate any of the terms of this
// notice.
// 
// This License does not grant permission to use the trade names,
// trademarks, service marks, or product names of New Relic, except as
// required for reasonable and customary use in describing the origin of
// this file and reproducing the content of this notice.  You may not
// mark or brand this file with any trade name, trademarks, service
// marks, or product names other than the original brand (if any)
// provided by New Relic.
// 
// Unless otherwise expressly agreed by New Relic in a separate written
// license agreement, these files are provided AS IS, WITHOUT WARRANTY OF
// ANY KIND, including without any implied warranties of MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE, TITLE, or NON-INFRINGEMENT.  As a
// condition to your use of these files, you are solely responsible for
// such use. New Relic will have no liability to you for direct,
// indirect, consequential, incidental, special, or punitive damages or
// for lost profits or data.
// 
// 

var mapOwn = require('map-own')
  , handle = require('handle')
  , register = require('./register-handler')

  , data  = {}
  , marks = {}

module.exports =
  { store          : store
  , take           : take
  , get            : get
  , mark           : mark
  , measure        : measure
  }

// noop inst-bst incase nothing registers for it
setTimeout(function () { register('bstAgg', function () {})}, 10000)

function store (type, name, params, metrics) {
  handle('bstAgg', [type, name, params, metrics])
  if (!data[type]) data[type] = {}
  var old = data[type][name]
  if (!old) {
    data[type][name] = old = { params: params || {} }
  }
  old.metrics = agg(metrics, old.metrics)
  return old
}

function agg (nMetrics, oldMetrics) {
  if (!oldMetrics) oldMetrics = {count: 0}
  oldMetrics.count += 1
  mapOwn(nMetrics, function (k, v) {
    oldMetrics[k] = stats(v, oldMetrics[k])
  })
  return oldMetrics
}

function stats (n, old) {
  if (!old) return {t: n} // when there is only one data point, the c, min, max, and sos params are superfluous.
  if (old && !old.c) old = {t: old.t, min: old.t, max: old.t, sos: old.t*old.t, c: 1}
  old.c += 1
  old.t += n
  old.sos += n*n
  if (n > old.max) old.max = n
  if (n < old.min) old.min = n
  return old
}

function get (type, name) {
  if (name) return data[type] && data[type][name]
  return data[type]
}

function take (types) {
  var results = {}
    , type = ''
    , hasData
  for (var i = 0; i < types.length; i++) {
    type = types[i]
    results[type] = arrify(data[type])
    if (results[type].length) hasData = true
    delete data[type]
  }
  if (hasData) return results
  return null
}

function arrify (obj) {
  if (typeof obj !== 'object') return []

  return mapOwn(obj, function (k, v) { return v })
}

function mark (markName, markTime) {
  if (typeof markTime === 'undefined') markTime = new Date().getTime()
  marks[markName] = markTime
}

function measure (episodeName, startName, endName) {
  var start = marks[startName]
    , end = marks[endName]

  if (typeof start === 'undefined' || typeof end === 'undefined') return

  store('measures', episodeName, { value: end - start })
}


},{"./register-handler":8,"handle":false,"map-own":20}],3:[function(require,module,exports){
var mapOwn = require('map-own')
  ,  charMap =
    { '%2C': ','
    , '%3A': ':'
    , '%2F': '/'
    , '%40': '@'
    , '%24': '$'
    , '%3B': ';'
    }
  , stringify = require('./stringify')
  , charList = mapOwn(charMap, function (k) { return k })

var safeEncoded = new RegExp(charList.join('|'), 'g')

function real (c) {
  return charMap[c]
}

// Encode as URI Component, then unescape anything that is ok in the
// query string position.
function qs (value) {
  if (value === null || value === undefined) return 'null'
  return encodeURIComponent(value).replace(safeEncoded, real)
}

module.exports = {obj: obj, fromArray: fromArray, qs: qs, param: param}

function fromArray (qs, maxBytes) {
  var bytes = 0
  for (var i = 0; i < qs.length; i++) {
    bytes += qs[i].length
    if (bytes > maxBytes) return qs.slice(0, i).join('')
  }
  return qs.join('')
}

function obj (payload, maxBytes) {
  var total = 0
    , result = ''

  mapOwn(payload, function (feature, dataArray) {
    var intermediate = []
      , next
      , i

    if (typeof dataArray === 'string') {
      next = '&' + feature + '=' + qs(dataArray)
      total += next.length
      result += next
    } else if (dataArray.length) {
      total += 9
      for (i = 0; i < dataArray.length; i++) {
        next = qs(stringify(dataArray[i]))

        // TODO: Consider more complete ways of handling too much error data.
        total += next.length
        if (typeof maxBytes !== 'undefined' && total >= maxBytes) break
        intermediate.push(next)
      }
      result += '&' + feature + '=%5B' + intermediate.join(',') + '%5D'
    }
  })
  return result
}


// Constructs an HTTP parameter to add to the beacon URL
function param (name, value) {
  if (value && typeof(value) === 'string') {
    return '&' + name + '=' + qs(value)
  }
  return ""
}


},{"./stringify":12,"map-own":20}],4:[function(require,module,exports){
module.exports = fetch

function fetch (opts) {
  if (!(opts && opts.url)) return false
  if (opts.jsonp) return fetch.jsonp(opts.url, opts.jsonp)
  if (opts.body || opts.xhr) return fetch.xhr(opts.url, opts.body)
  return fetch.img(opts.url)
}

fetch.jsonp = function (url, jsonp) {
  var element = document.createElement('script')
  element.type = 'text/javascript'
  element.src = url + '&jsonp=' + jsonp
  document.body.appendChild(element)
  return element
}

fetch.xhr = function (url, body) {
  var request = new XMLHttpRequest()
  request.open('POST', url)
  request.send(body)
  return request
}

fetch.img = function (url) {
  var element = new Image ()
  element.src = url
  return element
}


},{}],5:[function(require,module,exports){
var single              = require('./single')
  , mapOwn              = require('map-own')
  , timing              = require('./nav-timing')
  , encode              = require('./encode')
  , qsParam             = encode.param
  , stringify           = require('./stringify')
  , fetch               = require('./fetch')
  , version             = '476.c73f3a6'
  // Use JSONp if we are in the top level window. (not a frame)
  , jsonp               = (window.self === window.parent) ? 'NREUM.setToken' : false
  , pageViewErrReported = false
  , takes               = {}

module.exports =
  { sendBeacon : single(sendBeacon)
  , sendAll    : sendAll
  , pingErrors : pingErrors
  , sendX      : sendX
  , on         : on
  , _send      : send
  , _emit      : emit
  }

function sendBeacon (nr, aggregator) {
  if (!nr.info.beacon) { return }
  if (nr.info.queueTime) { aggregator.store('measures', 'qt', {value: nr.info.queueTime }) }
  if (nr.info.applicationTime) { aggregator.store('measures', 'ap', {value: nr.info.applicationTime}) }

  aggregator.measure('be', 'starttime', 'firstbyte')
  aggregator.measure('fe', 'firstbyte', 'onload')
  aggregator.measure('dc', 'firstbyte', 'domContent')

  var measures = aggregator.get('measures')
    , sTimes =  mapOwn(measures, function (key, val) {
        return '&' + key + '=' + val.params.value
      }).join('')

  if ( sTimes ) {
    // Determine protocol version to be used: (1) is HTTP GET, (2) is HTTP POST.
    // If performance timing data is present, POST is used.
    var protocol = '1'
      , qs = [ initQs(nr) ]

    qs.push(sTimes)

    qs.push(qsParam('tt', nr.info.ttGuid))
    qs.push(qsParam('us', nr.info.user))
    qs.push(qsParam('ac', nr.info.account))
    qs.push(qsParam('pr', nr.info.product))
    qs.push(qsParam('tk', nr.info.agentToken))
    qs.push(qsParam('f', stringify(mapOwn(nr.features, function (k, v) { return k }))))

    if (window.performance && typeof(window.performance.timing) !== 'undefined') {
      // include performance timing data
      var data = {}
      data.timing = timing.addPT(window.performance.timing, {})
      data.navigation = timing.addPN(window.performance.navigation, {})
      qs.push(qsParam('perf', stringify(data)))
    }

    qs.push(qsParam('xx', nr.info.extra))
    qs.push(qsParam('ua', nr.info.userAttributes))
    qs.push(qsParam('at', nr.info.atts))

    // Hit beacon with Script GET (JSONP) or Image GET depending on protocol specified by the agent.
    // NOTE: we only use JSONP if this is a top level window (not a frame) - else the frame can overwrite
    // the window's token. As well, inserting elements into frames seems to behave poorly (sometimes
    // inserts text into the document).
    fetch({ url: nr.proto + nr.info.beacon + '/' + protocol + '/' + nr.info.licenseKey + encode.fromArray(qs, nr.maxBytes), jsonp: jsonp })
  }
}

function sendAll (nr, xhr) {
  var fired = false
  mapOwn(takes, function (place) {
    var sent = sendX(place, nr, xhr)
    if (sent) fired = true
  })
  return fired
}

function sendX (place, nr, xhr) {
  var obj = emit(place, xhr)
  return send(nr, place, obj.body, obj.qs, xhr)
}

function emit (type, xhr) {
  var makePayload = add({})
    , makeQs = add({})
    , takeFns = (takes[type] || [])
  for (var i = 0; i < takeFns.length; i++) {
    var obj = takeFns[i](xhr)
    if (obj.body) mapOwn(obj.body, makePayload)
    if (obj.qs) mapOwn(obj.qs, makeQs)
  }
  return { body: makePayload(), qs: makeQs() }
}

function send (nr, place, payload, qs, xhr) {
  if (!nr.info.errorBeacon) return false
  if (!payload) return false


  var url = 'https://' + nr.info.errorBeacon + '/' + place + '/1/' + nr.info.licenseKey
    , body

  url += initQs(nr)

  if (qs) url += encode.obj(qs, nr.maxBytes)

  if (xhr) body = stringify(payload)
  else url += encode.obj(payload, nr.maxBytes)

  if (payload.err && payload.err.length && !pageViewErrReported) {
    url += qsParam('pve', '1')
    pageViewErrReported = true
  }

  return fetch({ url: url, body: body })
}

function pingErrors(nr) {
  if (!nr || !nr.info || !nr.info.errorBeacon || !nr.ieVersion) return

  var url = 'https://' + nr.info.errorBeacon + '/jserrors/ping/' + nr.info.licenseKey
  url += initQs(nr)

  fetch({url: url})
}

// Constructs the transaction name param for the beacon URL.
// Prefers the obfuscated transaction name over the plain text.
// Falls back to making up a name.
function transactionNameParam (nr) {
  if (nr.info.transactionName) {
    return qsParam('to', nr.info.transactionName)
  } else {
    return qsParam('t', nr.info.tNamePlain || 'Unnamed Transaction')
  }
}

function on (type, fn) {
  var fns = (takes[type] || (takes[type] = []))
  fns.push(fn)
}

function initQs (nr) {
  return [ '?a=' + nr.info.applicationID
         ,  qsParam('sa', (nr.info.sa ? '' + nr.info.sa : ''))
         ,  qsParam('pl', '' + nr.offset)
         ,  qsParam('v', version)
         ,  transactionNameParam(nr)
         ].join('')
}

function add (payload) {
  var something = false
  return function (key, val) {
    if (val && val.length) {
      payload[key] = val
      something = true
    }
    if (something) return payload
  }
}


},{"./encode":3,"./fetch":4,"./nav-timing":7,"./single":10,"./stringify":12,"map-own":20}],6:[function(require,module,exports){
var sHash = require('./s-hash')
  , addE = require('./add-e')
  , startTime = require('./start-time')
  , aggregator = require('./aggregator')
  , single = require('./single')
  , fetch = require('./fetch')
  , harvest = require('./harvest')
  , registerHandler = require('./register-handler')
  , nr = require('loader')
  , ee = require('ee')

  , cycle = 0
  , autorun = ( typeof(window.NREUM.autorun) !== 'undefined' ? window.NREUM.autorun : true )
  , div = document.createElement('div')

// Rates are set using the legacy setToken function name.
window.NREUM.setToken = setRates
window.NREUM.inlineHit = inlineHit

div.innerHTML = '<!--[if lte IE 6]><div></div><![endif]-->' +
  '<!--[if lte IE 8]><div></div><![endif]-->'

var len = div.getElementsByTagName('div').length
if (len === 2) nr.ieVersion = 6
else if (len === 1) nr.ieVersion = 7
if (nr.ieVersion === 6) nr.maxBytes = 2000
else nr.maxBytes = 30000

// hook both beforeunload and pagehide - not all browsers support unload (like iPad Safari)
var unload = single(beforeUnload)
addE('beforeunload', unload)
addE('pagehide', unload)

addE('unload', function () {
  harvest.sendAll(nr, false)
})

registerHandler('mark', aggregator.mark)

aggregator.mark('done')

if ( autorun ) {
  harvest.sendBeacon(nr, aggregator)
}

function setRates (rates) {
  ee.emit('rates', [rates])
}

// NREUM.inlineHit(request_name, queue_time, app_time, total_be_time, dom_time, fe_time)
//
// request_name - the 'web page' name or service name
// queue_time - the amount of time spent in the app tier queue
// app_time - the amount of time spent in the application code
// total_be_time - the total roundtrip time of the remote service call
// dom_time - the time spent processing the result of the service call (or user defined)
// fe_time - the time spent rendering the result of the service call (or user defined)
//
function inlineHit (request_name, queue_time, app_time, total_be_time, dom_time, fe_time) {
    cycle += 1

    if (!nr.info.beacon) return

    var url = nr.proto + nr.info.beacon + '/1/' + nr.info.licenseKey

    url += '?a=' + nr.info.applicationID + '&'
    url += 't=' + request_name + '&'
    url += 'qt=' + queue_time + '&'
    url += 'ap=' + app_time + '&'
    url += 'be=' + total_be_time + '&'
    url += 'dc=' + dom_time + '&'
    url += 'fe=' + fe_time + '&'
    url += 'c=' + cycle

    fetch({url: url})

}

// Set a cookie when the page unloads. Consume this cookie on the next page to get a 'start time'.
// The navigation start time cookie is removed when the browser supports the web timing API.
// The NRAGENT trace token is removed unless a token has been provided by the beacon.
// Doesn't work in some browsers (Opera).
function beforeUnload (e) {


  // write navigation start time cookie if needed - cookie sub-name is based on the event that triggered this
  var name = 's' // before unload event
  if (e.type === 'pagehide') name = 'h' // page hide event
  if (startTime.navCookie) {
    document.cookie = 'NREUM=' + name + '=' + Number(new Date()) + '&r=' + sHash(document.location.href) + '&p=' + sHash(document.referrer) + '; path=/'
  }
}


},{"./add-e":1,"./aggregator":2,"./fetch":4,"./harvest":5,"./register-handler":8,"./s-hash":9,"./single":10,"./start-time":11,"ee":false,"loader":false}],7:[function(require,module,exports){
// We don't use JSON.stringify directly on the performance timing data for these reasons:
// * Chrome has extra data in the performance object that we don't want to send all the time (wasteful)
// * Firefox fails to stringify the native object due to - http://code.google.com/p/v8/issues/detail?id=1223
// * The variable names are long and wasteful to transmit

// Add Performance Timing values to the given object.
// * Values are written relative to an offset to reduce their length (i.e. number of characters).
// * The offset is sent with the data
// * 0's are not included unless the value is a 'relative zero'
//

module.exports =
  { addPT: addPT
  , addPN: addPN
  }

function addPT (pt, v) {
  var offset = pt.navigationStart
  v.of = offset
  addRel(pt.navigationStart, offset, v, "n")
  addRel(pt.unloadEventStart, offset, v, "u")
  addRel(pt.unloadEventEnd, offset, v, "ue")
  addRel(pt.domLoading, offset, v, "dl")
  addRel(pt.domInteractive, offset, v, "di")
  addRel(pt.domContentLoadedEventStart, offset, v, "ds")
  addRel(pt.domContentLoadedEventEnd, offset, v, "de")
  addRel(pt.domComplete, offset, v, "dc")
  addRel(pt.loadEventStart, offset, v, "l")
  addRel(pt.loadEventEnd, offset, v, "le")
  addRel(pt.redirectStart, offset, v, "r")
  addRel(pt.redirectEnd, offset, v, "re")
  addRel(pt.fetchStart, offset, v, "f")
  addRel(pt.domainLookupStart, offset, v, "dn")
  addRel(pt.domainLookupEnd, offset, v, "dne")
  addRel(pt.connectStart, offset, v, "c")
  addRel(pt.connectEnd, offset, v, "ce")
  addRel(pt.secureConnectionStart, offset, v, "s")
  addRel(pt.requestStart, offset, v, "rq")
  addRel(pt.responseStart, offset, v, "rp")
  addRel(pt.responseEnd, offset, v, "rpe")
  return v
}

// Add Performance Navigation values to the given object
function addPN (pn, v) {
  addRel(pn.type, 0, v, "ty")
  addRel(pn.redirectCount, 0, v, "rc")
  return v
}

function addRel (value, offset, obj, prop) {
  if (typeof(value) === "number" && (value > 0)) obj[prop] = Math.round(value - offset)
}


},{}],8:[function(require,module,exports){
var ee = require('handle').ee

module.exports = registerHandler

function registerHandler (type, handler) {
  if (ee.listeners(type).length) return false
    ee.on(type, handler)
  var backlog = ee.q[type]
  if (backlog) {
    for (var i=0; i < backlog.length; i++) {
      ee.emit(type, backlog[i])
    }
    delete ee.q[type]
  }
  return true
}


},{"handle":false}],9:[function(require,module,exports){
module.exports = sHash

function sHash (s) {
  var i, h = 0
  for (i = 0; i < s.length; i++) {
    h += ((i+1) *s.charCodeAt(i))
  }
  return Math.abs(h)
}


},{}],10:[function(require,module,exports){
var slice = require('lodash._slice')

module.exports = single

function single (fn) {
  var called = false
    , res

  return function () {
    if (called) return res
    called = true
    res = fn.apply(this, slice(arguments))
    return res
  }
}


},{"lodash._slice":21}],11:[function(require,module,exports){
// Use various techniques to determine the time at which this page started and whether to capture navigation timing information

var sHash = require('./s-hash')
  , aggregator = require('./aggregator')
  , nr = require('loader')

module.exports = { navCookie: true }

findStartTime()

function findStartTime () {
  var starttime = findStartWebTiming() || findStartCookie()

  if (!starttime) return

  aggregator.mark('starttime', starttime)
  // Refine nr.offset
  nr.offset = starttime
}

// Find the start time from the Web Timing "performance" object.
// http://test.w3.org/webperf/specs/NavigationTiming/
// http://blog.chromium.org/2010/07/do-you-know-how-slow-your-web-page-is.html
function findStartWebTiming () {
  // FF 7/8 has a bug with the navigation start time, so use cookie instead of native interface
  var match = navigator.userAgent.match(/Firefox[\/\s](\d+\.\d+)/)
  if (match) {
    var ffversion = +match[1]
    if (ffversion < 9 ) {
      return
    }
  }

  if (typeof(window.performance) !== 'undefined' && window.performance.timing && typeof(window.performance.timing.navigationStart) !== "undefined") {
    // note that we don't need to use a cookie to record navigation start time
    module.exports.navCookie = false
    return window.performance.timing.navigationStart
  }
}

// Find the start time based on a cookie set by Episodes in the unload handler.
function findStartCookie () {
  var aCookies = document.cookie.split(' ')

  for (var i = 0; i < aCookies.length; i++ ) {
    if ( 0 === aCookies[i].indexOf("NREUM=") ) {
      var startPage, referrerPage
      var aSubCookies = aCookies[i].substring("NREUM=".length).split('&')
      var startTime, bReferrerMatch
      for (var j = 0; j < aSubCookies.length; j++ ) {
        if ( 0 === aSubCookies[j].indexOf("s=") ) {
          // before unload event
          startTime = aSubCookies[j].substring(2)
        } else if ( 0 === aSubCookies[j].indexOf("h=")) {
          // page hide event (noted with extra parameter - "ph=1")
          startTime = aSubCookies[j].substring(2)
          aggregator.store('measures', 'ph', {value: 1})
        } else if ( 0 === aSubCookies[j].indexOf("p=") ) {
          referrerPage = aSubCookies[j].substring(2)
          // if the sub-cookie is not the last cookie it will have a trailing ';'
          if (referrerPage.charAt(referrerPage.length - 1) === ";") {
            referrerPage = referrerPage.substr(0, referrerPage.length - 1)
          }
        } else if ( 0 === aSubCookies[j].indexOf("r=") ) {
          startPage = aSubCookies[j].substring(2)
          // if the sub-cookie is not the last cookie it will have a trailing ';'
          if (startPage.charAt(startPage.length - 1) === ";") {
            startPage = startPage.substr(0, startPage.length - 1)
          }
        }
      }

      if (startPage) {
        var docReferrer = sHash(document.referrer)
        bReferrerMatch = (docReferrer == startPage)
        if (!bReferrerMatch) {
          // Navigation did not start at the page that was just exited, check for re-load
          // (i.e. the page just exited is the current page and the referring pages match)
          bReferrerMatch = sHash(document.location.href) == startPage && docReferrer == referrerPage
        }
      }
      if ( bReferrerMatch && startTime ) {
        var now = new Date().getTime()
        if ((now - startTime) > 60000) {
          return
        }
        return startTime
      }
    }
  }
}


},{"./aggregator":2,"./s-hash":9,"loader":false}],12:[function(require,module,exports){
var mapOwn = require('map-own')
  , ee = require('ee')

  , escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g
  , meta =
    { '\b': '\\b'
    , '\t': '\\t'
    , '\n': '\\n'
    , '\f': '\\f'
    , '\r': '\\r'
    , '"' : '\\"'
    , '\\': '\\\\'
    }

module.exports = stringify

function stringify (val) {
  try {
    return str('', {'': val})
  } catch (e) {
    try {
      ee.emit('internal-error', [e])
    } catch (err) {
    }
  }
}

function quote(string) {
  escapable.lastIndex = 0
  return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
    var c = meta[a]
    return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4)
  }) + '"' : '"' + string + '"'
}

function str(key, holder) {
  var value = holder[key]

  switch (typeof value) {
    case 'string':
      return quote(value)
    case 'number':
      return isFinite(value) ? String(value) : 'null'
    case 'boolean':
      return String(value)
    case 'object':
      if (!value) { return 'null' }
      var partial = []

      // The value is an array. Stringify every element. Use null as a placeholder
      // for non-JSON values.
      if (Object.prototype.toString.apply(value) === '[object Array]') {
        var length = value.length
        for (var i = 0; i < length; i += 1) {
          partial[i] = str(i, value) || 'null'
        }

        return partial.length === 0 ? '[]' : '[' + partial.join(',') + ']'
      }

      mapOwn(value, function (k) {
        var v = str(k, value)
        if (v) partial.push(quote(k) + ':' + v)
      })

      return partial.length === 0 ? '{}' : '{' + partial.join(',') + '}'
  }
}


},{"ee":false,"map-own":20}],13:[function(require,module,exports){
var canonicalFunctionNameRe = /([a-z0-9]+)$/i
function canonicalFunctionName(orig) {
  if (!orig) return

  var match = orig.match(canonicalFunctionNameRe)
  if (match) return match[1]

  return
}

module.exports = canonicalFunctionName

},{}],14:[function(require,module,exports){
module.exports = cleanURL

var cleanURLRe = /^([^?]+)(\?[^#]*)?(#.*)?$/
function cleanURL(url) {
  var match = url.match(cleanURLRe)
  if (!match) return null
  if (!match[3]) return match[1]
  return match[1] + match[3];
}

},{}],15:[function(require,module,exports){
/**
 * computeStackTrace: cross-browser stack traces in JavaScript
 *
 * Syntax:
 *   s = computeStackTrace(exception) // consider using TraceKit.report instead
 * Returns:
 *   s.name              - exception name
 *   s.message           - exception message
 *   s.stack[i].url      - JavaScript or HTML file URL
 *   s.stack[i].func     - function name, or empty for anonymous functions
 *   s.stack[i].line     - line number, if known
 *   s.stack[i].column   - column number, if known
 *   s.stack[i].context  - an array of source code lines; the middle element corresponds to the correct line#
 *   s.mode              - 'stack', 'stacktrace', 'multiline', 'callers', 'onerror', or 'failed' -- method used to collect the stack trace
 *
 * Supports:
 *   - Firefox:  full stack trace with line numbers and unreliable column
 *               number on top frame
 *   - Opera 10: full stack trace with line and column numbers
 *   - Opera 9-: full stack trace with line numbers
 *   - Chrome:   full stack trace with line and column numbers
 *   - Safari:   line and column number for the topmost stacktrace element
 *               only
 *   - IE:       no line numbers whatsoever
 */

module.exports = (function computeStackTraceWrapper() {
    var debug = false;

    var classNameRegex = /function (.+)\(/;
    function getClassName(obj) {
        var results = classNameRegex.exec(String(obj.constructor));
        return (results && results.length > 1) ? results[1] : "unknown";
    }

    function isWrapper(functionName) {
        return (functionName && functionName.indexOf('nrWrapper') >= 0)
    }

    var stripRe = /^\n+|\n+$/g

    function cleanStackTrace(stackTrace) {
        if (!stackTrace) return null
        return stackTrace.replace(stripRe, '')
    }

    // Contents of Exception in various browsers.
    //
    // SAFARI:
    // ex.message = Can't find variable: qq
    // ex.line = 59
    // ex.sourceId = 580238192
    // ex.sourceURL = http://...
    // ex.expressionBeginOffset = 96
    // ex.expressionCaretOffset = 98
    // ex.expressionEndOffset = 98
    // ex.name = ReferenceError
    //
    // FIREFOX:
    // ex.message = qq is not defined
    // ex.fileName = http://...
    // ex.lineNumber = 59
    // ex.stack = ...stack trace... (see the example below)
    // ex.name = ReferenceError
    //
    // CHROME:
    // ex.message = qq is not defined
    // ex.name = ReferenceError
    // ex.type = not_defined
    // ex.arguments = ['aa']
    // ex.stack = ...stack trace...
    //
    // INTERNET EXPLORER:
    // ex.message = ...
    // ex.name = ReferenceError
    //
    // OPERA:
    // ex.message = ...message... (see the example below)
    // ex.name = ReferenceError
    // ex.opera#sourceloc = 11  (pretty much useless, duplicates the info in ex.message)
    // ex.stacktrace = n/a; see 'opera:config#UserPrefs|Exceptions Have Stacktrace'

    /**
     * Computes stack trace information from the stack property.
     * Chrome and Gecko use this property.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceFromStackProp(ex) {
        if (!ex.stack) {
            return null;
        }

        var chrome = /^\s*at (?:((?:\[object object\])?(?:[^(]*\([^)]*\))*[^()]*(?: \[as \S+\])?) )?\(?((?:file|http|https|chrome-extension):.*?)?:(\d+)(?::(\d+))?\)?\s*$/i,
            gecko = /^\s*(?:(\S*)(?:\(.*?\))?@)?((?:file|http|https|chrome|safari-extension).*?):(\d+)(?::(\d+))?\s*$/i,
            chrome_eval = /^\s*at .+ \(eval at \S+ \((?:(?:file|http|https):[^)]+)?\)(?:, [^:]*:\d+:\d+)?\)$/i,
            ie_eval = /^\s*at Function code \(Function code:\d+:\d+\)\s*/i,
            lines = ex.stack.split('\n'),
            frames = [],
            stackLines = [],
            parts,
            element,
            wrapperSeen = false,
            reference = /^(.*) is undefined$/.exec(ex.message);

        for (var i = 0, j = lines.length; i < j; ++i) {
            if ((parts = gecko.exec(lines[i]))) {
                element = {
                    'url': parts[2],
                    'func': parts[1] || null,
                    'line': +parts[3],
                    'column': parts[4] ? +parts[4] : null
                };
            } else if ((parts = chrome.exec(lines[i]))) {
                element = {
                    'url': parts[2],
                    'func': parts[1] || null,
                    'line': +parts[3],
                    'column': parts[4] ? +parts[4] : null
                };
                if (element.func === 'Anonymous function') element.func = null;
            } else if (chrome_eval.exec(lines[i]) || ie_eval.exec(lines[i]) || lines[i] === 'anonymous') {
                element = {
                    'func': 'evaluated code'
                };
            } else {
                stackLines.push(lines[i]);
                continue;
            }

            if (isWrapper(element.func)) wrapperSeen = true;
            else stackLines.push(lines[i]);

            if (!wrapperSeen) frames.push(element);
        }

        if (!frames.length) {
            return null;
        }

        return {
            'mode': 'stack',
            'name': ex.name || getClassName(ex),
            'message': ex.message,
            'stackString': cleanStackTrace(stackLines.join('\n')),
            'frames': frames
        };
    }

    /**
     * Computes stack trace information from the stacktrace property.
     * Opera 10 uses this property.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceFromStacktraceProp(ex) {
        // Access and store the stacktrace property before doing ANYTHING
        // else to it because Opera is not very good at providing it
        // reliably in other circumstances.
        var stacktrace = ex.stacktrace;

        var testRE = / line (\d+), column (\d+) in (?:<anonymous function: ([^>]+)>|([^\)]+))\(.*\) in (.*):\s*$/i,
            lines = stacktrace.split('\n'),
            frames = [],
            stackLines = [],
            parts,
            wrapperSeen = false;

        for (var i = 0, j = lines.length; i < j; i += 2) {
            if ((parts = testRE.exec(lines[i]))) {
                var element = {
                    'line': +parts[1],
                    'column': +parts[2],
                    'func': parts[3] || parts[4],
                    'url': parts[5]
                };

                if (isWrapper(element.func)) wrapperSeen = true;
                else stackLines.push(lines[i]);

                if (!wrapperSeen) frames.push(element);
            } else {
                stackLines.push(lines[i]);
            }
        }

        if (!frames.length) {
            return null;
        }

        return {
            'mode': 'stacktrace',
            'name': ex.name || getClassName(ex),
            'message': ex.message,
            'stackString': cleanStackTrace(stackLines.join('\n')),
            'frames': frames
        };
    }

    /**
     * NOT TESTED.
     * Computes stack trace information from an error message that includes
     * the stack trace.
     * Opera 9 and earlier use this method if the option to show stack
     * traces is turned on in opera:config.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack information.
     */
    function computeStackTraceFromOperaMultiLineMessage(ex) {
        // Opera includes a stack trace into the exception message. An example is:
        //
        // Statement on line 3: Undefined variable: undefinedFunc
        // Backtrace:
        //   Line 3 of linked script file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.js: In function zzz
        //         undefinedFunc(a);
        //   Line 7 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function yyy
        //           zzz(x, y, z);
        //   Line 3 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function xxx
        //           yyy(a, a, a);
        //   Line 1 of function script
        //     try { xxx('hi'); return false; } catch(ex) { TraceKit.report(ex); }
        //   ...

        var lines = ex.message.split('\n');
        if (lines.length < 4) {
            return null;
        }

        var lineRE1 = /^\s*Line (\d+) of linked script ((?:file|http|https)\S+)(?:: in function (\S+))?\s*$/i,
            lineRE2 = /^\s*Line (\d+) of inline#(\d+) script in ((?:file|http|https)\S+)(?:: in function (\S+))?\s*$/i,
            lineRE3 = /^\s*Line (\d+) of function script\s*$/i,
            frames = [],
            stackLines = [],
            scripts = document.getElementsByTagName('script'),
            inlineScriptBlocks = [],
            parts,
            i,
            len,
            source,
            wrapperSeen = false;

        for (i in scripts) {
            if (_has(scripts, i) && !scripts[i].src) {
                inlineScriptBlocks.push(scripts[i]);
            }
        }

        for (i = 2, len = lines.length; i < len; i += 2) {
            var item = null;
            if ((parts = lineRE1.exec(lines[i]))) {
                item = {
                    'url': parts[2],
                    'func': parts[3],
                    'line': +parts[1]
                };
            } else if ((parts = lineRE2.exec(lines[i]))) {
                item = {
                    'url': parts[3],
                    'func': parts[4]
                };
            } else if ((parts = lineRE3.exec(lines[i]))) {
                var url = window.location.href.replace(/#.*$/, ''),
                    line = parts[1];
                item = {
                    'url': url,
                    'line': line,
                    'func': ''
                };
            }

            if (item) {
                if (isWrapper(item.func)) wrapperSeen = true;
                else stackLines.push(lines[i]);

                if (!wrapperSeen) frames.push(item);
            }
        }
        if (!frames.length) {
            return null; // could not parse multiline exception message as Opera stack trace
        }

        return {
            'mode': 'multiline',
            'name': ex.name || getClassName(ex),
            'message': lines[0],
            'stackString': cleanStackTrace(stackLines.join('\n')),
            'frames': frames
        };
    }

    function computeStackTraceBySourceAndLine(ex) {
        if (!('line' in ex)) {
            return null;
        }

        var className = ex.name || getClassName(ex)

        // Safari does not provide a URL for errors in eval'd code
        if (!ex.sourceURL) {
            return {
                'mode': 'sourceline',
                'name': className,
                'message': ex.message,
                'stackString': getClassName(ex) + ': ' + ex.message + '\n    in evaluated code',
                'frames': [{
                    'func': 'evaluated code'
                }]
            };
        }

        var stackString = className + ': ' + ex.message + '\n    at ' + ex.sourceURL;
        if (ex.line) {
            stackString += ':' + ex.line;
            if (ex.column) {
                stackString += ':' + ex.column;
            }
        }

        return {
            'mode': 'sourceline',
            'name': className,
            'message': ex.message,
            'stackString': stackString,
            'frames': [{
                'url': ex.sourceURL,
                'line': ex.line,
                'column': ex.column
            }]
        };
    }

    function computeStackTraceWithMessageOnly(ex) {
        var className = ex.name || getClassName(ex)
        if (!className) {
            return null;
        }

        return {
            'mode': 'nameonly',
            'name': className,
            'message': ex.message,
            'stackString': className + ': ' + ex.message,
            'frames': []
        };
    }

    /**
     * Computes a stack trace for an exception.
     * @param {Error} ex
     */
    function computeStackTrace(ex) {
        var stack = null;

        try {
            // This must be tried first because Opera 10 *destroys*
            // its stacktrace property if you try to access the stack
            // property first!!
            stack = computeStackTraceFromStacktraceProp(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceFromStackProp(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceFromOperaMultiLineMessage(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceBySourceAndLine(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceWithMessageOnly(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        return {
            'mode': 'failed',
            'stackString': '',
            'frames': []
        };
    }

    return computeStackTrace;
}());

/**
 * _has, a better form of hasOwnProperty
 * Example: _has(MainHostObject, property) === true/false
 *
 * @param {Object} host object to check property
 * @param {string} key to check
 */
function _has(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}


},{}],16:[function(require,module,exports){
var agg = require('../../../agent/aggregator')
  , canonicalFunctionName = require('./canonical-function-name')
  , cleanURL = require('./clean-url')
  , computeStackTrace = require('./compute-stack-trace')
  , stringHashCode = require('./string-hash-code')
  , nr = require('loader')
  , stackReported = {}
  , pageviewReported = {}
  , register = require('../../../agent/register-handler')
  , harvest = require('../../../agent/harvest')

// Make sure nr.offset is as accurate as possible
require('../../../agent/start-time')

// bail if not instrumented
if (!nr.features.err) return


harvest.on('jserrors', function () {
  return { body: agg.take([ 'err', 'ierr' ]) }
})

harvest.pingErrors(nr)

// send errors every minute
setInterval(function () {
  var sent = harvest.sendX('jserrors', nr, false)
  if (!sent) harvest.pingErrors(nr)
}, 60 * 1000)

register('err', storeError)
register('ierr', storeError)

module.exports = storeError

function nameHash(params) {
  return stringHashCode(params.exceptionClass) ^ params.stackHash
}

function storeError(err, time, internal) {
  var stackInfo = computeStackTrace(err)

  if (!time) time = new Date().getTime()

  var canonicalStack = ''
  for (var i = 0; i < stackInfo.frames.length; i++) {
    var frame = stackInfo.frames[i]
    var func = canonicalFunctionName(frame.func)

    if (canonicalStack) canonicalStack += '\n'
    if (func) canonicalStack += func + '@'
    if (typeof frame.url === 'string') {
      frame.url = frame.url.split('?')[0]
      // Generalize url of inlined JS for canonical stack
      // so it's not a disaggregation factor.
      if (frame.url === nr.origin) frame.url = '<inline>'
      canonicalStack += frame.url
    }
    if (frame.line) canonicalStack += ':' + frame.line
  }

  var params = {
    stackHash: stringHashCode(canonicalStack),
    exceptionClass: stackInfo.name,
    request_uri: window.location.pathname
  }
  if (stackInfo.message) params.message = stackInfo.message

  if (!stackReported[params.stackHash]) {
    stackReported[params.stackHash] = true
    params.stack_trace = stackInfo.stackString
  } else {
    params.browser_stack_hash = stringHashCode(stackInfo.stackString)
  }

  // When debugging stack canonicalization/hashing, uncomment these lines for
  // more output in the test logs
  //params.origStack = err.stack
  //params.canonicalStack = canonicalStack

  if (document.referrer) {
    var cleaned = cleanURL(document.referrer)
    if (cleaned) params.request_referer = cleaned
  }

  var hash = nameHash(params)

  if (!pageviewReported[hash]) {
    params.pageview = 1
    pageviewReported[hash] = true
  }

  agg.store(internal ? 'ierr' : 'err', hash, params, { time: time - nr.offset })
}


},{"../../../agent/aggregator":2,"../../../agent/harvest":5,"../../../agent/register-handler":8,"../../../agent/start-time":11,"./canonical-function-name":13,"./clean-url":14,"./compute-stack-trace":15,"./string-hash-code":17,"loader":false}],17:[function(require,module,exports){
function stringHashCode(string) {
  var hash = 0
    , charVal
  if (!string || !string.length) return hash
  for (var i = 0; i < string.length; i++) {
    charVal = string.charCodeAt(i)
    hash = ((hash << 5) - hash) + charVal
    hash = hash | 0 // Convert to 32bit integer
  }
  return hash
}

module.exports = stringHashCode


},{}],18:[function(require,module,exports){
var registerHandler = require('../../../agent/register-handler')
  , harvest = require('../../../agent/harvest')
  , agg = require('../../../agent/aggregator')
  , nr = require('loader')
  , mapOwn = require('map-own')
  , slice = require('lodash._slice')
  , cleanURL = require('../../err/aggregate/clean-url')
  , ptid = ''
  , ignoredEvents = { mouseup: true, mousedown: true }
  , toAggregate =
    { typing: 1000
    , scrolling: 1000
    , mousing: 1000
    }
  , rename =
    { typing: { keydown: true, keyup: true, keypress: true }
    , mousing: { mousemove: true, mouseenter: true, mouseleave: true, mouseover: true, mouseout: true }
    , scrolling: { scroll: true }
    }
  , trace = {}
  , ee = require('ee')

// exports only used for testing
module.exports =
  { _takeSTNs: takeSTNs
  }

// Make sure nr.offset is as accurate as possible
require('../../../agent/start-time')

// bail if not instrumented
if (!nr.features.stn) return

// noop if rates aren't revieved
var bstTimeBomb = setTimeout(function () {
  registerHandler('bst', noop)
  registerHandler('bstResource', noop)
  registerHandler('bstHist', noop)
  registerHandler('bstAgg', noop)
}, 10000)

ee.on('rates', function (rates) { 
  if (!(rates && rates.stn)) return

  clearTimeout(bstTimeBomb)

  storeTiming(window.performance.timing)

  harvest.on('resources', checkPtid(takeSTNs))

  var xhr = harvest.sendX('resources', nr, true)
  xhr.addEventListener('load', function () { ptid = this.responseText }, false)

  registerHandler('bst', storeEvent)
  registerHandler('bstTimer', storeTimer)
  registerHandler('bstResource', storeResources)
  registerHandler('bstHist', storeHist)
  registerHandler('bstAgg', storeAgg)

  setInterval(function () {
    var total = 0
    if ((Date.now() - nr.offset) > ( 15 * 60 * 1000)) {
      // been collecting for over 15 min, empty trace object and bail
      trace = {}
      return
    }

    mapOwn(trace, function (name, nodes) {
      if (nodes && nodes.length) total += nodes.length
    })

    if (total > 30) harvest.sendX('resources', nr, true)
    // if harvests aren't working (due to no ptid),
    // start throwing things away at 1000 nodes.
    if (total > 1000) trace = {}
  }, 10000)
})

function storeTiming (_t) {
  var key
    , val
    , timeOffset

  // loop iterates through prototype also (for FF)
  for (key in _t) {
    val = _t[key]

    // ignore inherited methods, and meaningless 0 values
    if (!(typeof(val) === 'number' && val > 0)) continue

    timeOffset = _t[key] - nr.offset

    storeSTN({ n : key
             , s : timeOffset
             , e : timeOffset
             , o : 'document'
             , t : 'timing'
             })
  }
}

function storeTimer (target, start, end, type) {

  var evt =
    { n: type
    , s: start - nr.offset
    , e: end - nr.offset
    , o: 'window'
    , t: 'timer'
    }

  storeSTN(evt)
}

function storeEvent (currentEvent, target, start, end) {

  // we find that certain events make the data too noisy to be useful
  if (currentEvent.type in ignoredEvents) { return false }

  var evt =
    { n : evtName(currentEvent.type)
    , s : start - nr.offset
    , e : end - nr.offset
    , o : evtOrigin(currentEvent.target, target)
    , t : 'event'
    }

  storeSTN(evt)
}

function evtName (type) {
  var name = type

  mapOwn(rename, function (key, val) {
    if (type in val) name = key
  })

  return name
}

function evtOrigin (t, target) {
  var origin = 'unknown'

  if (t && t instanceof XMLHttpRequest) {
    var params = t['nr@context'].params
    origin = params.status + ' ' + params.method + ': ' + params.host + params.pathname
  } else if (t && typeof (t.tagName) === 'string') {
    origin = t.tagName.toLowerCase()
    if (t.id) origin += '#' + t.id
    if (t.className) origin += '.' + slice(t.classList).join('.')
  }

  if (origin === 'unknown') {
    if (target === document) origin = 'document'
    else if (target === window) origin = 'window'
    else if (target instanceof FileReader) origin = 'FileReader'
  }

  return origin
}

function storeHist (path, old, time) {
  var node = { n : 'history.pushState'
          , s : time - nr.offset
          , e : time - nr.offset
          , o : path
          , t : old
          }

  storeSTN(node)
}

var laststart = 0

function storeResources (resources) {
  resources.forEach(function (currentResource) {
    var res = { n : currentResource.initiatorType
              , s : currentResource.fetchStart | 0
              , e : currentResource.responseEnd | 0
              , o : cleanURL(currentResource.name) // resource.name is actually a URL so it's the source
              , t : currentResource.entryType
              }

    // don't recollect old resources
    if (res.s < laststart) return

    laststart = res.s

    storeSTN(res)
  })
}

function storeAgg (type, name, params, metrics) {
  var node = null

  if (type === 'err') {
    node =  { n : 'error'
            , s : metrics.time
            , e : metrics.time
            , o : params.message
            , t : params.stackHash
            }
  } else if (type === 'xhr') {
    node =  { n : 'Ajax'
            , s : metrics.time
            , e : metrics.time + metrics.duration
            , o : params.status + ' ' + params.method + ': ' + params.host + params.pathname
            , t : 'ajax'
            }

  }

  if (node) storeSTN(node)
}

function storeSTN (stn) {
  var traceArr = trace[stn.n]
  if (!traceArr) traceArr = trace[stn.n] = []

  traceArr.push(stn)
}

function checkPtid (fn) {
  var first = true
  return function () {
    if (!(first || ptid)) return {} // only report w/o ptid during first cycle.
    first = false
    return fn()
  }
}

function takeSTNs () {
  storeResources(window.performance.getEntriesByType('resource'))
  var stns = mapOwn(trace, function (name, nodes) {

    if (!(name in toAggregate)) return nodes

    return mapOwn(nodes.sort(byStart).reduce(smearEvtsByOrigin(name), {}), val).reduce(flatten, [])
  }).reduce(flatten, [])

  if (stns.length === 0) return {}
  else trace = {}
  return { qs: { st: '' + nr.offset, ptid: ptid },  body: { res: stns } }
}

function byStart (a, b) {
  return a.s - b.s
}

function smearEvtsByOrigin (name) {
  var maxGap = toAggregate[name]

  return function (byOrigin, evt) {
    var lastArr = byOrigin[evt.o]

    lastArr || (lastArr = byOrigin[evt.o] = [])

    var last = lastArr[lastArr.length - 1]

    if (last && last.e > (evt.s - maxGap)) {
      last.e = evt.e
    } else {
      lastArr.push(evt)
    }

    return byOrigin
  }
}

function val (key, value) {
  return value
}

function flatten (a, b) {
  return a.concat(b)
}

function noop () {}


},{"../../../agent/aggregator":2,"../../../agent/harvest":5,"../../../agent/register-handler":8,"../../../agent/start-time":11,"../../err/aggregate/clean-url":14,"ee":false,"loader":false,"lodash._slice":21,"map-own":20}],19:[function(require,module,exports){
var agg = require('../../../agent/aggregator')
  , register = require('../../../agent/register-handler')
  , harvest = require('../../../agent/harvest')
  , stringify = require('../../../agent/stringify')
  , nr = require('loader')

// bail if not instrumented
if (!nr.features.xhr) return

harvest.on('jserrors', function () {
  return { body: agg.take([ 'xhr' ]) }
})

register('xhr', storeXhr)

module.exports = storeXhr

function storeXhr (params, metrics, start) {
  metrics.time = start - nr.offset
  if (params.cat) {
    agg.store('xhr', stringify([params.status, params.cat]), params, metrics)
  }
  else {
    agg.store('xhr', stringify([params.status, params.host, params.pathname]), params, metrics)
  }
}


},{"../../../agent/aggregator":2,"../../../agent/harvest":5,"../../../agent/register-handler":8,"../../../agent/stringify":12,"loader":false}],20:[function(require,module,exports){
var has = Object.prototype.hasOwnProperty

module.exports = mapOwn

function mapOwn (obj, fn) {
  var results = []
    , key = ''
    , i = 0

  for (key in obj) {
    if (has.call(obj, key)) {
      results[i] = fn(key, obj[key])
      i += 1
    }
  }

  return results
}


},{}],21:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * Slices the `collection` from the `start` index up to, but not including,
 * the `end` index.
 *
 * Note: This function is used instead of `Array#slice` to support node lists
 * in IE < 9 and to ensure dense arrays are returned.
 *
 * @private
 * @param {Array|Object|string} collection The collection to slice.
 * @param {number} start The start index.
 * @param {number} end The end index.
 * @returns {Array} Returns the new array.
 */
function slice(array, start, end) {
  start || (start = 0);
  if (typeof end == 'undefined') {
    end = array ? array.length : 0;
  }
  var index = -1,
      length = end - start || 0,
      result = Array(length < 0 ? 0 : length);

  while (++index < length) {
    result[index] = array[start + index];
  }
  return result;
}

module.exports = slice;

},{}]},{},[6,16,19,18])