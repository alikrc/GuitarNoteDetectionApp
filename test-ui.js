// Arayüz testleri: index.html jsdom içinde gerçek betiklerle yüklenir; ses ve mikrofon sahte nesnelerle değiştirilir.
// Sekmeler, akorlar, şarkılar, ezgiler, kulak, metronom, dersler ve ayarlar tıklanarak denenir.
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole, ResourceLoader } = require('jsdom');

// Sayfa sahte bir http adresinden açılır (file:// adreste history.replaceState jsdom'da güvenlik hatası verir);
// bu adresteki dosyalar diskten okunur.
const ORIGIN = 'http://gitar.test/';
class DiskLoader extends ResourceLoader{
  fetch(url, opts){
    if(url.startsWith(ORIGIN)){
      const p = Promise.resolve(fs.readFileSync(path.join(__dirname, decodeURIComponent(url.slice(ORIGIN.length).split(/[?#]/)[0]))));
      p.abort = () => {};
      return p;
    }
    return super.fetch(url, opts);
  }
}

let fail = 0;
const ok = (c, msg, extra = '') => { console.log((c ? '  OK  ' : '  FAIL') + ' ' + msg + (extra ? '   ' + extra : '')); if(!c) fail++; };

// ---- Sahte Web Audio: düğümler bağlanır, zamanlama çağrıları kabul edilir, ses çıkmaz ----
function fakeAudio(win){
  const param = v => ({ value: v, setValueAtTime(){}, exponentialRampToValueAtTime(){}, linearRampToValueAtTime(){},
                        setTargetAtTime(){}, cancelScheduledValues(){} });
  const node = extra => Object.assign({ connect(n){ return n; }, disconnect(){} }, extra);
  class FakeAudioContext{
    constructor(){ this.t0 = win.performance.now(); this.sampleRate = 48000; this.state = 'running'; this.destination = node(); }
    get currentTime(){ return (win.performance.now() - this.t0) / 1000; }
    resume(){ return Promise.resolve(); }
    createPeriodicWave(){ return {}; }
    createOscillator(){ return node({ frequency: param(440), setPeriodicWave(){}, start(){}, stop(){}, onended: null }); }
    createBiquadFilter(){ return node({ type: '', Q: param(1), frequency: param(1000) }); }
    createGain(){ return node({ gain: param(1) }); }
    createWaveShaper(){ return node({ curve: null, oversample: 'none' }); }
    createBuffer(ch, len){ const d = new Float32Array(len); return { getChannelData: () => d }; }
    createBufferSource(){ return node({ buffer: null, start(){} }); }
    createAnalyser(){ return node({ fftSize: 2048, getFloatTimeDomainData(){} }); }
  }
  win.AudioContext = FakeAudioContext;
}

async function load(storage = {}){
  const errors = [];
  const vc = new VirtualConsole();
  // jsdom'un CSS ayrıştırıcısı bazı modern kuralları tanımıyor: uygulama hatası değil
  vc.on('jsdomError', e => { if(!/Could not parse CSS stylesheet/.test(e.message)) errors.push(e.message); });
  vc.on('error', e => errors.push(String(e)));
  const file = path.join(__dirname, 'index.html');
  const dom = new JSDOM(fs.readFileSync(file, 'utf8'), {
    url: ORIGIN + 'index.html',
    runScripts: 'dangerously', resources: new DiskLoader(), pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(win){
      fakeAudio(win);
      win.Element.prototype.scrollIntoView = function(){};
      win.scrollTo = () => {};
      win.confirm = () => true;
      win.HTMLCanvasElement.prototype.getContext = () => null;
      for(const k in storage) win.localStorage.setItem('gt.' + k, JSON.stringify(storage[k]));
    }
  });
  await new Promise(r => dom.window.addEventListener('load', r));
  return { dom, win: dom.window, doc: dom.window.document, errors };
}
const tick = (ms = 0) => new Promise(r => setTimeout(r, ms));

(async () => {
  const { win, doc, errors } = await load();
  const $ = id => doc.getElementById(id);
  const click = el => el.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  const g = name => win.eval(name);                    // const ile tanımlı genel adlar window'da görünmez
  const visible = () => [...doc.querySelectorAll('.panel')].filter(p => !p.hidden).map(p => p.id);

  console.log('\n[UI 1] Yükleme ve sekmeler');
  ok(errors.length === 0, 'sayfa betik hatası olmadan yükleniyor', errors.slice(0, 3).join(' | '));
  const tabs = [...doc.querySelectorAll('[role=tab]')];
  ok(tabs.length === 8 && visible().join() === 'panel-dersler', 'ilk açılışta yalnız Dersler paneli görünür', visible().join());
  let tabErr = [];
  for(const t of tabs){
    click(t);
    const want = t.getAttribute('aria-controls');
    if(visible().join() !== want || t.getAttribute('aria-selected') !== 'true') tabErr.push(want);
  }
  ok(tabErr.length === 0, 'her sekme kendi panelini açıyor, diğerleri gizleniyor', tabErr.join(','));
  ok(win.location.hash === '#kulak' && JSON.parse(win.localStorage.getItem('gt.tab')) === 'kulak', 'açık sekme adrese ve hafızaya yazılıyor');

  console.log('\n[UI 2] Dersler');
  ok(doc.querySelectorAll('#llist .lesson').length === 16 && doc.querySelector('#llist .lesson').classList.contains('open'), '16 ders, ilki açık');
  click(doc.querySelector('#llist .lesson .stopbtn'));          // Atla
  ok(doc.querySelectorAll('#llist .lesson.done').length === 1 && $('lcount').textContent.startsWith('1 /'), 'Atla dersi tamamlıyor, ilerleme güncelleniyor');
  g('Bus').emit('achieve', { type: 'chordClean', chord: 'Em' });
  ok(doc.querySelectorAll('#llist .lesson.done').length === 2, 'başarı olayı açık dersi tamamlıyor (Em)');

  console.log('\n[UI 3] Akort');
  ok($('tstrings').children.length === 6 && $('tstrings').textContent.includes('Mi2'), 'altı tel düğmesi, 6. tel Mi2');
  click(tabs.find(t => t.id === 'tab-akort'));
  g('Bus').emit('frame', { d: { freq: 82.41 * Math.pow(2, -20/1200), rms: 0.1 }, now: win.performance.now(), loud: true });
  ok($('tadvice').textContent.includes('sık') && $('tnote').textContent.startsWith('6. tel'), '20 sent pes 6. tel: "burguyu sık"', $('tadvice').textContent);

  console.log('\n[UI 4] Sap ve notalar');
  g('Bus').emit('note', { r: win.analyze(win.midiToFreq(57) * Math.pow(2, 12/1200), 12), now: win.performance.now(), isNew: true });
  ok($('perde').textContent === 'La4' && $('centtxt').textContent.includes('+12 sent'), 'mikrofondan gelen nota gösteriliyor (La4, +12 sent)', $('perde').textContent + ' / ' + $('centtxt').textContent);
  ok(doc.querySelectorAll('#neck .pos').length === 6 * 21 && doc.querySelectorAll('#rail .note').length === 45, 'sap 6×21 konum, nota şeridi 45 nota');
  ok(!/AEU|koma|Rast/.test($('panel-sap').textContent), 'Sap sekmesinde AEU/koma izi yok');

  console.log('\n[UI 5] Akorlar ve capo');
  const groupBtn = [...$('cgroups').children].find(b => b.textContent === 'Barre');
  click(groupBtn);
  click([...$('clist').children].find(b => b.textContent === 'F'));
  ok($('cname').textContent.startsWith('Fa majör') && $('cdiag').querySelector('rect.cd-dot'), 'F seçilince barre çiziliyor');
  $('capo').value = '2'; $('capo').dispatchEvent(new win.Event('change'));
  ok($('capotag').textContent.includes('Sol majör') && $('capotag').textContent.includes('(G)'), 'capo 2: F şekli G olarak duyulur', $('capotag').textContent);
  $('capo').value = '0'; $('capo').dispatchEvent(new win.Event('change'));

  console.log('\n[UI 6] Şarkılar');
  const songOpts = [...$('songsel').options];
  let songErr = [];
  for(const o of songOpts){
    $('songsel').value = o.value; $('songsel').dispatchEvent(new win.Event('change'));
    if(doc.querySelectorAll('#songsheet .sseg.bad').length) songErr.push(o.value + ': tanınmayan akor');
    if(!doc.querySelectorAll('#songsheet .sseg[data-bar]').length) songErr.push(o.value + ': akor yok');
  }
  ok(songOpts.length >= 18 && songErr.length === 0, songOpts.length + ' hazır şarkının hepsi akorlarıyla çiziliyor', songErr.join(' | '));
  $('songsel').value = 'paramparca'; $('songsel').dispatchEvent(new win.Event('change'));
  ok($('songlyrnote').textContent.includes('telifli') && !$('songlyrbtn').hidden, 'Türkçe şarkıda "telifli olduğu için" notu ve Sözleri kendin ekle düğmesi');
  click($('songlyrbtn'));
  $('songlyrics').value = 'birinci satir sozleri\nikinci satir';
  click($('songmerge')); click($('songsave'));
  const saved = JSON.parse(win.localStorage.getItem('gt.songs') || '[]');
  ok(saved.length === 1 && saved[0].text.includes('sozleri') && saved[0].source && $('songsel').value === saved[0].id,
     'sözler eşleşip kaydediliyor (yalnız yerel depoda), kaynak bağlantısı korunuyor');

  console.log('\n[UI 7] Ezgiler ve kulak');
  ok(doc.querySelectorAll('#melnotes .mnote').length === win.parseMelody(win.melodyById('nese').text).notes.length, 'Neşeye Övgü nota kartları');
  click(tabs.find(t => t.id === 'tab-kulak'));
  click($('earanswers').children[0]);
  ok(doc.querySelectorAll('#eardots i.r, #eardots i.w').length === 1 && [...$('earanswers').children].every(b => b.disabled), 'cevap işaretleniyor, düğmeler kilitleniyor');

  console.log('\n[UI 8] Metronom ve ayarlar');
  click($('metrobtn'));
  ok(!$('metro').hidden, 'Metronom paneli açılıyor');
  click($('mrun')); await tick(80);
  ok(g('Metronome').running && $('mrun').textContent === 'Durdur', 'metronom başlıyor');
  win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape' }));
  ok(!g('Metronome').running, 'Esc metronomu durduruyor');
  click($('mtap')); await tick(500); click($('mtap'));
  ok(Math.abs(+$('mbpmv').textContent - 120) <= 6, 'iki dokunuş ~120 BPM', $('mbpmv').textContent);
  ok($('setbtn').textContent.includes('Akustik'), 'ayar düğmesinde çalgı özeti', $('setbtn').textContent);
  $('instrument').value = 'elektro24'; $('instrument').dispatchEvent(new win.Event('change'));
  ok(doc.querySelectorAll('#neck .pos').length === 6 * 25 && $('setbtn').textContent.includes('Elektro'), 'çalgı değişince sap 24 perde, özet güncel');

  console.log('\n[UI 9] Saklanan ayarlarla açılış');
  const second = await load({ tab: 'akorlar', instrument: 'klasik', capo: 3, chord: 'Dm' });
  const d2 = second.doc;
  ok(second.errors.length === 0 && !d2.getElementById('panel-akorlar').hidden && d2.querySelectorAll('#neck .pos').length === 6 * 20 &&
     d2.getElementById('cname').textContent.startsWith('Re minör') && d2.getElementById('capo').value === '3',
     'son sekme, çalgı, capo ve akor geri yükleniyor', second.errors.join(' | '));

  console.log(fail === 0 ? '\nTUM ARAYUZ TESTLERI GECTI\n' : `\n${fail} ARAYUZ TESTI BASARISIZ\n`);
  win.close(); second.win.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
