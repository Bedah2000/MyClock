(function () {
  'use strict';
  var api = null, started = false, finished = false;
  function findAPI(w) {
    for (var i=0; w && i<20; i++) {
      try {
        if (w.API && typeof w.API.LMSInitialize === 'function') return w.API;
        if (w.parent === w) break;
        w = w.parent;
      } catch (_) { break; }
    }
    return null;
  }
  function call(method, value) {
    try { return api[method](value); } catch (_) { return null; }
  }
  function start() {
    finished = false;
    api = findAPI(window);
    if (!api) { try { api = findAPI(window.opener); } catch (_) {} }
    if (!api) return;
    started = String(call('LMSInitialize', '')) === 'true';
    if (!started) return;
    var status = call('LMSGetValue','cmi.core.lesson_status');
    if (!status || status === 'not attempted') {
      try { api.LMSSetValue('cmi.core.lesson_status','browsed'); } catch (_) {}
    }
    call('LMSCommit','');
  }
  function finish() {
    if (!started || finished) return;
    finished = true;
    call('LMSCommit','');
    call('LMSFinish','');
    started = false;
  }
  window.addEventListener('pagehide',finish);
  window.addEventListener('beforeunload',finish);
  window.addEventListener('pageshow',function(event) { if(event.persisted) start(); });
  document.addEventListener('visibilitychange',function() {
    if(document.hidden && started && !finished) call('LMSCommit','');
  });
  start();
})();
