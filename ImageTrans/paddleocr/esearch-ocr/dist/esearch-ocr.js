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
  const r = U(t), u = lt(n, o).getContext("2d");
  return u.imageSmoothingEnabled = l !== !1, l && (u.imageSmoothingQuality = l), s === "fill" ? u.scale(Math.min(n / t.width, 1), Math.min(o / t.height, 1)) : u.scale(n / t.width, o / t.height), u.drawImage(r, 0, 0), u;
}
function U(t, n, o) {
  const s = lt(n || t.width, o || t.height);
  return s.getContext("2d").putImageData(t, 0, 0), s;
}
function vt(t, n, o) {
  const s = t.data, l = [], r = [], i = [];
  let u = 0, x = 0;
  for (let f = 0; f < s.length; f += 4)
    i[x] || (i[x] = []), r[x] || (r[x] = []), l[x] || (l[x] = []), l[x][u] = (s[f] / 255 - n[0]) / o[0], r[x][u] = (s[f + 1] / 255 - n[1]) / o[1], i[x][u] = (s[f + 2] / 255 - n[2]) / o[2], u++, u === t.width && (u = 0, x++);
  return [i, r, l];
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
    for (let r = 1; r < this.tl.length; r++) {
      const i = this.tl[r].n - this.tl[r - 1].n, u = this.tl[r - 1].t, x = s.find((f) => f.n === u);
      x ? (x.c++, x.d += i) : s.push({ d: i, n: u, c: 1 });
    }
    const l = [];
    for (const r of s) {
      const i = r.c > 1 ? `${r.n}x${r.c}` : r.n;
      l.push(`${i} ${r.d}`);
    }
    l.push(this.tl.at(-1).t), console.log(`${this.name} ${s.map((r) => r.d).reduce((r, i) => r + i, 0)}ms: `, l.join(" "));
  }
}
async function nn(t, n, o, s, l, r) {
  const { transposedData: i, image: u } = en(t, l, r), f = (await on(i, u, n, o))[0].data, a = f.reduce((g, b) => Math.max(g, b)), d = f.findIndex((g) => g === a);
  return s[d];
}
function en(t, n, o) {
  const s = _t(t, n, o);
  return { transposedData: vt(s, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]), image: s };
}
async function on(t, n, o, s) {
  const l = t.flat(Number.POSITIVE_INFINITY), r = Float32Array.from(l), i = new o.Tensor("float32", r, [1, 3, n.height, n.width]), u = {};
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
    const r = n[l], i = n[(l + 1) % n.length], u = { x: i.x - r.x, y: i.y - r.y }, x = Math.hypot(u.x, u.y), [f, a] = [u.x / x, u.y / x];
    let d = Number.POSITIVE_INFINITY, g = Number.NEGATIVE_INFINITY, b = Number.POSITIVE_INFINITY, I = Number.NEGATIVE_INFINITY;
    for (const p of n) {
      const w = (p.x - r.x) * f + (p.y - r.y) * a;
      d = Math.min(d, w), g = Math.max(g, w);
      const S = -(p.x - r.x) * a + (p.y - r.y) * f;
      b = Math.min(b, S), I = Math.max(I, S);
    }
    const y = (g - d) * (I - b);
    if (y < o) {
      o = y;
      const p = (d + g) / 2, w = (b + I) / 2;
      s.center = {
        x: r.x + f * p - a * w,
        y: r.y + a * p + f * w
      }, s.size = {
        width: g - d,
        height: I - b
      }, s.angle = Math.atan2(a, f) * (180 / Math.PI);
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
  const s = t.length, l = s > 0 ? t[0].length : 0, r = Array.from({ length: s }, () => new Array(l).fill(!1));
  for (let i = 0; i < s; i++)
    for (let u = 0; u < l; u++)
      if (t[i][u] !== 0 && !r[i][u] && qt(t, u, i)) {
        const x = an(t, r, u, i, o === "CHAIN_APPROX_SIMPLE");
        n.push(x);
      }
}
function qt(t, n, o) {
  return t[o][n] !== 0 && (o > 0 && t[o - 1][n] === 0 || o < t.length - 1 && t[o + 1][n] === 0 || n > 0 && t[o][n - 1] === 0 || n < t[0].length - 1 && t[o][n + 1] === 0);
}
function an(t, n, o, s, l) {
  const r = [];
  let i = { x: o, y: s }, u = { x: o - 1, y: s };
  const x = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Map();
  function a(y) {
    return y.x + y.y * t[0].length;
  }
  function d(y) {
    const p = Math.floor(y / t[0].length);
    return { x: y % t[0].length, y: p };
  }
  function g(y, p) {
    const w = a(y), S = a(p), M = Ct(p.x - y.x, p.y - y.y), v = Ct(y.x - p.x, y.y - p.y), D = x.get(w) ?? [], N = x.get(S) ?? [];
    x.set(w, [...D, M]), x.set(S, [...N, v]);
  }
  function b(y) {
    const p = a(i);
    u = i, i = { x: i.x + gt[y].dx, y: i.y + gt[y].dy }, g(u, i);
    const S = (f.get(p) ?? []).filter((M) => M !== y);
    S.length > 0 ? f.set(p, S) : f.delete(p);
  }
  x.set(a(i), [Ct(-1, 0)]);
  let I = 0;
  do {
    r.push(i), n[i.y][i.x] = !0;
    const y = ln(t, x, i);
    if (y.length === 0) {
      if (f.size === 0)
        break;
      const [p, w] = Array.from(f.entries()).at(0), S = w[0];
      i = d(p), b(S);
    }
    if (y.length >= 1) {
      const p = a(i);
      f.set(p, y);
      const w = y[0];
      b(w);
    }
    I++;
  } while (I < 1e9);
  return l ? un(r) : r;
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
  const l = n.get(s(o)) ?? [], r = [];
  for (const [i, { dx: u, dy: x }] of gt.entries()) {
    if (l.includes(i)) continue;
    const f = o.x + u, a = o.y + x;
    f >= 0 && f < t[0].length && a >= 0 && a < t.length && qt(t, f, a) && r.push(i);
  }
  return r;
}
function Ct(t, n) {
  const o = gt.findIndex(({ dx: s, dy: l }) => t === s && n === l);
  return o === -1 ? 0 : o;
}
function un(t) {
  if (t.length < 3) return [...t];
  const n = [t[0]];
  for (let o = 1; o < t.length - 1; o++) {
    const s = n[n.length - 1], l = t[o], r = t[o + 1];
    hn(s, l, r) || n.push(l);
  }
  return n.push(t[t.length - 1]), n;
}
function hn(t, n, o) {
  return (n.x - t.x) * (o.y - n.y) === (n.y - t.y) * (o.x - n.x);
}
const K = new Ht("t"), W = new Ht("af_det");
let Y = !1, Nt = !1, H = null;
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
function R(...t) {
  Nt && console.log(...t);
}
function fn(...t) {
  Nt && console.log(t.map((n) => `%c${n}`).join(""), ...t.map((n) => `color: ${n}`));
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
      verticalRotateRatio: t.verticalRotateRatio,
      on: async (s, l, r) => {
        t.onRec && t.onRec(s, {
          text: l.map((i) => i[0].t).join(""),
          mean: l.map((i) => i[0].mean).reduce((i, u) => i + u, 0) / l.length
        }), t.onProgress && t.onProgress("rec", r, s + 1);
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
  return H = o, o;
}
function dn(t) {
  Y = !!t.dev, Nt = Y || !!t.log, Y || (K.l = () => {
  }, W.l = () => {
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
function Bt() {
  try {
    lt(1, 1), bt(new Uint8ClampedArray(4), 1, 1);
  } catch (t) {
    throw console.log("nodejs need set canvas, please use setOCREnv to set canvas and imageData"), t;
  }
}
async function Yn(t) {
  if (!H) throw new Error("need init");
  return H.ocr(t);
}
async function jn(t) {
  if (!H) throw new Error("need init");
  return H.det(t);
}
async function Gn(t) {
  if (!H) throw new Error("need init");
  return H.rec(t);
}
async function Hn(t) {
  if (!H) throw new Error("need init");
  return H.recognize(t);
}
async function xn(t) {
  Bt();
  const n = {
    ort: t.ort,
    ortOption: t.ortOption
  }, o = t.docCls ? await mn({ ...t.docCls, ...n }) : void 0, s = await gn({ ...t.det, ...n }), l = await yn({ ...t.rec, ...n }), r = async (i) => {
    const u = await Yt(i);
    return l.rec(bn(u));
  };
  return {
    ocr: async (i) => {
      let u = await Yt(i), x = 0;
      o && (x = await o.docCls(u), R("dir", x), u = Xt(u, 360 - x));
      const f = await s.det(u), a = await l.rec(f), d = Rn(a, t.analyzeLayout);
      return R(a, d), K.l("end"), { src: a, ...d, docDir: x };
    },
    det: s.det,
    rec: l.rec,
    recRaw: l.rawRec,
    recognize: r
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
  Bt();
  let n = 1;
  const o = await Dt(t.ort, t.input, t.ortOption);
  t.ratio !== void 0 && (n = t.ratio);
  const s = t.det_db_thresh ?? 0.3, l = t.det_db_box_thresh ?? 0, r = t.det_db_unclip_ratio ?? 2, i = t.erode_size ?? 1, u = t.min_side ?? 3;
  async function x(f) {
    var S;
    const a = f;
    if (Y) {
      const M = U(a);
      at(M);
    }
    K.l("pre_det");
    const { data: d, width: g, height: b } = wn(a, n), { transposedData: I, image: y } = d;
    K.l("det");
    const p = await pn(I, y, o, t.ort);
    K.l("aft_det");
    const w = Mn(
      { data: p.data, width: p.dims[3], height: p.dims[2] },
      g,
      b,
      a,
      s,
      l,
      r,
      i,
      u
    );
    return (S = t == null ? void 0 : t.on) == null || S.call(t, w), w;
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
  var x;
  Bt();
  let n = 48;
  const o = await Dt(t.ort, t.input, t.ortOption), s = t.decodeDic.split(/\r\n|\r|\n/) || [];
  s.at(-1) === "" ? s[s.length - 1] = " " : s.push(" "), t.imgh && (n = t.imgh);
  const l = ((x = t.optimize) == null ? void 0 : x.space) === void 0 ? !0 : t.optimize.space, r = t.verticalRotateRatio ?? 1.5;
  async function i(f, a) {
    var y, p, w;
    const d = [];
    K.l("bf_rec");
    const g = zn(f, n, r), b = (a == null ? void 0 : a.topK) || ((y = t.multiChar) == null ? void 0 : y.topK) || 2, I = (a == null ? void 0 : a.threshold) || ((p = t.multiChar) == null ? void 0 : p.threshold) || 1e-5;
    for (const [S, M] of g.entries()) {
      const { b: v, imgH: D, imgW: N } = M, z = await In(v, D, N, o, t.ort), j = An(z, s, { topK: b, threshold: I })[0];
      d.push({
        text: j,
        box: f[S].box,
        style: f[S].style
      }), (w = t == null ? void 0 : t.on) == null || w.call(t, S, j, f.length);
    }
    return K.l("rec_end"), d;
  }
  async function u(f) {
    const a = [], d = await i(f, { topK: 2, threshold: 1e-5 });
    for (const g of d) {
      const b = g.text.map((p) => l && p[0].t === "" && p[1].t === " " && p[1].mean > 1e-3 ? p[1] : p[0]), I = b.map((p) => p.t).join("").trim(), y = b.map((p) => p.mean).reduce((p, w) => p + w, 0) / b.length;
      y < 0.5 || a.push({
        text: I,
        mean: y,
        box: g.box,
        style: g.style
      });
    }
    return a;
  }
  return { rec: u, rawRec: i };
}
async function pn(t, n, o, s) {
  const l = Float32Array.from(t.flat(3)), r = new s.Tensor("float32", l, [1, 3, n.height, n.width]), i = {};
  return i[o.inputNames[0]] = r, (await o.run(i))[o.outputNames[0]];
}
async function In(t, n, o, s, l) {
  const r = Float32Array.from(t.flat(3)), i = new l.Tensor("float32", r, [1, 3, n, o]), u = {};
  return u[s.inputNames[0]] = i, (await s.run(u))[s.outputNames[0]];
}
function wn(t, n) {
  const o = Math.max(Math.round(t.height * n / 32) * 32, 32), s = Math.max(Math.round(t.width * n / 32) * 32, 32);
  if (Y) {
    const i = U(t);
    at(i);
  }
  const l = _t(t, s, o, "fill"), r = vt(l, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]);
  if (R(l), Y) {
    const i = U(l);
    at(i);
  }
  return { data: { transposedData: r, image: l }, width: s, height: o };
}
function Mn(t, n, o, s, l = 0.3, r = 0.5, i = 2, u = 1, x = 3) {
  W.l("");
  const f = Math.min(s.width, n), a = Math.min(s.height, o), { data: d, width: g, height: b } = t, I = new Uint8Array(g * b);
  for (let M = 0; M < d.length; M++) {
    const v = d[M] > l ? 255 : 0;
    I[M] = v;
  }
  let y = I;
  for (let M = 0; M < u; M++) {
    const v = y;
    y = new Uint8Array(g * b);
    for (let D = 0; D < b; D++)
      for (let N = 0; N < g; N++) {
        const z = D * g + N;
        if (v[z] === 0) {
          y[z] = 0;
          continue;
        }
        D > 0 && v[z - g] === 0 || D < b - 1 && v[z + g] === 0 ? y[z] = 0 : y[z] = 255;
      }
  }
  if (Y) {
    const M = new Uint8ClampedArray(g * b * 4);
    for (let N = 0; N < y.length; N++) {
      const z = N * 4, j = y[N];
      M[z] = M[z + 1] = M[z + 2] = j, M[z + 3] = 255;
    }
    const v = bt(M, g, b), D = U(v);
    at(D, "det_ru");
  }
  W.l("edge");
  const p = [], w = [];
  for (let M = 0; M < b; M++)
    w.push(Array.from(y.slice(M * g, M * g + g)));
  const S = [];
  if (rn(w, S), Y) {
    const M = document.querySelector("#det_ru").getContext("2d");
    for (const v of S) {
      M.moveTo(v[0].x, v[0].y);
      for (const D of v)
        M.lineTo(D.x, D.y);
      M.strokeStyle = "red", M.closePath(), M.stroke();
    }
  }
  for (let M = 0; M < S.length; M++) {
    W.l("get_box");
    const v = x, D = S[M], { points: N, sside: z } = Nn(D);
    if (z < v) continue;
    const j = Sn(N, i), V = j.points;
    if (j.sside < v + 2)
      continue;
    const A = s.width / f, st = s.height / a;
    for (let O = 0; O < V.length; O++)
      V[O][0] *= A, V[O][1] *= st;
    W.l("order");
    const q = Bn(V);
    for (const O of q)
      O[0] = ot(Math.round(O[0]), 0, s.width), O[1] = ot(Math.round(O[1]), 0, s.height);
    const Q = Vt(jt(q[0], q[1])), ut = Vt(jt(q[0], q[3]));
    if (Q <= 3 || ut <= 3 || _n(
      d,
      g,
      b,
      N,
      i
    ) < r) continue;
    On(V, "", "red", "det_ru"), W.l("crop");
    const Z = Dn(s, V);
    W.l("match best");
    const { bg: F, text: G } = Tn(Z), yt = En(V, Z, G);
    p.push({ box: yt, img: Z, style: { bg: F, text: G } });
  }
  return W.l("e"), R(p), p;
}
function kn(t) {
  let n = -1;
  const o = t.length;
  let s, l = t[o - 1], r = 0;
  for (; ++n < o; )
    s = l, l = t[n], r += s[1] * l[0] - s[0] * l[1];
  return r / 2;
}
function Cn(t) {
  let n = -1;
  const o = t.length;
  let s = t[o - 1], l, r, i = s[0], u = s[1], x = 0;
  for (; ++n < o; )
    l = i, r = u, s = t[n], i = s[0], u = s[1], l -= i, r -= u, x += Math.hypot(l, r);
  return x;
}
function Sn(t, n = 2) {
  const o = Math.abs(kn(t)), s = Cn(t), l = o * n / s, r = [];
  for (const [f, a] of t.entries()) {
    const d = t.at((f - 1) % 4), g = t.at((f + 1) % 4), b = a[0] - d[0], I = a[1] - d[1], y = Math.sqrt(b ** 2 + I ** 2), p = b / y * l, w = I / y * l, S = a[0] - g[0], M = a[1] - g[1], v = Math.sqrt(S ** 2 + M ** 2), D = S / v * l, N = M / v * l;
    r.push([a[0] + p + D, a[1] + w + N]);
  }
  const i = [r[0][0] - r[1][0], r[0][1] - r[1][1]], u = [r[2][0] - r[1][0], r[2][1] - r[1][1]], x = i[0] * u[1] - i[1] * u[0];
  return { points: r, sside: Math.abs(x) };
}
function _n(t, n, o, s, l) {
  let r = 1 / 0, i = -1 / 0, u = 1 / 0, x = -1 / 0;
  for (const w of s)
    r = Math.min(r, w[0]), i = Math.max(i, w[0]), u = Math.min(u, w[1]), x = Math.max(x, w[1]);
  const f = (i - r) * (l - 1) * 0.5, a = (x - u) * (l - 1) * 0.5, d = Math.max(0, Math.floor(r - f)), g = Math.min(n - 1, Math.ceil(i + f)), b = Math.max(0, Math.floor(u - a)), I = Math.min(o - 1, Math.ceil(x + a));
  let y = 0;
  const p = (g - d + 1) * (I - b + 1);
  for (let w = b; w <= I; w++)
    for (let S = d; S <= g; S++)
      y += t[w * n + S];
  return p > 0 ? y / p : 0;
}
function vn(t, n, o) {
  const s = n.width, l = n.height, r = o * Math.PI / 180, i = Math.cos(r), u = Math.sin(r), x = t.x, f = t.y, a = s * 0.5, d = l * 0.5, g = [], b = x - a * i + d * u, I = f - a * u - d * i;
  g.push([b, I]);
  const y = x + a * i + d * u, p = f + a * u - d * i;
  g.push([y, p]);
  const w = x + a * i - d * u, S = f + a * u + d * i;
  g.push([w, S]);
  const M = x - a * i - d * u, v = f - a * u + d * i;
  return g.push([M, v]), g;
}
function Nn(t) {
  const o = sn(t), s = Array.from(vn(o.center, o.size, o.angle)).sort(
    (a, d) => a[0] - d[0]
  );
  let l = 0, r = 1, i = 2, u = 3;
  s[1][1] > s[0][1] ? (l = 0, u = 1) : (l = 1, u = 0), s[3][1] > s[2][1] ? (r = 2, i = 3) : (r = 3, i = 2);
  const x = [s[l], s[r], s[i], s[u]], f = Math.min(o.size.height, o.size.width);
  return { points: x, sside: f };
}
function jt(t, n) {
  return Math.sqrt((t[0] - n[0]) ** 2 + (t[1] - n[1]) ** 2);
}
function Bn(t) {
  const n = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0]
  ], o = t.map((r) => r[0] + r[1]);
  n[0] = t[o.indexOf(Math.min(...o))], n[2] = t[o.indexOf(Math.max(...o))];
  const s = t.filter((r) => r !== n[0] && r !== n[2]), l = s[1].map((r, i) => r - s[0][i]);
  return n[1] = s[l.indexOf(Math.min(...l))], n[3] = s[l.indexOf(Math.max(...l))], n;
}
function Dn(t, n) {
  const [o, s, l, r] = n.map((N) => ({ x: N[0], y: N[1] })), i = Math.sqrt((s.x - o.x) ** 2 + (s.y - o.y) ** 2), u = Math.sqrt((r.x - o.x) ** 2 + (r.y - o.y) ** 2), x = s.x - o.x, f = s.y - o.y, a = r.x - o.x, d = r.y - o.y, g = x * d - a * f;
  if (g === 0) throw new Error("点共线，无法形成矩形");
  const b = i * d / g, I = -a * i / g, y = -u * f / g, p = x * u / g, w = -b * o.x - I * o.y, S = -y * o.x - p * o.y, M = U(t), v = lt(Math.ceil(i), Math.ceil(u)), D = v.getContext("2d");
  return D.setTransform(b, y, I, p, w, S), D.drawImage(M, 0, 0), D.resetTransform(), D.getImageData(0, 0, v.width, v.height);
}
function Tn(t) {
  var x, f;
  const n = /* @__PURE__ */ new Map(), o = t.data;
  for (let a = 0; a < o.length; a += 4) {
    if (a / 4 % t.width > t.height * 4) continue;
    const g = o[a], b = o[a + 1], I = o[a + 2], y = [g, b, I].join(",");
    n.set(y, (n.get(y) || 0) + 1);
  }
  const s = Pn(n, 20).map((a) => ({
    el: a.el.split(",").map(Number),
    count: a.count
  })), l = ((x = s.at(0)) == null ? void 0 : x.el) || [255, 255, 255], r = ((f = s.at(1)) == null ? void 0 : f.el) || [0, 0, 0];
  let i = r;
  const u = 100;
  if (xt(r, l) < u) {
    const a = s.slice(1).filter((d) => xt(d.el, l) > 50);
    a.length > 0 && (i = [0, 1, 2].map(
      (d) => Math.round(Wt(a.map((g) => [g.el[d], g.count])))
    )), (a.length === 0 || xt(i, l) < u) && (i = l.map((d) => 255 - d)), fn(`rgb(${i.join(",")})`);
  }
  return {
    bg: l,
    text: i,
    textEdge: r
  };
}
function xt(t, n) {
  const o = t, s = n;
  return Math.sqrt((o[0] - s[0]) ** 2 + (o[1] - s[1]) ** 2 + (o[2] - s[2]) ** 2);
}
function Pn(t, n = 1) {
  let o = [];
  return t.forEach((s, l) => {
    o.length === 0 ? o.push({ el: l, count: s }) : (o.length < n ? o.push({ el: l, count: s }) : o.find((r) => r.count <= s) && o.push({ el: l, count: s }), o.sort((r, i) => i.count - r.count), o.length > n && (o = o.slice(0, n)));
  }), o;
}
function En(t, n, o) {
  let s = 0, l = n.height, r = 0, i = n.width;
  function u(b) {
    return xt(b, o) < 200;
  }
  t: for (let b = s; b < n.height; b++)
    for (let I = 0; I < n.width; I++) {
      const y = dt(n, I, b);
      if (u(y)) {
        s = b;
        break t;
      }
    }
  t: for (let b = l - 1; b >= 0; b--)
    for (let I = 0; I < n.width; I++) {
      const y = dt(n, I, b);
      if (u(y)) {
        l = b;
        break t;
      }
    }
  t: for (let b = r; b < n.width; b++)
    for (let I = s; I <= l; I++) {
      const y = dt(n, b, I);
      if (u(y)) {
        r = b;
        break t;
      }
    }
  t: for (let b = i - 1; b >= 0; b--)
    for (let I = s; I <= l; I++) {
      const y = dt(n, b, I);
      if (u(y)) {
        i = b;
        break t;
      }
    }
  const x = ot(s - 1, 0, 4), f = ot(n.height - l - 1, 0, 4), a = ot(r - 1, 0, 4), d = ot(n.width - i - 1, 0, 4);
  return [
    [t[0][0] + a, t[0][1] + x],
    [t[1][0] - d, t[1][1] + x],
    [t[2][0] - d, t[2][1] - f],
    [t[3][0] + a, t[3][1] - f]
  ];
}
function dt(t, n, o) {
  const s = (o * t.width + n) * 4;
  return Array.from(t.data.slice(s, s + 4));
}
function zn(t, n, o = 1.5) {
  const s = [];
  function l(r) {
    const i = Math.floor(n * (r.width / r.height)), u = _t(r, i, n, void 0, !1);
    return Y && at(U(u, i, n)), { data: u, w: i, h: n };
  }
  for (const r of t) {
    let i = r.img;
    i.height > i.width * o && (i = Xt(i, -90));
    const u = l(i);
    s.push({ b: vt(u.data, [0.5, 0.5, 0.5], [0.5, 0.5, 0.5]), imgH: u.h, imgW: u.w });
  }
  return R(s), s;
}
function An(t, n, o) {
  const s = t.dims[2], l = [];
  let r = t.dims[0] - 1;
  const i = o.topK, u = o.threshold;
  function x(a) {
    return n.at(a - 1) ?? "";
  }
  for (let a = 0; a < t.data.length; a += s * t.dims[1]) {
    const d = [];
    for (let g = a; g < a + s * t.dims[1]; g += s) {
      const b = t.data.slice(g, g + s), I = [];
      for (let y = 0; y < b.length; y++) {
        const p = b[y];
        if (!(p < u)) {
          if (!(I.length === i && p <= I.at(-1).v)) {
            const w = I.findIndex((S) => S.v > p);
            w === -1 ? I.unshift({ t: y, v: p }) : I.splice(w + 1, 0, { t: y, v: p });
          }
          I.length > i && I.pop();
        }
      }
      d.push(I);
    }
    l[r] = f(d), r--;
  }
  function f(a) {
    const d = [];
    for (let g = 0; g < a.length; g++)
      a[g][0].t !== 0 && (g > 0 && a[g - 1][0].t === a[g][0].t || d.push(a[g].map((b) => ({ t: x(b.t), mean: b.v }))));
    return d;
  }
  return l;
}
function Rn(t, n) {
  var Ot;
  R(t);
  const o = (n == null ? void 0 : n.docDirs) ?? [
    { block: "tb", inline: "lr" },
    { block: "rl", inline: "tb" }
  ], s = { block: "tb", inline: "lr" }, l = {
    inline: [1, 0],
    block: [0, 1]
  }, r = {
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
    const c = a.center(e);
    for (let h = i.length - 1; h >= 0; h--) {
      const k = i[h].box;
      if (c[0] >= k[0][0] && c[0] <= k[1][0] && c[1] >= k[0][1] && c[1] <= k[3][1])
        return h;
    }
    return u;
  }
  const f = {
    center: (e, c) => [(e[0] + c[0]) / 2, (e[1] + c[1]) / 2],
    disByV: (e, c, h) => Math.abs(h === "block" ? d.dotMup(e, r.block) - d.dotMup(c, r.block) : d.dotMup(e, r.inline) - d.dotMup(c, r.inline)),
    compare: (e, c, h) => h === "block" ? d.dotMup(e, r.block) - d.dotMup(c, r.block) : d.dotMup(e, r.inline) - d.dotMup(c, r.inline),
    toInline: (e) => d.dotMup(e, r.inline),
    toBlock: (e) => d.dotMup(e, r.block)
  }, a = {
    inlineStart: (e) => f.center(e[0], e[3]),
    inlineEnd: (e) => f.center(e[1], e[2]),
    blockStart: (e) => f.center(e[0], e[1]),
    blockEnd: (e) => f.center(e[2], e[3]),
    inlineSize: (e) => e[1][0] - e[0][0],
    blockSize: (e) => e[3][1] - e[0][1],
    inlineStartDis: (e, c) => f.disByV(e[0], c[0], "inline"),
    inlineEndDis: (e, c) => f.disByV(e[1], c[1], "inline"),
    blockGap: (e, c) => f.disByV(e[0], c[3], "block"),
    inlineCenter: (e) => (e[2][0] + e[0][0]) / 2,
    blockCenter: (e) => (e[2][1] + e[0][1]) / 2,
    inlineStartCenter: (e) => a.inlineStart(e),
    center: (e) => f.center(e[0], e[2])
  }, d = {
    fromPonts: (e, c) => [e[0] - c[0], e[1] - c[1]],
    dotMup: (e, c) => e[0] * c[0] + e[1] * c[1],
    numMup: (e, c) => [e[0] * c, e[1] * c],
    add: (e, c) => [e[0] + c[0], e[1] + c[1]]
  };
  function g(e) {
    let c = 0, h = 0;
    const m = [];
    for (const [k, C] of e.entries()) {
      const _ = C > 180 ? C - 180 : C, T = _ - 180, E = k === 0 ? _ : Math.abs(T - c) < Math.abs(_ - c) ? T : _;
      m.push(E), c = (c * h + E) / (h + 1), h++;
    }
    return { av: c, l: m };
  }
  function b(e, c) {
    return Math.abs(e - c) < 45 || Math.abs(e - (c - 180)) < 45 || Math.abs(e - 180 - c) < 45;
  }
  function I(e) {
    e.sort((h, m) => h - m);
    const c = Math.floor(e.length / 2);
    return e.length % 2 === 0 ? (e[c - 1] + e[c]) / 2 : e[c];
  }
  function y(e) {
    return e === "lr" || e === "rl" ? "x" : "y";
  }
  function p(e, c) {
    let h = Number.POSITIVE_INFINITY, m = -1;
    for (let k = 0; k < e.length; k++) {
      const C = c(e[k]);
      C < h && (h = C, m = k);
    }
    return e[m];
  }
  const w = {
    lr: [1, 0],
    rl: [-1, 0],
    tb: [0, 1],
    bt: [0, -1]
  };
  function S(e, c) {
    const h = w[e.inline], m = w[e.block], k = w[c.inline], C = w[c.block], _ = [d.dotMup(k, h), d.dotMup(k, m)], T = [d.dotMup(C, h), d.dotMup(C, m)];
    return (E) => [d.dotMup(E, _), d.dotMup(E, T)];
  }
  function M(e, c) {
    const h = S(e, c);
    return {
      b: (m) => {
        for (const k of m) {
          const [C, _] = h(k);
          k[0] = C, k[1] = _;
        }
      },
      p: h
    };
  }
  function v(e) {
    return (c) => {
      const h = [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0]
      ];
      for (let m = 0; m < e.length; m++)
        h[m] = c[e[m]];
      return h;
    };
  }
  function D(e, c) {
    return Math.sqrt((e[0] - c[0]) ** 2 + (e[1] - c[1]) ** 2);
  }
  function N(e) {
    const c = e.flatMap((P) => P.map((B) => B)), h = Math.min(...c.map((P) => d.dotMup(P, r.inline))), m = Math.max(...c.map((P) => d.dotMup(P, r.inline))), k = Math.min(...c.map((P) => d.dotMup(P, r.block))), C = Math.max(...c.map((P) => d.dotMup(P, r.block))), _ = d.add(d.numMup(r.inline, h), d.numMup(r.block, k)), T = d.numMup(r.inline, m - h), E = d.numMup(r.block, C - k);
    return [_, d.add(_, T), d.add(d.add(_, T), E), d.add(_, E)];
  }
  function z(e) {
    let c = null, h = Number.POSITIVE_INFINITY;
    for (const E in X) {
      const P = X[E].src.at(-1);
      if (!P) continue;
      const B = D(e.box[0], P.box[0]);
      B < h && (c = Number(E), h = B);
    }
    if (c === null) {
      X.push({ src: [e] });
      return;
    }
    const m = X[c].src.at(-1), k = a.inlineSize(e.box), C = a.inlineSize(m.box), _ = Math.min(k, C), T = a.blockSize(e.box);
    if (
      // 左右至少有一边是相近的，中心距离要相近
      // 行之间也不要离太远
      !((a.inlineStartDis(e.box, m.box) < 3 * T || a.inlineEndDis(e.box, m.box) < 3 * T || f.disByV(a.center(e.box), a.center(m.box), "inline") < _ * 0.4) && a.blockGap(e.box, m.box) < T * 1.1)
    ) {
      X.push({ src: [e] });
      return;
    }
    X[c].src.push(e);
  }
  function j(e) {
    var k, C;
    const c = new RegExp("\\p{Ideographic}", "u"), h = /[。，！？；：“”‘’《》、【】（）…—]/, m = {
      box: N(e.map((_) => _.box)),
      text: "",
      mean: Wt(e.map((_) => [_.mean, _.text.length])),
      style: e[0].style
    };
    for (const _ of e) {
      const T = m.text.at(-1);
      T && (!T.match(c) && !T.match(h) || !((k = _.text.at(0)) != null && k.match(c)) && !((C = _.text.at(0)) != null && C.match(h))) && (m.text += " "), m.text += _.text;
    }
    return m;
  }
  function V(e) {
    e.sort((c, h) => {
      const m = c.src.at(0) ? a.blockSize(c.src.at(0).box) : 2;
      return f.disByV(a.blockStart(c.outerBox), a.blockStart(h.outerBox), "block") < m ? f.compare(a.inlineStart(c.outerBox), a.inlineStart(h.outerBox), "inline") : f.compare(a.blockStart(c.outerBox), a.blockStart(h.outerBox), "block");
    });
  }
  if (n != null && n.columnsTip)
    for (const e of n.columnsTip) i.push(structuredClone(e));
  const A = {
    inline: 0,
    block: 90
  }, st = t.map((e) => {
    const c = e.box, h = c[1][0] - c[0][0], m = c[3][1] - c[0][1];
    let k = { x: 0, y: 0 };
    if (h < m) {
      const _ = d.fromPonts(f.center(c[2], c[3]), f.center(c[0], c[1]));
      k = { x: _[0], y: _[1] };
    } else {
      const _ = d.fromPonts(f.center(c[1], c[2]), f.center(c[0], c[3]));
      k = { x: _[0], y: _[1] };
    }
    return mt(Math.atan2(k.y, k.x) * (180 / Math.PI));
  }), q = g(st), Q = st.filter((e) => b(e, q.av)), ut = I(Q), Tt = I(Q.map((e) => Math.abs(e - ut))), Z = Q.filter((e) => Math.abs((e - ut) / (Tt * 1.4826)) < 2), F = mt(g(Z).av);
  R("dir0", st, q, Q, Z, F);
  const G = mt(F + 90), yt = b(F, 0) ? "x" : "y", O = b(G, 90) ? "y" : "x", pt = o.find((e) => yt === y(e.inline) && O === y(e.block)) ?? o.at(0);
  pt && (s.block = pt.block, s.inline = pt.inline);
  const Pt = {
    lr: 0,
    rl: 180,
    tb: 90,
    bt: 270
  };
  A.inline = p(
    [F, F - 360, F - 180, F + 180],
    (e) => Math.abs(e - Pt[s.inline])
  ), A.block = p(
    [G, G - 360, G - 180, G + 180],
    (e) => Math.abs(e - Pt[s.block])
  ), l.inline = [Math.cos(A.inline * (Math.PI / 180)), Math.sin(A.inline * (Math.PI / 180))], l.block = [Math.cos(A.block * (Math.PI / 180)), Math.sin(A.block * (Math.PI / 180))], R("dir", s, A, l, F, G);
  const Et = [
    [s.inline[0], s.block[0]],
    [s.inline[1], s.block[0]],
    [s.inline[1], s.block[1]],
    [s.inline[0], s.block[1]]
  ].map(
    ([e, c]) => ({
      lt: 0,
      rt: 1,
      rb: 2,
      lb: 3
    })[e === "l" || e === "r" ? e + c : c + e]
  ), ht = M({ inline: "lr", block: "tb" }, s), zt = v(Et), $t = t.map((e) => {
    const c = zt(e.box);
    return ht.b(c), {
      ...e,
      box: c
    };
  });
  for (const e of i)
    e.box = zt(e.box), ht.b(e.box);
  r.inline = ht.p(l.inline), r.block = ht.p(l.block), R("相对坐标系", r);
  const Kt = $t.sort((e, c) => f.compare(a.blockStart(e.box), a.blockStart(c.box), "block")), J = [];
  for (const e of Kt) {
    const c = x(e.box), h = (Ot = J.at(-1)) == null ? void 0 : Ot.line.at(-1);
    if (!h) {
      J.push({ line: [{ src: e, colId: c }] });
      continue;
    }
    const m = a.center(e.box), k = a.center(h.src.box);
    if (f.disByV(m, k, "block") < 0.5 * a.blockSize(e.box)) {
      const C = J.at(-1);
      C ? C.line.push({ src: e, colId: c }) : J.push({ line: [{ src: e, colId: c }] });
    } else
      J.push({ line: [{ src: e, colId: c }] });
  }
  const ft = [];
  for (const e of J) {
    if (e.line.length === 1) {
      ft.push({ src: e.line[0].src, colId: e.line[0].colId });
      continue;
    }
    const c = St(e.line.map((m) => a.blockSize(m.src.box)));
    e.line.sort((m, k) => f.compare(a.inlineStart(m.src.box), a.inlineStart(k.src.box), "inline"));
    let h = e.line.at(0);
    for (const m of e.line.slice(1)) {
      const k = a.inlineEnd(h.src.box), C = a.inlineStart(m.src.box);
      i[m.colId].type === "table" || m.colId !== h.colId || f.toInline(C) - f.toInline(k) > c ? (ft.push({ ...h }), h = m) : (h.src.text += m.src.text, h.src.mean = (h.src.mean + m.src.mean) / 2, h.src.box = N([h.src.box, m.src.box]));
    }
    ft.push({ ...h });
  }
  const X = [], It = [], ct = [];
  for (const e of ft)
    if (e.colId === u)
      It.push(e);
    else {
      const c = ct.find((h) => h.colId === e.colId);
      c ? c.src.push(e.src) : ct.push({ src: [e.src], type: i[e.colId].type, colId: e.colId });
    }
  It.sort((e, c) => f.compare(a.blockStart(e.src.box), a.blockStart(c.src.box), "block"));
  for (const e of It)
    z(e.src);
  const rt = [];
  for (const [e, c] of X.entries()) {
    const h = c.src, m = N(h.map((T) => T.box)), k = a.blockCenter(m), C = a.inlineSize(m);
    if (e === 0) {
      rt.push({ smallCol: [{ src: h, outerBox: m, x: k, w: C }] });
      continue;
    }
    const _ = rt.find((T) => {
      const E = T.smallCol.at(-1), P = a.blockSize(h.at(0).box);
      return a.inlineStartDis(E.outerBox, m) < 3 * P && a.inlineEndDis(E.outerBox, m) < 3 * P && a.blockGap(m, E.outerBox) < P * 2.1;
    });
    _ ? _.smallCol.push({ src: h, outerBox: m, x: k, w: C }) : rt.push({ smallCol: [{ src: h, outerBox: m, x: k, w: C }] });
  }
  for (const e of rt)
    e.smallCol.sort((c, h) => f.compare(a.blockStart(c.outerBox), a.blockStart(h.outerBox), "block"));
  for (const e of ct)
    e.src.sort((c, h) => f.compare(a.blockStart(c.box), a.blockStart(h.box), "block"));
  const wt = [];
  for (const e of rt) {
    const c = N(e.smallCol.map((m) => m.outerBox)), h = e.smallCol.flatMap((m) => m.src);
    wt.push({ src: h, outerBox: c, type: "none" });
  }
  V(wt);
  const it = [];
  for (const e of wt) {
    const c = it.at(-1);
    if (!c) {
      it.push(e);
      continue;
    }
    if (c.type !== "none") {
      it.push(e);
      continue;
    }
    const h = c.outerBox, m = a.blockSize(e.src[0].box);
    c.src.length === 1 && a.inlineStartDis(h, e.outerBox) < 3 * m || // 标题
    e.src.length === 1 && a.inlineStartDis(h, e.outerBox) < 3 * m || // 末尾
    a.inlineStartDis(h, e.outerBox) < 3 * m && a.inlineEndDis(h, e.outerBox) < 3 * m ? (c.src.push(...e.src), c.outerBox = N(c.src.map((k) => k.box))) : it.push(e);
  }
  let Mt = !1;
  const $ = [];
  for (const e of it) {
    const c = $.at(-1), h = { ...e, reCal: !1 };
    if (!c) {
      $.push(h);
      continue;
    }
    const m = a.blockSize(h.src.at(0).box);
    f.compare(a.blockEnd(h.outerBox), a.blockEnd(c.outerBox), "block") < 0 && (a.inlineStartDis(c.outerBox, h.outerBox) < 3 * m || a.inlineEndDis(c.outerBox, h.outerBox) < 3 * m) ? (c.src.push(...h.src), c.reCal = !0, Mt = !0) : $.push(h);
  }
  for (const e of $)
    e.reCal && (e.src.sort((c, h) => f.compare(a.blockStart(c.box), a.blockStart(h.box), "block")), e.outerBox = N(e.src.map((c) => c.box)));
  ct.length && (Mt = !0);
  for (const e of ct) {
    const c = N(e.src.map((m) => m.box)), h = e.src;
    $.push({ src: h, outerBox: c, type: e.type, reCal: !1 });
  }
  Mt && V($);
  const At = M(s, { inline: "lr", block: "tb" }), Rt = $.map((e) => {
    const c = e.src, h = [];
    if (e.type === "auto" || e.type === "none") {
      const C = {};
      for (let B = 1; B < c.length; B++) {
        const L = c[B - 1].box, nt = c[B].box, et = f.disByV(a.center(nt), a.center(L), "block");
        C[et] || (C[et] = 0), C[et]++;
      }
      const _ = St(c.map((B) => a.blockSize(B.box))), T = [[]];
      for (const B of Object.keys(C).map((L) => Number(L)).sort()) {
        const L = T.at(-1), nt = L.at(-1);
        nt !== void 0 ? Math.abs(nt - B) < _ * 0.5 ? L.push(B) : T.push([]) : L.push(B);
      }
      const E = T.map((B) => St(B)).sort((B, L) => B - L).at(0) || 0;
      R("d", C, T, E), h.push([c[0]]);
      let P = c[0];
      for (let B = 1; B < c.length; B++) {
        const L = d.add(
          d.add(a.inlineStartCenter(P.box), d.numMup(r.block, E)),
          d.numMup(r.inline, -a.inlineStartDis(P.box, e.outerBox))
        ), nt = a.inlineStartCenter(c[B].box), et = a.blockSize(c[B].box);
        if (a.inlineEndDis(P.box, e.outerBox) > 2 * et || D(L, nt) > et * 0.5)
          h.push([c[B]]);
        else {
          const Lt = h.at(-1);
          Lt ? Lt.push(c[B]) : h.push([c[B]]);
        }
        P = c[B];
      }
    } else (e.type === "table" || e.type === "raw" || e.type === "raw-blank") && h.push(c);
    for (const C of c) At.b(C.box);
    At.b(e.outerBox);
    const m = [];
    for (const [C, _] of Et.entries())
      m[_] = C;
    const k = v(m);
    for (const C of c)
      C.box = k(C.box);
    return e.outerBox = k(e.outerBox), R(h), {
      src: c,
      outerBox: e.outerBox,
      parragraphs: h.map((C) => ({ src: C, parse: j(C) }))
    };
  }), Ut = Rt.flatMap((e) => e.parragraphs.map((c) => c.parse));
  let tt = 0;
  return s.inline === "lr" && (tt = A.inline), s.inline === "rl" && (tt = A.inline - 180), s.block === "lr" && (tt = A.block), s.block === "rl" && (tt = A.block - 180), R("angle", tt), {
    columns: Rt,
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
      const x = i * t.width + u, f = o === 90 ? u * t.height + (t.height - i - 1) : o === 180 ? t.width - u - 1 + (t.height - i - 1) * t.width : (t.width - u - 1) * t.height + i;
      s.set(t.data.slice(x * 4, x * 4 + 4), f * 4);
    }
  const l = o === 90 || o === 270 ? t.height : t.width, r = o === 90 || o === 270 ? t.width : t.height;
  return bt(s, l, r);
}
function On(t, n = "", o, s, l) {
  if (!Y) return;
  const i = document.querySelector(`#${s}`).getContext("2d");
  i.beginPath(), i.strokeStyle = o, i.moveTo(t[0][0], t[0][1]), i.lineTo(t[1][0], t[1][1]), i.lineTo(t[2][0], t[2][1]), i.lineTo(t[3][0], t[3][1]), i.lineTo(t[0][0], t[0][1]), i.stroke(), i.strokeStyle = "black", i.strokeText(n, t[0][0], t[0][1]);
}
export {
  Rn as analyzeLayout,
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
