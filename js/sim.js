// The Nova D1 simulator. Unchanged from the page it was lifted out of.
// MODS is a hand-maintained manifest: a module added to the Nova D1 package must be added here too.
const REPO = 'https://raw.githubusercontent.com/dash1101/RPCortex-repo/main/repo/packages/novad1/';
// Every Nova D1 package module, fetched live from the repo. The FILE LIST is
// hand-maintained: add a module to the package and it must be added here too,
// or the sim 404s on it and whatever imports it dies.
const MODS = ['novacore','novaboard','novamodtab','novafont','novafont5x7','novaicons','novainput','novacanvas','display','novacrypt',
  'novamesh','novalora','novamsg','novastore','novanfc','novacc','novair','novable',
  'novapower','novanotify','novastealth','novawardrive','novawifi','novalog','novartc','novasound','novasplash',
  'nova','novamods','novaui','novaapps','novaoui','novableid','novawatch',
  'novajob','novagui_sensors','novagui_radios','novagui_system','novagui_watch','novagui_res','novagui_files',
  'novagui_shell','novagui','novaservice',
  'novad1','novaweb','novaappcfg','novaappstore','novapcap','novarfid'];

const BOOT = `
import sys, types, time as _t, os as _os
def _install():
    m=types.ModuleType('machine')
    class Pin:
        OUT=1; IN=0; PULL_UP=2
        def __init__(s,*a,**k): pass
        def value(s,*a): return 0
        def irq(s,*a,**k): pass
    class I2C:
        def __init__(s,*a,**k): pass
        def scan(s): return []
        def writeto(s,*a,**k): pass
        def readfrom(s,*a,**k): return b'\\x00'*32
    class SPI:
        def __init__(s,*a,**k): pass
        def write(s,*a): pass
        def read(s,n,*a): return b'\\x00'*n
        def deinit(s): pass
    m.Pin=Pin; m.I2C=I2C; m.SPI=SPI
    m.RTC=lambda *a: types.SimpleNamespace(datetime=lambda *a:(2026,6,30,0,12,30,0,0))
    m.freq=lambda *a: 240000000
    sys.modules['machine']=m
    sys.modules['network']=types.SimpleNamespace(WLAN=lambda *a: types.SimpleNamespace(active=lambda *a:False, scan=lambda:[], isconnected=lambda:False, status=lambda *a:0), STA_IF=0)
    sys.modules['utime']=types.SimpleNamespace(ticks_ms=lambda:int(_t.time()*1000), ticks_us=lambda:int(_t.time()*1e6), ticks_diff=lambda a,b:a-b, ticks_add=lambda a,b:a+b, sleep_ms=lambda ms:None, sleep_us=lambda us:None, time=lambda:int(_t.time()), localtime=lambda *a:_t.localtime(*(a or ())))
    sys.modules['uos']=types.SimpleNamespace(urandom=_os.urandom, listdir=lambda p='.':[], stat=lambda p:(_ for _ in ()).throw(OSError), mkdir=lambda p:None)
    _reg={'System.TZ_Offset':'0','Apps.NovaD1_Contrast':'255','Apps.NovaD1_DimSec':'0','Apps.NovaD1_OffSec':'0'}
    sys.modules['regedit']=types.SimpleNamespace(read=lambda k:_reg.get(k), save=lambda k,v:_reg.__setitem__(k,v) or True)
_install()
sys.path.insert(0,'/nova')
import novacanvas, display, novagui, novainput as ev
_mk=display.MockDisplay(128,64)
_ui=novagui.NovaUI(_mk, novacanvas.Canvas(128,64), types.SimpleNamespace(poll=lambda:None),
                   {'wifi':'connected','time':'12:30','notify':0,'saving':False,'power':{}},
                   novagui.build_home({}))
_ui.render()
_EV={'cw':ev.ROT_CW,'ccw':ev.ROT_CCW,'select':ev.SELECT,'back':ev.BACK}
def key(name):
    if name=='home':
        _ui._apply('home')
    else:
        e=_EV.get(name)
        if e is not None:
            _ui.handle(e)
    _ui.render()
def tick():
    try:
        _ui.stack[-1].tick(33)
    except Exception:
        pass
    _ui.render()
def frame():
    return bytes(_mk.last)
def _push(scr):
    _ui.stack.append(scr); _ui.render()
def _info(title, lines):
    return novagui.TextScreen(title, lines)
def load_file(fname, text):
    # Parse a real Flipper .ir / .sub / .nfc with the SAME codecs the device uses,
    # then show it on the virtual screen — proof the interop is real, in a browser.
    low = (fname or '').lower()
    try:
        if low.endswith('.ir'):
            import novair
            sigs = novair.parse_flipper(text)
            if not sigs:
                _push(_info('IR', ['(no signals parsed)'])); return 'IR: no signals found'
            _push(novagui.IRSignalsScreen(fname[:14], sigs))
            return 'IR remote loaded: {} button(s) - Select fires'.format(len(sigs))
        if low.endswith('.sub'):
            import novacc
            d = novacc.parse_flipper(text)
            lines = ['Freq {:.2f} MHz'.format(d.get('freq_mhz') or 0),
                     'Proto: ' + str(d.get('protocol', '?'))[:15]]
            if 'key' in d:
                lines.append('Key ' + str(d.get('key', ''))[:15])
                lines.append('Bits {}  TE {}'.format(d.get('bit'), d.get('te')))
            elif 'raw' in d:
                lines.append('RAW {} edges'.format(len(d.get('raw') or [])))
            _push(_info('Sub-GHz', lines)); return 'Sub-GHz code parsed'
        if low.endswith('.nfc'):
            import novanfc
            card = novanfc.parse(text)
            dt, sub = novanfc.identify(card.sak(), card.atqa())
            _push(_info('NFC', ['Type: ' + str(sub or dt)[:15],
                                'UID ' + novanfc.hexs(card.uid()),
                                'SAK {:02X}'.format(card.sak())]))
            return 'NFC tag parsed: ' + str(sub or dt)
        return 'drop a .ir, .sub or .nfc file'
    except Exception as e:
        return 'parse error: ' + str(e)
`;

let py=null, pyKey=null, pyTick=null, pyFrame=null, pyLoad=null;
const cv=document.getElementById('oled'), ctx=cv.getContext('2d');
const statusEl=document.getElementById('status'), errEl=document.getElementById('err');

function fail(msg){ errEl.style.display='block'; errEl.textContent='Simulator error:\\n'+msg+
  '\\n\\nReport it at github.com/dash1101/NovaLabs/issues'; statusEl.textContent='failed to start'; }

function draw(){
  if(!pyFrame) return;
  let proxy=pyFrame();
  let buf = proxy.toJs ? proxy.toJs() : proxy;
  if(proxy.destroy) proxy.destroy();
  const img=ctx.createImageData(128,64);
  for(let y=0;y<64;y++) for(let x=0;x<128;x++){
    const on = buf[(y>>3)*128+x] & (1<<(y&7));
    const i=(y*128+x)*4;
    img.data[i]   = on?143:6;
    img.data[i+1] = on?227:11;
    img.data[i+2] = on?255:22;
    img.data[i+3] = 255;
  }
  ctx.putImageData(img,0,0);
}
function K(name){ if(!pyKey)return; try{ pyKey(name); }catch(e){ fail(''+e); } draw(); }
window.K=K;

function loadFlipperFile(file){
  if(!file) return;
  if(!pyLoad){ statusEl.textContent='still loading — try again in a second'; return; }
  const rd=new FileReader();
  rd.onload=()=>{
    let msg;
    try{ msg=pyLoad(file.name, rd.result); }catch(e){ msg='error: '+e; }
    statusEl.textContent = ''+(msg||'loaded');
    draw();
  };
  rd.readAsText(file);
}
window.loadFlipperFile=loadFlipperFile;

function loop(){ if(pyTick){ try{ pyTick(); }catch(e){} draw(); } requestAnimationFrame(loop); }

document.addEventListener('keydown',e=>{
  const m={'ArrowUp':'ccw','ArrowLeft':'ccw','ArrowDown':'cw','ArrowRight':'cw',
           'Enter':'select','Backspace':'back','h':'home'};
  if(m[e.key]!==undefined){ e.preventDefault(); K(m[e.key]); }
});

// Drag-and-drop a real Flipper .ir/.sub/.nfc onto the device -> it parses with the
// live codecs and shows on the virtual screen.
const dev=document.querySelector('.device');
['dragover','dragenter'].forEach(n=>dev.addEventListener(n,e=>{e.preventDefault(); dev.classList.add('drag');}));
['dragleave','dragend'].forEach(n=>dev.addEventListener(n,e=>{e.preventDefault(); dev.classList.remove('drag');}));
dev.addEventListener('drop',e=>{ e.preventDefault(); dev.classList.remove('drag');
  const f=e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if(f) loadFlipperFile(f); });

(async()=>{
  try{
    py = await loadPyodide();
    statusEl.textContent='fetching Nova modules…';
    py.FS.mkdir('/nova');
    for(const mod of MODS){
      const r = await fetch(REPO+mod+'.py');
      if(!r.ok) throw 'fetch '+mod+'.py -> HTTP '+r.status;
      py.FS.writeFile('/nova/'+mod+'.py', await r.text());
    }
    statusEl.textContent='starting GUI…';
    py.runPython(BOOT);
    pyKey=py.globals.get('key'); pyTick=py.globals.get('tick'); pyFrame=py.globals.get('frame');
    pyLoad=py.globals.get('load_file');
    statusEl.textContent='Nova D1 ready — use the controls or your keyboard';
    draw(); loop();
  }catch(e){ fail(''+(e && e.message || e)); }
})();
