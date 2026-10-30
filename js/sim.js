// The Nova D1 simulator.
//
// sim/novad1-sim.wasm is the Nova D1 package for RPCortex v2, compiled to
// WebAssembly from the same C++ the device runs (RPCortex-v2/os/host/sim_wasm.cpp,
// built with build_sim.sh). This file is only the glass around it: it hands the
// module the time and the key presses, and draws the panel's memory to a canvas.
//
// Nothing here draws the interface. The module owns every pixel; if a screen looks
// wrong, the bug is in the device's code and this page is showing it faithfully.
(function () {
  'use strict';

  var WASM = 'sim/novad1-sim.wasm';

  var canvas = document.getElementById('oled');
  var ctx = canvas.getContext('2d');
  var bezel = document.getElementById('bezel');
  var statusEl = document.getElementById('status');
  var errEl = document.getElementById('err');
  var stampEl = document.getElementById('stamp');
  var img = ctx.createImageData(128, 64);

  // The gestures, as the module numbers them (nova::Event).
  var EV = { cw: 1, ccw: 2, select: 3, back: 4, home: 5, selectHold: 6, homeHold: 7 };
  var HOLD_MS = 600;     // the device's own threshold (HOLD_MS in novainput.h)

  var x = null;          // the module's exports
  var lastGen = -1, lastPanel = -1;
  var lastTs = 0, carry = 0;
  var raf = 0;

  function fail(msg) {
    errEl.hidden = false;
    errEl.textContent = 'The simulator could not start.\n' + msg;
    statusEl.textContent = 'not running';
  }

  // ---- drawing -------------------------------------------------------------------

  // The panel's memory is 8 pages of 128 columns; a byte is a column, bit 0 the top
  // row of its page. Lit pixels take the page's accent colour, the rest are black.
  var ON = [214, 238, 255];

  function draw() {
    var fb = new Uint8Array(x.memory.buffer, x.sim_fb(), 1024);
    var d = img.data;
    for (var col = 0; col < 128; col++) {
      for (var row = 0; row < 64; row++) {
        var lit = (fb[(row >> 3) * 128 + col] >> (row & 7)) & 1;
        var o = (row * 128 + col) * 4;
        d[o] = lit ? ON[0] : 4;
        d[o + 1] = lit ? ON[1] : 8;
        d[o + 2] = lit ? ON[2] : 14;
        d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // Contrast, on/off and inversion are properties of the controller, not of the
  // picture, so they are applied to the glass and not baked into the pixels.
  function applyPanel(p) {
    var on = p & 1, inv = (p >> 1) & 1, contrast = (p >> 8) & 255;
    canvas.style.opacity = on ? (0.22 + 0.78 * contrast / 255).toFixed(2) : '0';
    canvas.style.filter = inv ? 'invert(1)' : 'none';
    bezel.classList.toggle('off', !on);
  }

  function frame(ts) {
    raf = requestAnimationFrame(frame);
    if (!x) return;
    if (!lastTs) lastTs = ts;
    // A hidden tab stops requestAnimationFrame; the gap on return is not time the
    // device spent running, so it is capped rather than replayed.
    var dt = Math.min(ts - lastTs, 100) + carry;
    lastTs = ts;
    var whole = Math.floor(dt);
    carry = dt - whole;
    var gen = x.sim_frame(whole);
    var panel = x.sim_panel();
    if (gen !== lastGen) { draw(); lastGen = gen; }
    if (panel !== lastPanel) { applyPanel(panel); lastPanel = panel; }
  }

  // ---- input ---------------------------------------------------------------------

  function send(ev) { if (x) x.sim_key(ev); }

  // A press that is held becomes the hold gesture and is not also sent as a tap,
  // which is how the device treats SELECT and HOME. BACK and the knob only tap.
  function holdable(el, tap, hold) {
    var timer = 0, fired = false;
    function down(e) {
      e.preventDefault();
      fired = false;
      if (hold) timer = setTimeout(function () { fired = true; send(hold); }, HOLD_MS);
      el.classList.add('down');
    }
    function up() {
      clearTimeout(timer);
      el.classList.remove('down');
      if (!fired && timer !== -1) send(tap);
      timer = -1;
    }
    function cancel() { clearTimeout(timer); timer = -1; el.classList.remove('down'); }
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', cancel);
    el.addEventListener('pointercancel', cancel);
    // A long press on a phone opens the context menu, which would cancel the hold.
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    // A keyboard user activating the focused button: Enter or Space is a tap.
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); send(tap); }
    });
  }

  function wireButtons() {
    holdable(document.getElementById('b-ccw'), EV.ccw, 0);
    holdable(document.getElementById('b-cw'), EV.cw, 0);
    holdable(document.getElementById('b-back'), EV.back, 0);
    holdable(document.getElementById('b-select'), EV.select, EV.selectHold);
    holdable(document.getElementById('b-home'), EV.home, EV.homeHold);

    document.getElementById('b-net').addEventListener('click', function (e) {
      var on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      e.currentTarget.setAttribute('aria-pressed', on ? 'true' : 'false');
      e.currentTarget.textContent = on ? 'Wi-Fi: on' : 'Wi-Fi: off';
      x.sim_net(on ? 1 : 0);
    });
    document.getElementById('b-reset').addEventListener('click', start);

    // The knob, on the wheel.
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      send(e.deltaY > 0 ? EV.cw : EV.ccw);
    }, { passive: false });

    // The keyboard. Enter and h are held for their hold gestures; the rest tap.
    var keyTimer = {}, keyFired = {};
    var taps = {
      ArrowUp: EV.ccw, ArrowLeft: EV.ccw, ArrowDown: EV.cw, ArrowRight: EV.cw,
      Backspace: EV.back, Escape: EV.back
    };
    var holds = { Enter: [EV.select, EV.selectHold], ' ': [EV.select, EV.selectHold],
                  h: [EV.home, EV.homeHold], H: [EV.home, EV.homeHold], Home: [EV.home, EV.homeHold] };
    window.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target && e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA') return;
      if (e.target && e.target.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
      if (taps[e.key] !== undefined) { e.preventDefault(); send(taps[e.key]); return; }
      var h = holds[e.key];
      if (h && !e.repeat) {
        e.preventDefault();
        keyFired[e.key] = false;
        keyTimer[e.key] = setTimeout(function () { keyFired[e.key] = true; send(h[1]); }, HOLD_MS);
      }
    });
    window.addEventListener('keyup', function (e) {
      var h = holds[e.key];
      if (!h || keyTimer[e.key] === undefined) return;
      clearTimeout(keyTimer[e.key]);
      delete keyTimer[e.key];
      if (!keyFired[e.key]) send(h[0]);
    });
  }

  // ---- start ---------------------------------------------------------------------

  var bytes = null;

  function instantiate() {
    return WebAssembly.instantiate(bytes, {}).then(function (r) {
      x = r.instance.exports;
      x._initialize();
    });
  }

  function start() {
    lastGen = -1; lastPanel = -1; lastTs = 0; carry = 0;
    statusEl.textContent = 'starting…';
    var go = bytes ? Promise.resolve() : fetch(new URL(WASM, document.baseURI)).then(function (r) {
      if (!r.ok) throw new Error('could not load ' + WASM + ' (' + r.status + ')');
      return r.arrayBuffer();
    }).then(function (b) { bytes = b; });
    go.then(instantiate).then(function () {
      // The visitor's local time as seconds, so the status bar shows their clock.
      var now = new Date();
      var local = Math.floor(now.getTime() / 1000) - now.getTimezoneOffset() * 60;
      if (!x.sim_init(local)) throw new Error('the runner refused to start');
      var p = x.sim_build();
      var s = '', m = new Uint8Array(x.memory.buffer);
      while (m[p]) s += String.fromCharCode(m[p++]);
      stampEl.textContent = s;
      statusEl.textContent = 'running';
      errEl.hidden = true;
      if (!raf) raf = requestAnimationFrame(frame);
    }).catch(function (e) { fail(String(e && e.message || e)); });
  }

  if (typeof WebAssembly !== 'object') {
    fail('This browser has no WebAssembly.');
    return;
  }
  wireButtons();
  start();
})();
