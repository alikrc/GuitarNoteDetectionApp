// Ses ve nota temeli: diyapazon, nota adları, dizek, perde bulucu, FFT.
// Tarayıcıda <script> ile sırayla yüklenir (music → guitar → chords → rhythm → …); Node testleri vm ile aynı sırada yükler.

let A4_HZ = 440;
const NOTE_EN = ["C","C♯","D","E♭","E","F","F♯","G","G♯","A","B♭","B"];
const NOTE_TR = ["Do","Do♯","Re","Mi♭","Mi","Fa","Fa♯","Sol","Sol♯","La","Si♭","Si"];


function setA4(hz){
  if(!(hz >= 400 && hz <= 480)) throw new Error("diyapazon 400-480 Hz arasında olmalı: " + hz);
  A4_HZ = hz;
}
function getA4(){ return A4_HZ; }
function midiToFreq(m){ return A4_HZ * Math.pow(2,(m-69)/12); }
function freqToMidi(f){ return 69 + 12*Math.log2(f/A4_HZ); }
function noteName(m){
  const pc = ((m%12)+12)%12, oct = Math.floor(m/12)-1;
  return { tr: NOTE_TR[pc]+oct, en: NOTE_EN[pc]+oct };
}
// Gitar anahtarlı (altında 8 olan sol anahtarı) dizekte yazılı notanın yeri. step: alt çizgi (Mi4) 0,
// her çizgi/aralık 1 adım; 0, 2, 4, 6, 8 dizek çizgileri, eksi ve 8'den büyük çift adımlar ek çizgi.
// Sol♯6 ve üstü (5'ten fazla ek çizgi) bir oktav aşağı yazılıp üstüne 8va konur.
const STAFF_LETTER = [0,0,1,2,2,3,3,4,4,5,6,6];            // Do Re Mi Fa Sol La Si
const STAFF_ACC    = ["","♯","","♭","","","♯","","♯","","♭",""];
const OTTAVA_FROM = 92;
function staffPos(written){
  const ottava = written >= OTTAVA_FROM;
  const m = ottava ? written - 12 : written;
  const pc = ((m%12)+12)%12, oct = Math.floor(m/12)-1;
  return { step: oct*7 + STAFF_LETTER[pc] - 30, acc: STAFF_ACC[pc], ottava };
}
// Yazılı notanın tampere frekansı (transpose: yazılı − duyulan yarım ses)
function writtenFreq(written, transpose){ return midiToFreq(written - transpose); }

function fftMag(buf){
  let n = 1; while(n < buf.length) n <<= 1;
  const re = new Float64Array(n), im = new Float64Array(n);
  for(let i=0;i<buf.length;i++) re[i] = buf[i] * (0.5 - 0.5*Math.cos(2*Math.PI*i/(buf.length-1)));   // Hann
  for(let i=1, j=0; i<n; i++){
    let bit = n >> 1;
    for(; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if(i < j){ let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for(let len=2; len<=n; len<<=1){
    const ang = -2*Math.PI/len, wr = Math.cos(ang), wi = Math.sin(ang), half = len/2;
    for(let i=0; i<n; i+=len){
      let cr = 1, ci = 0;
      for(let k=0; k<half; k++){
        const a = i+k, b = a+half;
        const tr = re[b]*cr - im[b]*ci, ti = re[b]*ci + im[b]*cr;
        re[b] = re[a]-tr; im[b] = im[a]-ti; re[a] += tr; im[a] += ti;
        const ncr = cr*wr - ci*wi; ci = cr*wi + ci*wr; cr = ncr;
      }
    }
  }
  const mag = new Float64Array(n/2);
  for(let k=0;k<n/2;k++) mag[k] = Math.hypot(re[k], im[k]);
  return { mag, n };
}

// Ortanca (gecikme ölçümünde tek tük kaçan vuruşlar sonucu bozmasın)
function median(a){ const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m-1] + s[m]) / 2; }

// Hassasiyet 1 (en az) – 10 (en çok) → sessizlik eşiği (RMS).
function sensitivityToRms(s){ return 0.03 * Math.pow(0.002/0.03, (s-1)/9); }

// McLeod perde bulucu (NSDF). Gitar için varsayılan aralık 60–1400 Hz (Drop D'nin Re2'si ile 20. perde üstü).
function detectPitch(buf, sampleRate, minHz=60, maxHz=1400, minRms=0.008){
  const n = buf.length;
  let sum=0; for(let i=0;i<n;i++) sum+=buf[i]*buf[i];
  const rms = Math.sqrt(sum/n);
  if(rms < minRms) return { freq:-1, rms, clarity:0 };
  const tauMin = Math.max(2, Math.floor(sampleRate/maxHz));
  const tauMax = Math.min(Math.floor(sampleRate/minHz), Math.floor(n/2));
  const nsdf = new Float32Array(tauMax+2);
  for(let tau=tauMin; tau<=tauMax; tau++){
    let ac=0, m=0; const lim=n-tau;
    for(let i=0;i<lim;i++){ const a=buf[i], b=buf[i+tau]; ac+=a*b; m+=a*a+b*b; }
    nsdf[tau] = m>0 ? 2*ac/m : 0;
  }
  let gmax=0;
  for(let t=tauMin+1;t<tauMax;t++) if(nsdf[t]>gmax) gmax=nsdf[t];
  if(gmax < 0.45) return { freq:-1, rms, clarity:gmax };
  const thr = 0.9*gmax;
  let pick=-1;
  for(let t=tauMin+1;t<tauMax;t++){
    if(nsdf[t]>nsdf[t-1] && nsdf[t]>=nsdf[t+1] && nsdf[t]>=thr){ pick=t; break; }
  }
  if(pick<0) return { freq:-1, rms, clarity:gmax };
  const a=nsdf[pick-1], b=nsdf[pick], c=nsdf[pick+1];
  const den = a - 2*b + c;
  const shift = den!==0 ? 0.5*(a-c)/den : 0;
  return { freq: sampleRate/(pick+shift), rms, clarity:gmax };
}

// Ekrandaki notanın titrememesi için: yeni nota ancak art arda `hold` ölçümde
// aynı kalırsa kabul edilir. Gösterilen nota sürerken her ölçüm geçer.
class NoteStabilizer{
  constructor(hold=3){ this.hold=hold; this.reset(); }
  reset(){ this.shown=null; this.cand=null; this.count=0; }
  push(key){
    if(key===this.shown){ this.cand=null; this.count=0; return true; }
    if(key===this.cand) this.count++;
    else { this.cand=key; this.count=1; }
    if(this.count>=this.hold){ this.shown=key; this.cand=null; this.count=0; return true; }
    return false;
  }
}
function noteKey(r){ return String(r.written); }
