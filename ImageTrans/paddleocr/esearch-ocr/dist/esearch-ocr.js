var Qt = Object.defineProperty;
var Zt = (t, n, o) => n in t ? Qt(t, n, { enumerable: !0, configurable: !0, writable: !0, value: o }) : t[n] = o;
var kt = (t, n, o) => Zt(t, typeof n != "symbol" ? n + "" : n, o);
let Gt = (t, n) => {
  if (typeof OffscreenCanvas < "u")
    return new OffscreenCanvas(t, n);
  const o = document.createElement("canvas");
  return o.width = t, o.height = n, o;
};
function lt(t, n) {
  return Gt(t, n);
}
function Jt(t) {
  Gt = t;
}
function Vt(t) {
  return t > 0 ? Math.floor(t) : Math.ceil(t);
}
function ot(t, n, o) {
  return Math.max(n, Math.min(t, o));
}
function _t(t, n, o, s, l = "high") {
  return tn(t, n, o, s, l).getImageData(0, 0, n, o);
}
function tn(t, n, o, s, l = "high") {
  const c = K(t), u = lt(n, o).getContext("2d");
  return u.imageSmoothingEnabled = l !== !1, l && (u.imageSmoothingQuality = l), s === "fill" ? u.scale(Math.min(n / t.width, 1), Math.min(o / t.height, 1)) : u.scale(n / t.width, o / t.height), u.drawImage(c, 0, 0), u;
}
function K(t, n, o) {
  const s = lt(n || t.width, o || t.height);
  return s.getContext("2d").putImageData(t, 0, 0), s;
}
function Nt(t, n, o) {
  const s = t.data, l = [], c = [], i = [];
  let u = 0, x = 0;
  for (let h = 0; h < s.length; h += 4)
    i[x] || (i[x] = []), c[x] || (c[x] = []), l[x] || (l[x] = []), l[x][u] = (s[h] / 255 - n[0]) / o[0], c[x][u] = (s[h + 1] / 255 - n[1]) / o[1], i[x][u] = (s[h + 2] / 255 - n[2]) / o[2], u++, u === t.width && (u = 0, x++);
  return [i, c, l];
}
class Ht {
  constructor(n) {
    kt(this, "tl", []);
    kt(this, "name");
    this.name = n;
  }
  l(n) {
    const o = performance.now();
    this.tl.push({ t: n, n: o });
    const s = [];
    for (let c = 1; c < this.tl.length; c++) {
      const i = this.tl[c].n - this.tl[c - 1].n, u = this.tl[c - 1].t, x = s.find((h) => h.n === u);
      x ? (x.c++, x.d += i) : s.push({ d: i, n: u, c: 1 });
    }
    const l = [];
    for (const c of s) {
      const i = c.c > 1 ? `${c.n}x${c.c}` : c.n;
      l.push(`${i} ${c.d}`);
    }
    l.push(this.tl.at(-1).t), console.log(`${this.name} ${s.map((c) => c.d).reduce((c, i) => c + i, 0)}ms: `, l.join(" "));
  }
}
async function nn(t, n, o, s, l, c) {
  const { transposedData: i, image: u } = en(t, l, c), h = (await on(i, u, n, o))[0].data, a = h.reduce((b, y) => Math.max(b, y)), f = h.findIndex((b) => b === a);
  return s[f];
}
function en(t, n, o) {
  const s = _t(t, n, o);
  return { transposedData: Nt(s, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]), image: s };
}
async function on(t, n, o, s) {
  const l = t.flat(Number.POSITIVE_INFINITY), c = Float32Array.from(l), i = new o.Tensor("float32", c, [1, 3, n.height, n.width]), u = {};
  u[s.inputNames[0]] = i;
  const x = await s.run(u);
  return Object.values(x);
}
function sn(t) {
  if (t.length === 0) throw new Error("Empty contour");
  const n = cn([...t]);
  let o = Number.POSITIVE_INFINITY;
  const s = {
    center: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
    angle: 0
  };
  for (let l = 0; l < n.length; l++) {
    const c = n[l], i = n[(l + 1) % n.length], u = { x: i.x - c.x, y: i.y - c.y }, x = Math.hypot(u.x, u.y), [h, a] = [u.x / x, u.y / x];
    let f = Number.POSITIVE_INFINITY, b = Number.NEGATIVE_INFINITY, y = Number.POSITIVE_INFINITY, p = Number.NEGATIVE_INFINITY;
    for (const I of n) {
      const w = (I.x - c.x) * h + (I.y - c.y) * a;
      f = Math.min(f, w), b = Math.max(b, w);
      const _ = -(I.x - c.x) * a + (I.y - c.y) * h;
      y = Math.min(y, _), p = Math.max(p, _);
    }
    const m = (b - f) * (p - y);
    if (m < o) {
      o = m;
      const I = (f + b) / 2, w = (y + p) / 2;
      s.center = {
        x: c.x + h * I - a * w,
        y: c.y + a * I + h * w
      }, s.size = {
        width: b - f,
        height: p - y
      }, s.angle = Math.atan2(a, h) * (180 / Math.PI);
    }
  }
  return s.size.width < s.size.height && ([s.size.width, s.size.height] = [s.size.height, s.size.width], s.angle += 90), s.angle = (s.angle % 180 + 180) % 180, s;
}
function cn(t) {
  t.sort((s, l) => s.x - l.x || s.y - l.y);
  const n = [];
  for (const s of t) {
    for (; n.length >= 2 && Ft(n[n.length - 2], n[n.length - 1], s) <= 0; )
      n.pop();
    n.push(s);
  }
  const o = [];
  for (let s = t.length - 1; s >= 0; s--) {
    const l = t[s];
    for (; o.length >= 2 && Ft(o[o.length - 2], o[o.length - 1], l) <= 0; )
      o.pop();
    o.push(l);
  }
  return n.slice(0, -1).concat(o.slice(0, -1));
}
function Ft(t, n, o) {
  return (n.x - t.x) * (o.y - t.y) - (n.y - t.y) * (o.x - t.x);
}
function rn(t, n, o = "CHAIN_APPROX_SIMPLE") {
  const s = t.length, l = s > 0 ? t[0].length : 0, c = Array.from({ length: s }, () => new Array(l).fill(!1));
  for (let i = 0; i < s; i++)
    for (let u = 0; u < l; u++)
      if (t[i][u] !== 0 && !c[i][u] && qt(t, u, i)) {
        const x = an(t, c, u, i, o === "CHAIN_APPROX_SIMPLE");
        n.push(x);
      }
}
function qt(t, n, o) {
  return t[o][n] !== 0 && (o > 0 && t[o - 1][n] === 0 || o < t.length - 1 && t[o + 1][n] === 0 || n > 0 && t[o][n - 1] === 0 || n < t[0].length - 1 && t[o][n + 1] === 0);
}
function an(t, n, o, s, l) {
  const c = [];
  let i = { x: o, y: s }, u = { x: o - 1, y: s };
  const x = /* @__PURE__ */ new Map(), h = /* @__PURE__ */ new Map();
  function a(m) {
    return m.x + m.y * t[0].length;
  }
  function f(m) {
    const I = Math.floor(m / t[0].length);
    return { x: m % t[0].length, y: I };
  }
  function b(m, I) {
    const w = a(m), _ = a(I), M = Ct(I.x - m.x, I.y - m.y), N = Ct(m.x - I.x, m.y - I.y), D = x.get(w) ?? [], B = x.get(_) ?? [];
    x.set(w, [...D, M]), x.set(_, [...B, N]);
  }
  function y(m) {
    const I = a(i);
    u = i, i = { x: i.x + gt[m].dx, y: i.y + gt[m].dy }, b(u, i);
    const _ = (h.get(I) ?? []).filter((M) => M !== m);
    _.length > 0 ? h.set(I, _) : h.delete(I);
  }
  x.set(a(i), [Ct(-1, 0)]);
  let p = 0;
  do {
    c.push(i), n[i.y][i.x] = !0;
    const m = ln(t, x, i);
    if (m.length === 0) {
      if (h.size === 0)
        break;
      const [I, w] = Array.from(h.entries()).at(0), _ = w[0];
      i = f(I), y(_);
    }
    if (m.length >= 1) {
      const I = a(i);
      h.set(I, m);
      const w = m[0];
      y(w);
    }
    p++;
  } while (p < 1e9);
  return l ? un(c) : c;
}
const gt = [
  { dx: 1, dy: 0 },
  // Right
  { dx: 1, dy: -1 },
  // Top-Right
  { dx: 0, dy: -1 },
  // Top
  { dx: -1, dy: -1 },
  // Top-Left
  { dx: -1, dy: 0 },
  // Left
  { dx: -1, dy: 1 },
  // Bottom-Left
  { dx: 0, dy: 1 },
  // Bottom
  { dx: 1, dy: 1 }
  // Bottom-Right
];
function ln(t, n, o) {
  function s(i) {
    return i.x + i.y * t[0].length;
  }
  const l = n.get(s(o)) ?? [], c = [];
  for (const [i, { dx: u, dy: x }] of gt.entries()) {
    if (l.includes(i)) continue;
    const h = o.x + u, a = o.y + x;
    h >= 0 && h < t[0].length && a >= 0 && a < t.length && qt(t, h, a) && c.push(i);
  }
  return c;
}
function Ct(t, n) {
  const o = gt.findIndex(({ dx: s, dy: l }) => t === s && n === l);
  return o === -1 ? 0 : o;
}
function un(t) {
  if (t.length < 3) return [...t];
  const n = [t[0]];
  for (let o = 1; o < t.length - 1; o++) {
    const s = n[n.length - 1], l = t[o], c = t[o + 1];
    hn(s, l, c) || n.push(l);
  }
  return n.push(t[t.length - 1]), n;
}
function hn(t, n, o) {
  return (n.x - t.x) * (o.y - n.y) === (n.y - t.y) * (o.x - n.x);
}
const $ = new Ht("t"), q = new Ht("af_det");
let Y = !1, Bt = !1, G = null;
function at(t, n) {
  var s;
  const o = document.createElement("canvas");
  o.width = t.width, o.height = t.height, o.getContext("2d").drawImage(t, 0, 0), n && (o.id = n);
  try {
    (s = document == null ? void 0 : document.body) == null || s.append(o);
  } catch {
  }
}
let bt = (t, n, o) => new ImageData(t, n, o);
function O(...t) {
  Bt && console.log(...t);
}
function fn(...t) {
  Bt && console.log(t.map((n) => `%c${n}`).join(""), ...t.map((n) => `color: ${n}`));
}
async function Fn(t) {
  dn(t);
  const n = {
    det: "det" in t ? t.det : {
      input: t.detPath,
      ratio: t.detRatio,
      det_db_thresh: t.det_db_thresh,
      det_db_box_thresh: t.det_db_box_thresh,
      det_db_unclip_ratio: t.det_db_unclip_ratio,
      erode_size: t.erode_size,
      min_side: t.min_side,
      on: async (s) => {
        t.onDet && t.onDet(s), t.onProgress && t.onProgress("det", 1, 1);
      }
    },
    rec: "rec" in t ? t.rec : {
      input: t.recPath,
      decodeDic: t.dic,
      imgh: t.imgh,
      on: async (s, l, c) => {
        t.onRec && t.onRec(s, {
          text: l.map((i) => i[0].t).join(""),
          mean: l.map((i) => i[0].mean).reduce((i, u) => i + u, 0) / l.length
        }), t.onProgress && t.onProgress("rec", c, s + 1);
      }
    },
    docCls: "rec" in t ? t.docCls : t.docClsPath ? {
      input: t.docClsPath
    } : void 0,
    analyzeLayout: "rec" in t ? t.analyzeLayout : {
      columnsTip: t.columnsTip,
      docDirs: t.docDirs
    },
    ...t
  }, o = await xn(n);
  return G = o, o;
}
function dn(t) {
  Y = !!t.dev, Bt = Y || !!t.log, Y || ($.l = () => {
  }, q.l = () => {
  }), t.canvas && Jt(t.canvas), t.imageData && (bt = t.imageData);
}
async function Yt(t) {
  let n;
  if (typeof window > "u") {
    const o = t;
    if (!o.data || !o.width || !o.height) throw new Error("invalid image data");
    return o;
  }
  if (typeof t == "string" ? (n = new Image(), n.src = t, await new Promise((o) => {
    n.onload = o;
  })) : (t instanceof ImageData, n = t), n instanceof HTMLImageElement) {
    const s = lt(n.naturalWidth, n.naturalHeight).getContext("2d");
    if (!s) throw new Error("canvas context is null");
    s.drawImage(n, 0, 0), n = s.getImageData(0, 0, n.naturalWidth, n.naturalHeight);
  }
  if (n instanceof HTMLCanvasElement) {
    const o = n.getContext("2d");
    if (!o) throw new Error("canvas context is null");
    n = o.getImageData(0, 0, n.width, n.height);
  }
  return n;
}
function vt() {
  try {
    lt(1, 1), bt(new Uint8ClampedArray(4), 1, 1);
  } catch (t) {
    throw console.log("nodejs need set canvas, please use setOCREnv to set canvas and imageData"), t;
  }
}
async function Yn(t) {
  if (!G) throw new Error("need init");
  return G.ocr(t);
}
async function jn(t) {
  if (!G) throw new Error("need init");
  return G.det(t);
}
async function Gn(t) {
  if (!G) throw new Error("need init");
  return G.rec(t);
}
async function Hn(t) {
  if (!G) throw new Error("need init");
  return G.recognize(t);
}
async function xn(t) {
  vt();
  const n = {
    ort: t.ort,
    ortOption: t.ortOption
  }, o = t.docCls ? await mn({ ...t.docCls, ...n }) : void 0, s = await gn({ ...t.det, ...n }), l = await yn({ ...t.rec, ...n }), c = async (i) => {
    const u = await Yt(i);
    return l.rec(bn(u));
  };
  return {
    ocr: async (i) => {
      let u = await Yt(i), x = 0;
      o && (x = await o.docCls(u), O("dir", x), u = Xt(u, 360 - x));
      const h = await s.det(u), a = await l.rec(h), f = On(a, t.analyzeLayout);
      return O(a, f), $.l("end"), { src: a, ...f, docDir: x };
    },
    det: s.det,
    rec: l.rec,
    recRaw: l.rawRec,
    recognize: c
  };
}
function Dt(t, n, o) {
  return typeof n == "string" || n instanceof ArrayBuffer || n instanceof SharedArrayBuffer, t.InferenceSession.create(n, o);
}
async function mn(t) {
  const n = await Dt(t.ort, t.input, t.ortOption);
  return { docCls: async (s) => nn(s, t.ort, n, [0, 90, 180, 270], 224, 224) };
}
async function gn(t) {
  vt();
  let n = 1;
  const o = await Dt(t.ort, t.input, t.ortOption);
  t.ratio !== void 0 && (n = t.ratio);
  const s = t.det_db_thresh ?? 0.3, l = t.det_db_box_thresh ?? 0, c = t.det_db_unclip_ratio ?? 2, i = t.erode_size ?? 1, u = t.min_side ?? 3;
  async function x(h) {
    var _;
    const a = h;
    if (Y) {
      const M = K(a);
      at(M);
    }
    $.l("pre_det");
    const { data: f, width: b, height: y } = wn(a, n), { transposedData: p, image: m } = f;
    $.l("det");
    const I = await pn(p, m, o, t.ort);
    $.l("aft_det");
    const w = Mn(
      { data: I.data, width: I.dims[3], height: I.dims[2] },
      b,
      y,
      a,
      s,
      l,
      c,
      i,
      u
    );
    return (_ = t == null ? void 0 : t.on) == null || _.call(t, w), w;
  }
  return { det: x };
}
function bn(t) {
  const n = t;
  return [
    {
      box: [
        [0, 0],
        [n.width, 0],
        [n.width, n.height],
        [0, n.height]
      ],
      img: n,
      style: { bg: [255, 255, 255], text: [0, 0, 0] }
    }
  ];
}
async function yn(t) {
  var u;
  vt();
  let n = 48;
  const o = await Dt(t.ort, t.input, t.ortOption), s = t.decodeDic.split(/\r\n|\r|\n/) || [];
  s.at(-1) === "" ? s[s.length - 1] = " " : s.push(" "), t.imgh && (n = t.imgh);
  const l = ((u = t.optimize) == null ? void 0 : u.space) === void 0 ? !0 : t.optimize.space;
  async function c(x, h) {
    var p, m, I;
    const a = [];
    $.l("bf_rec");
    const f = zn(x, n), b = (h == null ? void 0 : h.topK) || ((p = t.multiChar) == null ? void 0 : p.topK) || 2, y = (h == null ? void 0 : h.threshold) || ((m = t.multiChar) == null ? void 0 : m.threshold) || 1e-5;
    for (const [w, _] of f.entries()) {
      const { b: M, imgH: N, imgW: D } = _, B = await In(M, N, D, o, t.ort), E = An(B, s, { topK: b, threshold: y })[0];
      a.push({
        text: E,
        box: x[w].box,
        style: x[w].style
      }), (I = t == null ? void 0 : t.on) == null || I.call(t, w, E, x.length);
    }
    return $.l("rec_end"), a;
  }
  async function i(x) {
    const h = [], a = await c(x, { topK: 2, threshold: 1e-5 });
    for (const f of a) {
      const b = f.text.map((m) => l && m[0].t === "" && m[1].t === " " && m[1].mean > 1e-3 ? m[1] : m[0]), y = b.map((m) => m.t).join("").trim(), p = b.map((m) => m.mean).reduce((m, I) => m + I, 0) / b.length;
      p < 0.5 || h.push({
        text: y,
        mean: p,
        box: f.box,
        style: f.style
      });
    }
    return h;
  }
  return { rec: i, rawRec: c };
}
async function pn(t, n, o, s) {
  const l = Float32Array.from(t.flat(3)), c = new s.Tensor("float32", l, [1, 3, n.height, n.width]), i = {};
  return i[o.inputNames[0]] = c, (await o.run(i))[o.outputNames[0]];
}
async function In(t, n, o, s, l) {
  const c = Float32Array.from(t.flat(3)), i = new l.Tensor("float32", c, [1, 3, n, o]), u = {};
  return u[s.inputNames[0]] = i, (await s.run(u))[s.outputNames[0]];
}
function wn(t, n) {
  const o = Math.max(Math.round(t.height * n / 32) * 32, 32), s = Math.max(Math.round(t.width * n / 32) * 32, 32);
  if (Y) {
    const i = K(t);
    at(i);
  }
  const l = _t(t, s, o, "fill"), c = Nt(l, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]);
  if (O(l), Y) {
    const i = K(l);
    at(i);
  }
  return { data: { transposedData: c, image: l }, width: s, height: o };
}
function Mn(t, n, o, s, l = 0.3, c = 0.5, i = 2, u = 1, x = 3) {
  q.l("");
  const h = Math.min(s.width, n), a = Math.min(s.height, o), { data: f, width: b, height: y } = t, p = new Uint8Array(b * y);
  for (let M = 0; M < f.length; M++) {
    const N = f[M] > l ? 255 : 0;
    p[M] = N;
  }
  let m = p;
  for (let M = 0; M < u; M++) {
    const N = m;
    m = new Uint8Array(b * y);
    for (let D = 0; D < y; D++)
      for (let B = 0; B < b; B++) {
        const E = D * b + B;
        if (N[E] === 0) {
          m[E] = 0;
          continue;
        }
        D > 0 && N[E - b] === 0 || D < y - 1 && N[E + b] === 0 ? m[E] = 0 : m[E] = 255;
      }
  }
  if (Y) {
    const M = new Uint8ClampedArray(b * y * 4);
    for (let B = 0; B < m.length; B++) {
      const E = B * 4, U = m[B];
      M[E] = M[E + 1] = M[E + 2] = U, M[E + 3] = 255;
    }
    const N = bt(M, b, y), D = K(N);
    at(D, "det_ru");
  }
  q.l("edge");
  const I = [], w = [];
  for (let M = 0; M < y; M++)
    w.push(Array.from(m.slice(M * b, M * b + b)));
  const _ = [];
  if (rn(w, _), Y) {
    const M = document.querySelector("#det_ru").getContext("2d");
    for (const N of _) {
      M.moveTo(N[0].x, N[0].y);
      for (const D of N)
        M.lineTo(D.x, D.y);
      M.strokeStyle = "red", M.closePath(), M.stroke();
    }
  }
  for (let M = 0; M < _.length; M++) {
    q.l("get_box");
    const N = x, D = _[M], { points: B, sside: E } = Bn(D);
    if (E < N) continue;
    const U = Sn(B, i), V = U.points;
    if (U.sside < N + 2)
      continue;
    const A = s.width / h, st = s.height / a;
    for (let R = 0; R < V.length; R++)
      V[R][0] *= A, V[R][1] *= st;
    q.l("order");
    const H = vn(V);
    for (const R of H)
      R[0] = ot(Math.round(R[0]), 0, s.width), R[1] = ot(Math.round(R[1]), 0, s.height);
    const Q = Vt(jt(H[0], H[1])), ut = Vt(jt(H[0], H[3]));
    if (Q <= 3 || ut <= 3 || _n(
      f,
      b,
      y,
      B,
      i
    ) < c) continue;
    Rn(V, "", "red", "det_ru"), q.l("crop");
    const Z = Dn(s, V);
    q.l("match best");
    const { bg: F, text: j } = Tn(Z), yt = En(V, Z, j);
    I.push({ box: yt, img: Z, style: { bg: F, text: j } });
  }
  return q.l("e"), O(I), I;
}
function kn(t) {
  let n = -1;
  const o = t.length;
  let s, l = t[o - 1], c = 0;
  for (; ++n < o; )
    s = l, l = t[n], c += s[1] * l[0] - s[0] * l[1];
  return c / 2;
}
function Cn(t) {
  let n = -1;
  const o = t.length;
  let s = t[o - 1], l, c, i = s[0], u = s[1], x = 0;
  for (; ++n < o; )
    l = i, c = u, s = t[n], i = s[0], u = s[1], l -= i, c -= u, x += Math.hypot(l, c);
  return x;
}
function Sn(t, n = 2) {
  const o = Math.abs(kn(t)), s = Cn(t), l = o * n / s, c = [];
  for (const [h, a] of t.entries()) {
    const f = t.at((h - 1) % 4), b = t.at((h + 1) % 4), y = a[0] - f[0], p = a[1] - f[1], m = Math.sqrt(y ** 2 + p ** 2), I = y / m * l, w = p / m * l, _ = a[0] - b[0], M = a[1] - b[1], N = Math.sqrt(_ ** 2 + M ** 2), D = _ / N * l, B = M / N * l;
    c.push([a[0] + I + D, a[1] + w + B]);
  }
  const i = [c[0][0] - c[1][0], c[0][1] - c[1][1]], u = [c[2][0] - c[1][0], c[2][1] - c[1][1]], x = i[0] * u[1] - i[1] * u[0];
  return { points: c, sside: Math.abs(x) };
}
function _n(t, n, o, s, l) {
  let c = 1 / 0, i = -1 / 0, u = 1 / 0, x = -1 / 0;
  for (const w of s)
    c = Math.min(c, w[0]), i = Math.max(i, w[0]), u = Math.min(u, w[1]), x = Math.max(x, w[1]);
  const h = (i - c) * (l - 1) * 0.5, a = (x - u) * (l - 1) * 0.5, f = Math.max(0, Math.floor(c - h)), b = Math.min(n - 1, Math.ceil(i + h)), y = Math.max(0, Math.floor(u - a)), p = Math.min(o - 1, Math.ceil(x + a));
  let m = 0;
  const I = (b - f + 1) * (p - y + 1);
  for (let w = y; w <= p; w++)
    for (let _ = f; _ <= b; _++)
      m += t[w * n + _];
  return I > 0 ? m / I : 0;
}
function Nn(t, n, o) {
  const s = n.width, l = n.height, c = o * Math.PI / 180, i = Math.cos(c), u = Math.sin(c), x = t.x, h = t.y, a = s * 0.5, f = l * 0.5, b = [], y = x - a * i + f * u, p = h - a * u - f * i;
  b.push([y, p]);
  const m = x + a * i + f * u, I = h + a * u - f * i;
  b.push([m, I]);
  const w = x + a * i - f * u, _ = h + a * u + f * i;
  b.push([w, _]);
  const M = x - a * i - f * u, N = h - a * u + f * i;
  return b.push([M, N]), b;
}
function Bn(t) {
  const o = sn(t), s = Array.from(Nn(o.center, o.size, o.angle)).sort(
    (a, f) => a[0] - f[0]
  );
  let l = 0, c = 1, i = 2, u = 3;
  s[1][1] > s[0][1] ? (l = 0, u = 1) : (l = 1, u = 0), s[3][1] > s[2][1] ? (c = 2, i = 3) : (c = 3, i = 2);
  const x = [s[l], s[c], s[i], s[u]], h = Math.min(o.size.height, o.size.width);
  return { points: x, sside: h };
}
function jt(t, n) {
  return Math.sqrt((t[0] - n[0]) ** 2 + (t[1] - n[1]) ** 2);
}
function vn(t) {
  const n = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0]
  ], o = t.map((c) => c[0] + c[1]);
  n[0] = t[o.indexOf(Math.min(...o))], n[2] = t[o.indexOf(Math.max(...o))];
  const s = t.filter((c) => c !== n[0] && c !== n[2]), l = s[1].map((c, i) => c - s[0][i]);
  return n[1] = s[l.indexOf(Math.min(...l))], n[3] = s[l.indexOf(Math.max(...l))], n;
}
function Dn(t, n) {
  const [o, s, l, c] = n.map((B) => ({ x: B[0], y: B[1] })), i = Math.sqrt((s.x - o.x) ** 2 + (s.y - o.y) ** 2), u = Math.sqrt((c.x - o.x) ** 2 + (c.y - o.y) ** 2), x = s.x - o.x, h = s.y - o.y, a = c.x - o.x, f = c.y - o.y, b = x * f - a * h;
  if (b === 0) throw new Error("点共线，无法形成矩形");
  const y = i * f / b, p = -a * i / b, m = -u * h / b, I = x * u / b, w = -y * o.x - p * o.y, _ = -m * o.x - I * o.y, M = K(t), N = lt(Math.ceil(i), Math.ceil(u)), D = N.getContext("2d");
  return D.setTransform(y, m, p, I, w, _), D.drawImage(M, 0, 0), D.resetTransform(), D.getImageData(0, 0, N.width, N.height);
}
function Tn(t) {
  var x, h;
  const n = /* @__PURE__ */ new Map(), o = t.data;
  for (let a = 0; a < o.length; a += 4) {
    if (a / 4 % t.width > t.height * 4) continue;
    const b = o[a], y = o[a + 1], p = o[a + 2], m = [b, y, p].join(",");
    n.set(m, (n.get(m) || 0) + 1);
  }
  const s = Pn(n, 20).map((a) => ({
    el: a.el.split(",").map(Number),
    count: a.count
  })), l = ((x = s.at(0)) == null ? void 0 : x.el) || [255, 255, 255], c = ((h = s.at(1)) == null ? void 0 : h.el) || [0, 0, 0];
  let i = c;
  const u = 100;
  if (xt(c, l) < u) {
    const a = s.slice(1).filter((f) => xt(f.el, l) > 50);
    a.length > 0 && (i = [0, 1, 2].map(
      (f) => Math.round(Wt(a.map((b) => [b.el[f], b.count])))
    )), (a.length === 0 || xt(i, l) < u) && (i = l.map((f) => 255 - f)), fn(`rgb(${i.join(",")})`);
  }
  return {
    bg: l,
    text: i,
    textEdge: c
  };
}
function xt(t, n) {
  const o = t, s = n;
  return Math.sqrt((o[0] - s[0]) ** 2 + (o[1] - s[1]) ** 2 + (o[2] - s[2]) ** 2);
}
function Pn(t, n = 1) {
  let o = [];
  return t.forEach((s, l) => {
    o.length === 0 ? o.push({ el: l, count: s }) : (o.length < n ? o.push({ el: l, count: s }) : o.find((c) => c.count <= s) && o.push({ el: l, count: s }), o.sort((c, i) => i.count - c.count), o.length > n && (o = o.slice(0, n)));
  }), o;
}
function En(t, n, o) {
  let s = 0, l = n.height, c = 0, i = n.width;
  function u(y) {
    return xt(y, o) < 200;
  }
  t: for (let y = s; y < n.height; y++)
    for (let p = 0; p < n.width; p++) {
      const m = dt(n, p, y);
      if (u(m)) {
        s = y;
        break t;
      }
    }
  t: for (let y = l - 1; y >= 0; y--)
    for (let p = 0; p < n.width; p++) {
      const m = dt(n, p, y);
      if (u(m)) {
        l = y;
        break t;
      }
    }
  t: for (let y = c; y < n.width; y++)
    for (let p = s; p <= l; p++) {
      const m = dt(n, y, p);
      if (u(m)) {
        c = y;
        break t;
      }
    }
  t: for (let y = i - 1; y >= 0; y--)
    for (let p = s; p <= l; p++) {
      const m = dt(n, y, p);
      if (u(m)) {
        i = y;
        break t;
      }
    }
  const x = ot(s - 1, 0, 4), h = ot(n.height - l - 1, 0, 4), a = ot(c - 1, 0, 4), f = ot(n.width - i - 1, 0, 4);
  return [
    [t[0][0] + a, t[0][1] + x],
    [t[1][0] - f, t[1][1] + x],
    [t[2][0] - f, t[2][1] - h],
    [t[3][0] + a, t[3][1] - h]
  ];
}
function dt(t, n, o) {
  const s = (o * t.width + n) * 4;
  return Array.from(t.data.slice(s, s + 4));
}
function zn(t, n) {
  const o = [];
  function s(l) {
    const c = Math.floor(n * (l.width / l.height)), i = _t(l, c, n, void 0, !1);
    return Y && at(K(i, c, n)), { data: i, w: c, h: n };
  }
  for (const l of t) {
    let c = l.img;
    c.width < c.height && (c = Xt(c, -90));
    const i = s(c);
    o.push({ b: Nt(i.data, [0.5, 0.5, 0.5], [0.5, 0.5, 0.5]), imgH: i.h, imgW: i.w });
  }
  return O(o), o;
}
function An(t, n, o) {
  const s = t.dims[2], l = [];
  let c = t.dims[0] - 1;
  const i = o.topK, u = o.threshold;
  function x(a) {
    return n.at(a - 1) ?? "";
  }
  for (let a = 0; a < t.data.length; a += s * t.dims[1]) {
    const f = [];
    for (let b = a; b < a + s * t.dims[1]; b += s) {
      const y = t.data.slice(b, b + s), p = [];
      for (let m = 0; m < y.length; m++) {
        const I = y[m];
        if (!(I < u)) {
          if (!(p.length === i && I <= p.at(-1).v)) {
            const w = p.findIndex((_) => _.v > I);
            w === -1 ? p.unshift({ t: m, v: I }) : p.splice(w + 1, 0, { t: m, v: I });
          }
          p.length > i && p.pop();
        }
      }
      f.push(p);
    }
    l[c] = h(f), c--;
  }
  function h(a) {
    const f = [];
    for (let b = 0; b < a.length; b++)
      a[b][0].t !== 0 && (b > 0 && a[b - 1][0].t === a[b][0].t || f.push(a[b].map((y) => ({ t: x(y.t), mean: y.v }))));
    return f;
  }
  return l;
}
function On(t, n) {
  var Rt;
  O(t);
  const o = (n == null ? void 0 : n.docDirs) ?? [
    { block: "tb", inline: "lr" },
    { block: "rl", inline: "tb" }
  ], s = { block: "tb", inline: "lr" }, l = {
    inline: [1, 0],
    block: [0, 1]
  }, c = {
    inline: [1, 0],
    block: [0, 1]
  };
  if (t.length === 0)
    return {
      columns: [],
      parragraphs: [],
      readingDir: s,
      angle: { reading: { inline: 0, block: 90 }, angle: 0 }
    };
  const i = [
    {
      box: [
        [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
        [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY],
        [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
        [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]
      ],
      type: "none"
    }
  ], u = 0;
  function x(e) {
    const r = a.center(e);
    for (let d = i.length - 1; d >= 0; d--) {
      const k = i[d].box;
      if (r[0] >= k[0][0] && r[0] <= k[1][0] && r[1] >= k[0][1] && r[1] <= k[3][1])
        return d;
    }
    return u;
  }
  const h = {
    center: (e, r) => [(e[0] + r[0]) / 2, (e[1] + r[1]) / 2],
    disByV: (e, r, d) => Math.abs(d === "block" ? f.dotMup(e, c.block) - f.dotMup(r, c.block) : f.dotMup(e, c.inline) - f.dotMup(r, c.inline)),
    compare: (e, r, d) => d === "block" ? f.dotMup(e, c.block) - f.dotMup(r, c.block) : f.dotMup(e, c.inline) - f.dotMup(r, c.inline),
    toInline: (e) => f.dotMup(e, c.inline),
    toBlock: (e) => f.dotMup(e, c.block)
  }, a = {
    inlineStart: (e) => h.center(e[0], e[3]),
    inlineEnd: (e) => h.center(e[1], e[2]),
    blockStart: (e) => h.center(e[0], e[1]),
    blockEnd: (e) => h.center(e[2], e[3]),
    inlineSize: (e) => e[1][0] - e[0][0],
    blockSize: (e) => e[3][1] - e[0][1],
    inlineStartDis: (e, r) => h.disByV(e[0], r[0], "inline"),
    inlineEndDis: (e, r) => h.disByV(e[1], r[1], "inline"),
    blockGap: (e, r) => h.disByV(e[0], r[3], "block"),
    inlineCenter: (e) => (e[2][0] + e[0][0]) / 2,
    blockCenter: (e) => (e[2][1] + e[0][1]) / 2,
    inlineStartCenter: (e) => a.inlineStart(e),
    center: (e) => h.center(e[0], e[2])
  }, f = {
    fromPonts: (e, r) => [e[0] - r[0], e[1] - r[1]],
    dotMup: (e, r) => e[0] * r[0] + e[1] * r[1],
    numMup: (e, r) => [e[0] * r, e[1] * r],
    add: (e, r) => [e[0] + r[0], e[1] + r[1]]
  };
  function b(e) {
    let r = 0, d = 0;
    const g = [];
    for (const [k, C] of e.entries()) {
      const S = C > 180 ? C - 180 : C, T = S - 180, z = k === 0 ? S : Math.abs(T - r) < Math.abs(S - r) ? T : S;
      g.push(z), r = (r * d + z) / (d + 1), d++;
    }
    return { av: r, l: g };
  }
  function y(e, r) {
    return Math.abs(e - r) < 45 || Math.abs(e - (r - 180)) < 45 || Math.abs(e - 180 - r) < 45;
  }
  function p(e) {
    e.sort((d, g) => d - g);
    const r = Math.floor(e.length / 2);
    return e.length % 2 === 0 ? (e[r - 1] + e[r]) / 2 : e[r];
  }
  function m(e) {
    return e === "lr" || e === "rl" ? "x" : "y";
  }
  function I(e, r) {
    let d = Number.POSITIVE_INFINITY, g = -1;
    for (let k = 0; k < e.length; k++) {
      const C = r(e[k]);
      C < d && (d = C, g = k);
    }
    return e[g];
  }
  const w = {
    lr: [1, 0],
    rl: [-1, 0],
    tb: [0, 1],
    bt: [0, -1]
  };
  function _(e, r) {
    const d = w[e.inline], g = w[e.block], k = w[r.inline], C = w[r.block], S = [f.dotMup(k, d), f.dotMup(k, g)], T = [f.dotMup(C, d), f.dotMup(C, g)];
    return (z) => [f.dotMup(z, S), f.dotMup(z, T)];
  }
  function M(e, r) {
    const d = _(e, r);
    return {
      b: (g) => {
        for (const k of g) {
          const [C, S] = d(k);
          k[0] = C, k[1] = S;
        }
      },
      p: d
    };
  }
  function N(e) {
    return (r) => {
      const d = [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0]
      ];
      for (let g = 0; g < e.length; g++)
        d[g] = r[e[g]];
      return d;
    };
  }
  function D(e, r) {
    return Math.sqrt((e[0] - r[0]) ** 2 + (e[1] - r[1]) ** 2);
  }
  function B(e) {
    const r = e.flatMap((P) => P.map((v) => v)), d = Math.min(...r.map((P) => f.dotMup(P, c.inline))), g = Math.max(...r.map((P) => f.dotMup(P, c.inline))), k = Math.min(...r.map((P) => f.dotMup(P, c.block))), C = Math.max(...r.map((P) => f.dotMup(P, c.block))), S = f.add(f.numMup(c.inline, d), f.numMup(c.block, k)), T = f.numMup(c.inline, g - d), z = f.numMup(c.block, C - k);
    return [S, f.add(S, T), f.add(f.add(S, T), z), f.add(S, z)];
  }
  function E(e) {
    let r = null, d = Number.POSITIVE_INFINITY;
    for (const z in W) {
      const P = W[z].src.at(-1);
      if (!P) continue;
      const v = D(e.box[0], P.box[0]);
      v < d && (r = Number(z), d = v);
    }
    if (r === null) {
      W.push({ src: [e] });
      return;
    }
    const g = W[r].src.at(-1), k = a.inlineSize(e.box), C = a.inlineSize(g.box), S = Math.min(k, C), T = a.blockSize(e.box);
    if (
      // 左右至少有一边是相近的，中心距离要相近
      // 行之间也不要离太远
      !((a.inlineStartDis(e.box, g.box) < 3 * T || a.inlineEndDis(e.box, g.box) < 3 * T || h.disByV(a.center(e.box), a.center(g.box), "inline") < S * 0.4) && a.blockGap(e.box, g.box) < T * 1.1)
    ) {
      W.push({ src: [e] });
      return;
    }
    W[r].src.push(e);
  }
  function U(e) {
    var k, C;
    const r = new RegExp("\\p{Ideographic}", "u"), d = /[。，！？；：“”‘’《》、【】（）…—]/, g = {
      box: B(e.map((S) => S.box)),
      text: "",
      mean: Wt(e.map((S) => [S.mean, S.text.length])),
      style: e[0].style
    };
    for (const S of e) {
      const T = g.text.at(-1);
      T && (!T.match(r) && !T.match(d) || !((k = S.text.at(0)) != null && k.match(r)) && !((C = S.text.at(0)) != null && C.match(d))) && (g.text += " "), g.text += S.text;
    }
    return g;
  }
  function V(e) {
    e.sort((r, d) => {
      const g = r.src.at(0) ? a.blockSize(r.src.at(0).box) : 2;
      return h.disByV(a.blockStart(r.outerBox), a.blockStart(d.outerBox), "block") < g ? h.compare(a.inlineStart(r.outerBox), a.inlineStart(d.outerBox), "inline") : h.compare(a.blockStart(r.outerBox), a.blockStart(d.outerBox), "block");
    });
  }
  if (n != null && n.columnsTip)
    for (const e of n.columnsTip) i.push(structuredClone(e));
  const A = {
    inline: 0,
    block: 90
  }, st = t.map((e) => {
    const r = e.box, d = r[1][0] - r[0][0], g = r[3][1] - r[0][1];
    let k = { x: 0, y: 0 };
    if (d < g) {
      const S = f.fromPonts(h.center(r[2], r[3]), h.center(r[0], r[1]));
      k = { x: S[0], y: S[1] };
    } else {
      const S = f.fromPonts(h.center(r[1], r[2]), h.center(r[0], r[3]));
      k = { x: S[0], y: S[1] };
    }
    return mt(Math.atan2(k.y, k.x) * (180 / Math.PI));
  }), H = b(st), Q = st.filter((e) => y(e, H.av)), ut = p(Q), Tt = p(Q.map((e) => Math.abs(e - ut))), Z = Q.filter((e) => Math.abs((e - ut) / (Tt * 1.4826)) < 2), F = mt(b(Z).av);
  O("dir0", st, H, Q, Z, F);
  const j = mt(F + 90), yt = y(F, 0) ? "x" : "y", R = y(j, 90) ? "y" : "x", pt = o.find((e) => yt === m(e.inline) && R === m(e.block)) ?? o.at(0);
  pt && (s.block = pt.block, s.inline = pt.inline);
  const Pt = {
    lr: 0,
    rl: 180,
    tb: 90,
    bt: 270
  };
  A.inline = I(
    [F, F - 360, F - 180, F + 180],
    (e) => Math.abs(e - Pt[s.inline])
  ), A.block = I(
    [j, j - 360, j - 180, j + 180],
    (e) => Math.abs(e - Pt[s.block])
  ), l.inline = [Math.cos(A.inline * (Math.PI / 180)), Math.sin(A.inline * (Math.PI / 180))], l.block = [Math.cos(A.block * (Math.PI / 180)), Math.sin(A.block * (Math.PI / 180))], O("dir", s, A, l, F, j);
  const Et = [
    [s.inline[0], s.block[0]],
    [s.inline[1], s.block[0]],
    [s.inline[1], s.block[1]],
    [s.inline[0], s.block[1]]
  ].map(
    ([e, r]) => ({
      lt: 0,
      rt: 1,
      rb: 2,
      lb: 3
    })[e === "l" || e === "r" ? e + r : r + e]
  ), ht = M({ inline: "lr", block: "tb" }, s), zt = N(Et), $t = t.map((e) => {
    const r = zt(e.box);
    return ht.b(r), {
      ...e,
      box: r
    };
  });
  for (const e of i)
    e.box = zt(e.box), ht.b(e.box);
  c.inline = ht.p(l.inline), c.block = ht.p(l.block), O("相对坐标系", c);
  const Kt = $t.sort((e, r) => h.compare(a.blockStart(e.box), a.blockStart(r.box), "block")), J = [];
  for (const e of Kt) {
    const r = x(e.box), d = (Rt = J.at(-1)) == null ? void 0 : Rt.line.at(-1);
    if (!d) {
      J.push({ line: [{ src: e, colId: r }] });
      continue;
    }
    const g = a.center(e.box), k = a.center(d.src.box);
    if (h.disByV(g, k, "block") < 0.5 * a.blockSize(e.box)) {
      const C = J.at(-1);
      C ? C.line.push({ src: e, colId: r }) : J.push({ line: [{ src: e, colId: r }] });
    } else
      J.push({ line: [{ src: e, colId: r }] });
  }
  const ft = [];
  for (const e of J) {
    if (e.line.length === 1) {
      ft.push({ src: e.line[0].src, colId: e.line[0].colId });
      continue;
    }
    const r = St(e.line.map((g) => a.blockSize(g.src.box)));
    e.line.sort((g, k) => h.compare(a.inlineStart(g.src.box), a.inlineStart(k.src.box), "inline"));
    let d = e.line.at(0);
    for (const g of e.line.slice(1)) {
      const k = a.inlineEnd(d.src.box), C = a.inlineStart(g.src.box);
      i[g.colId].type === "table" || g.colId !== d.colId || h.toInline(C) - h.toInline(k) > r ? (ft.push({ ...d }), d = g) : (d.src.text += g.src.text, d.src.mean = (d.src.mean + g.src.mean) / 2, d.src.box = B([d.src.box, g.src.box]));
    }
    ft.push({ ...d });
  }
  const W = [], It = [], ct = [];
  for (const e of ft)
    if (e.colId === u)
      It.push(e);
    else {
      const r = ct.find((d) => d.colId === e.colId);
      r ? r.src.push(e.src) : ct.push({ src: [e.src], type: i[e.colId].type, colId: e.colId });
    }
  It.sort((e, r) => h.compare(a.blockStart(e.src.box), a.blockStart(r.src.box), "block"));
  for (const e of It)
    E(e.src);
  const rt = [];
  for (const [e, r] of W.entries()) {
    const d = r.src, g = B(d.map((T) => T.box)), k = a.blockCenter(g), C = a.inlineSize(g);
    if (e === 0) {
      rt.push({ smallCol: [{ src: d, outerBox: g, x: k, w: C }] });
      continue;
    }
    const S = rt.find((T) => {
      const z = T.smallCol.at(-1), P = a.blockSize(d.at(0).box);
      return a.inlineStartDis(z.outerBox, g) < 3 * P && a.inlineEndDis(z.outerBox, g) < 3 * P && a.blockGap(g, z.outerBox) < P * 2.1;
    });
    S ? S.smallCol.push({ src: d, outerBox: g, x: k, w: C }) : rt.push({ smallCol: [{ src: d, outerBox: g, x: k, w: C }] });
  }
  for (const e of rt)
    e.smallCol.sort((r, d) => h.compare(a.blockStart(r.outerBox), a.blockStart(d.outerBox), "block"));
  for (const e of ct)
    e.src.sort((r, d) => h.compare(a.blockStart(r.box), a.blockStart(d.box), "block"));
  const wt = [];
  for (const e of rt) {
    const r = B(e.smallCol.map((g) => g.outerBox)), d = e.smallCol.flatMap((g) => g.src);
    wt.push({ src: d, outerBox: r, type: "none" });
  }
  V(wt);
  const it = [];
  for (const e of wt) {
    const r = it.at(-1);
    if (!r) {
      it.push(e);
      continue;
    }
    if (r.type !== "none") {
      it.push(e);
      continue;
    }
    const d = r.outerBox, g = a.blockSize(e.src[0].box);
    r.src.length === 1 && a.inlineStartDis(d, e.outerBox) < 3 * g || // 标题
    e.src.length === 1 && a.inlineStartDis(d, e.outerBox) < 3 * g || // 末尾
    a.inlineStartDis(d, e.outerBox) < 3 * g && a.inlineEndDis(d, e.outerBox) < 3 * g ? (r.src.push(...e.src), r.outerBox = B(r.src.map((k) => k.box))) : it.push(e);
  }
  let Mt = !1;
  const X = [];
  for (const e of it) {
    const r = X.at(-1), d = { ...e, reCal: !1 };
    if (!r) {
      X.push(d);
      continue;
    }
    const g = a.blockSize(d.src.at(0).box);
    h.compare(a.blockEnd(d.outerBox), a.blockEnd(r.outerBox), "block") < 0 && (a.inlineStartDis(r.outerBox, d.outerBox) < 3 * g || a.inlineEndDis(r.outerBox, d.outerBox) < 3 * g) ? (r.src.push(...d.src), r.reCal = !0, Mt = !0) : X.push(d);
  }
  for (const e of X)
    e.reCal && (e.src.sort((r, d) => h.compare(a.blockStart(r.box), a.blockStart(d.box), "block")), e.outerBox = B(e.src.map((r) => r.box)));
  ct.length && (Mt = !0);
  for (const e of ct) {
    const r = B(e.src.map((g) => g.box)), d = e.src;
    X.push({ src: d, outerBox: r, type: e.type, reCal: !1 });
  }
  Mt && V(X);
  const At = M(s, { inline: "lr", block: "tb" }), Ot = X.map((e) => {
    const r = e.src, d = [];
    if (e.type === "auto" || e.type === "none") {
      const C = {};
      for (let v = 1; v < r.length; v++) {
        const L = r[v - 1].box, nt = r[v].box, et = h.disByV(a.center(nt), a.center(L), "block");
        C[et] || (C[et] = 0), C[et]++;
      }
      const S = St(r.map((v) => a.blockSize(v.box))), T = [[]];
      for (const v of Object.keys(C).map((L) => Number(L)).sort()) {
        const L = T.at(-1), nt = L.at(-1);
        nt !== void 0 ? Math.abs(nt - v) < S * 0.5 ? L.push(v) : T.push([]) : L.push(v);
      }
      const z = T.map((v) => St(v)).sort((v, L) => v - L).at(0) || 0;
      O("d", C, T, z), d.push([r[0]]);
      let P = r[0];
      for (let v = 1; v < r.length; v++) {
        const L = f.add(
          f.add(a.inlineStartCenter(P.box), f.numMup(c.block, z)),
          f.numMup(c.inline, -a.inlineStartDis(P.box, e.outerBox))
        ), nt = a.inlineStartCenter(r[v].box), et = a.blockSize(r[v].box);
        if (a.inlineEndDis(P.box, e.outerBox) > 2 * et || D(L, nt) > et * 0.5)
          d.push([r[v]]);
        else {
          const Lt = d.at(-1);
          Lt ? Lt.push(r[v]) : d.push([r[v]]);
        }
        P = r[v];
      }
    } else (e.type === "table" || e.type === "raw" || e.type === "raw-blank") && d.push(r);
    for (const C of r) At.b(C.box);
    At.b(e.outerBox);
    const g = [];
    for (const [C, S] of Et.entries())
      g[S] = C;
    const k = N(g);
    for (const C of r)
      C.box = k(C.box);
    return e.outerBox = k(e.outerBox), O(d), {
      src: r,
      outerBox: e.outerBox,
      parragraphs: d.map((C) => ({ src: C, parse: U(C) }))
    };
  }), Ut = Ot.flatMap((e) => e.parragraphs.map((r) => r.parse));
  let tt = 0;
  return s.inline === "lr" && (tt = A.inline), s.inline === "rl" && (tt = A.inline - 180), s.block === "lr" && (tt = A.block), s.block === "rl" && (tt = A.block - 180), O("angle", tt), {
    columns: Ot,
    parragraphs: Ut,
    readingDir: s,
    angle: { reading: A, angle: tt }
  };
}
function St(t) {
  return t.reduce((n, o) => n + o, 0) / t.length;
}
function Wt(t) {
  const n = t.map((s) => s[1]).reduce((s, l) => s + l, 0);
  let o = 0;
  for (const s of t)
    o += s[0] * s[1] / n;
  return o;
}
function mt(t) {
  return (t % 360 + 360) % 360;
}
function Xt(t, n) {
  const o = mt(n);
  if (o === 0) return t;
  if (![90, 180, 270].includes(o)) throw new Error("只支持90度的旋转");
  const s = new Uint8ClampedArray(t.height * t.width * 4);
  for (let i = 0; i < t.height; i++)
    for (let u = 0; u < t.width; u++) {
      const x = i * t.width + u, h = o === 90 ? u * t.height + (t.height - i - 1) : o === 180 ? t.width - u - 1 + (t.height - i - 1) * t.width : (t.width - u - 1) * t.height + i;
      s.set(t.data.slice(x * 4, x * 4 + 4), h * 4);
    }
  const l = o === 90 || o === 270 ? t.height : t.width, c = o === 90 || o === 270 ? t.width : t.height;
  return bt(s, l, c);
}
function Rn(t, n = "", o, s, l) {
  if (!Y) return;
  const i = document.querySelector(`#${s}`).getContext("2d");
  i.beginPath(), i.strokeStyle = o, i.moveTo(t[0][0], t[0][1]), i.lineTo(t[1][0], t[1][1]), i.lineTo(t[2][0], t[2][1]), i.lineTo(t[3][0], t[3][1]), i.lineTo(t[0][0], t[0][1]), i.stroke(), i.strokeStyle = "black", i.strokeText(n, t[0][0], t[0][1]);
}
export {
  On as analyzeLayout,
  jn as det,
  Fn as init,
  gn as initDet,
  mn as initDocDirCls,
  yn as initRec,
  Yt as loadImg,
  Yn as ocr,
  Gn as rec,
  Hn as recognize,
  Xt as rotateImg,
  dn as setOCREnv,
  bn as warpDet
};
