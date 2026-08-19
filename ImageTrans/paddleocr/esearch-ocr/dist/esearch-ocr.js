var Zt = Object.defineProperty;
var Jt = (t, n, e) => n in t ? Zt(t, n, { enumerable: !0, configurable: !0, writable: !0, value: e }) : t[n] = e;
var St = (t, n, e) => Jt(t, typeof n != "symbol" ? n + "" : n, e);
let $t = (t, n) => {
  if (typeof OffscreenCanvas < "u")
    return new OffscreenCanvas(t, n);
  const e = document.createElement("canvas");
  return e.width = t, e.height = n, e;
};
function mt(t, n) {
  return $t(t, n);
}
function tn(t) {
  $t = t;
}
function Ft(t) {
  return t > 0 ? Math.floor(t) : Math.ceil(t);
}
function X(t, n, e) {
  return Math.max(n, Math.min(t, e));
}
function Dt(t, n, e, o, i = "high") {
  return nn(t, n, e, o, i).getImageData(0, 0, n, e);
}
function nn(t, n, e, o, i = "high") {
  const c = nt(t), u = mt(n, e).getContext("2d");
  return u.imageSmoothingEnabled = i !== !1, i && (u.imageSmoothingQuality = i), u.scale(n / t.width, e / t.height), u.drawImage(c, 0, 0), u;
}
function nt(t, n, e) {
  const o = mt(n || t.width, e || t.height);
  return o.getContext("2d").putImageData(t, 0, 0), o;
}
function Bt(t, n, e) {
  const o = t.data, i = [], c = [], r = [];
  let u = 0, x = 0;
  for (let h = 0; h < o.length; h += 4)
    r[x] || (r[x] = []), c[x] || (c[x] = []), i[x] || (i[x] = []), r[x][u] = (o[h + 2] / 255 - n[0]) / e[0], c[x][u] = (o[h + 1] / 255 - n[1]) / e[1], i[x][u] = (o[h] / 255 - n[2]) / e[2], u++, u === t.width && (u = 0, x++);
  return [r, c, i];
}
function en(t, n) {
  const e = [], o = [];
  for (let c = 0; c < 4; c++) {
    const [r, u] = t[c], [x, h] = n[c];
    e.push([r, u, 1, 0, 0, 0, -x * r, -x * u]), o.push(x), e.push([0, 0, 0, r, u, 1, -h * r, -h * u]), o.push(h);
  }
  const i = e.map((c, r) => [...c, o[r]]);
  for (let c = 0; c < 8; c++) {
    let r = c;
    for (let u = c + 1; u < 8; u++)
      Math.abs(i[u][c]) > Math.abs(i[r][c]) && (r = u);
    if (Math.abs(i[r][c]) < 1e-12) return null;
    [i[c], i[r]] = [i[r], i[c]];
    for (let u = 0; u < 8; u++) {
      if (u === c) continue;
      const x = i[u][c] / i[c][c];
      for (let h = c; h <= 8; h++) i[u][h] -= x * i[c][h];
    }
  }
  return i.map((c, r) => c[8] / i[r][r]);
}
function on(t, n, e, o) {
  const i = en(
    [
      [0, 0],
      [n, 0],
      [n, e],
      [0, e]
    ],
    o
  );
  if (!i) return null;
  const [c, r, u, x, h, l, f, y] = i, m = t.width, p = t.height, b = t.data, w = new Uint8ClampedArray(n * e * 4);
  for (let k = 0; k < e; k++)
    for (let C = 0; C < n; C++) {
      const I = f * C + y * k + 1, v = (c * C + r * k + u) / I, B = (x * C + h * k + l) / I, N = Math.floor(v), P = Math.floor(B), O = v - N, V = B - P, z = X(N, 0, m - 1), U = X(P, 0, p - 1), j = X(N + 1, 0, m - 1), q = X(P + 1, 0, p - 1), et = (U * m + z) * 4, gt = (U * m + j) * 4, W = (q * m + z) * 4, L = (q * m + j) * 4, F = (k * n + C) * 4;
      for (let G = 0; G < 3; G++) {
        const R = b[et + G], at = b[gt + G], lt = b[W + G], At = b[L + G], ut = R + (at - R) * O, ot = lt + (At - lt) * O;
        w[F + G] = ut + (ot - ut) * V;
      }
      w[F + 3] = 255;
    }
  return { data: w, width: n, height: e };
}
class Xt {
  constructor(n) {
    St(this, "tl", []);
    St(this, "name");
    this.name = n;
  }
  l(n) {
    const e = performance.now();
    this.tl.push({ t: n, n: e });
    const o = [];
    for (let c = 1; c < this.tl.length; c++) {
      const r = this.tl[c].n - this.tl[c - 1].n, u = this.tl[c - 1].t, x = o.find((h) => h.n === u);
      x ? (x.c++, x.d += r) : o.push({ d: r, n: u, c: 1 });
    }
    const i = [];
    for (const c of o) {
      const r = c.c > 1 ? `${c.n}x${c.c}` : c.n;
      i.push(`${r} ${c.d}`);
    }
    i.push(this.tl.at(-1).t), console.log(`${this.name} ${o.map((c) => c.d).reduce((c, r) => c + r, 0)}ms: `, i.join(" "));
  }
}
async function sn(t, n, e, o, i, c) {
  const { transposedData: r, image: u } = cn(t, i, c), h = (await rn(r, u, n, e))[0].data, l = h.reduce((y, m) => Math.max(y, m)), f = h.findIndex((y) => y === l);
  return o[f];
}
function cn(t, n, e) {
  const o = Dt(t, n, e);
  return { transposedData: Bt(o, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]), image: o };
}
async function rn(t, n, e, o) {
  const i = t.flat(Number.POSITIVE_INFINITY), c = Float32Array.from(i), r = new e.Tensor("float32", c, [1, 3, n.height, n.width]), u = {};
  u[o.inputNames[0]] = r;
  const x = await o.run(u);
  return Object.values(x);
}
function an(t) {
  if (t.length === 0) throw new Error("Empty contour");
  const n = ln([...t]);
  let e = Number.POSITIVE_INFINITY;
  const o = {
    center: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
    angle: 0
  };
  for (let i = 0; i < n.length; i++) {
    const c = n[i], r = n[(i + 1) % n.length], u = { x: r.x - c.x, y: r.y - c.y }, x = Math.hypot(u.x, u.y), [h, l] = [u.x / x, u.y / x];
    let f = Number.POSITIVE_INFINITY, y = Number.NEGATIVE_INFINITY, m = Number.POSITIVE_INFINITY, p = Number.NEGATIVE_INFINITY;
    for (const w of n) {
      const k = (w.x - c.x) * h + (w.y - c.y) * l;
      f = Math.min(f, k), y = Math.max(y, k);
      const C = -(w.x - c.x) * l + (w.y - c.y) * h;
      m = Math.min(m, C), p = Math.max(p, C);
    }
    const b = (y - f) * (p - m);
    if (b < e) {
      e = b;
      const w = (f + y) / 2, k = (m + p) / 2;
      o.center = {
        x: c.x + h * w - l * k,
        y: c.y + l * w + h * k
      }, o.size = {
        width: y - f,
        height: p - m
      }, o.angle = Math.atan2(l, h) * (180 / Math.PI);
    }
  }
  return o.size.width < o.size.height && ([o.size.width, o.size.height] = [o.size.height, o.size.width], o.angle += 90), o.angle = (o.angle % 180 + 180) % 180, o;
}
function ln(t) {
  t.sort((o, i) => o.x - i.x || o.y - i.y);
  const n = [];
  for (const o of t) {
    for (; n.length >= 2 && Yt(n[n.length - 2], n[n.length - 1], o) <= 0; )
      n.pop();
    n.push(o);
  }
  const e = [];
  for (let o = t.length - 1; o >= 0; o--) {
    const i = t[o];
    for (; e.length >= 2 && Yt(e[e.length - 2], e[e.length - 1], i) <= 0; )
      e.pop();
    e.push(i);
  }
  return n.slice(0, -1).concat(e.slice(0, -1));
}
function Yt(t, n, e) {
  return (n.x - t.x) * (e.y - t.y) - (n.y - t.y) * (e.x - t.x);
}
function un(t, n, e = "CHAIN_APPROX_SIMPLE") {
  const o = t.length, i = o > 0 ? t[0].length : 0, c = Array.from({ length: o }, () => new Array(i).fill(!1));
  for (let r = 0; r < o; r++)
    for (let u = 0; u < i; u++)
      if (t[r][u] !== 0 && !c[r][u] && Ht(t, u, r)) {
        const x = hn(t, c, u, r, e === "CHAIN_APPROX_SIMPLE");
        n.push(x);
      }
}
function Ht(t, n, e) {
  return t[e][n] !== 0 && (e > 0 && t[e - 1][n] === 0 || e < t.length - 1 && t[e + 1][n] === 0 || n > 0 && t[e][n - 1] === 0 || n < t[0].length - 1 && t[e][n + 1] === 0);
}
function hn(t, n, e, o, i) {
  const c = [];
  let r = { x: e, y: o }, u = { x: e - 1, y: o };
  const x = /* @__PURE__ */ new Map(), h = /* @__PURE__ */ new Map();
  function l(b) {
    return b.x + b.y * t[0].length;
  }
  function f(b) {
    const w = Math.floor(b / t[0].length);
    return { x: b % t[0].length, y: w };
  }
  function y(b, w) {
    const k = l(b), C = l(w), I = vt(w.x - b.x, w.y - b.y), v = vt(b.x - w.x, b.y - w.y), B = x.get(k) ?? [], N = x.get(C) ?? [];
    x.set(k, [...B, I]), x.set(C, [...N, v]);
  }
  function m(b) {
    const w = l(r);
    u = r, r = { x: r.x + Mt[b].dx, y: r.y + Mt[b].dy }, y(u, r);
    const C = (h.get(w) ?? []).filter((I) => I !== b);
    C.length > 0 ? h.set(w, C) : h.delete(w);
  }
  x.set(l(r), [vt(-1, 0)]);
  let p = 0;
  do {
    c.push(r), n[r.y][r.x] = !0;
    const b = fn(t, x, r);
    if (b.length === 0) {
      if (h.size === 0)
        break;
      const [w, k] = Array.from(h.entries()).at(0), C = k[0];
      r = f(w), m(C);
    }
    if (b.length >= 1) {
      const w = l(r);
      h.set(w, b);
      const k = b[0];
      m(k);
    }
    p++;
  } while (p < 1e9);
  return i ? dn(c) : c;
}
const Mt = [
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
function fn(t, n, e) {
  function o(r) {
    return r.x + r.y * t[0].length;
  }
  const i = n.get(o(e)) ?? [], c = [];
  for (const [r, { dx: u, dy: x }] of Mt.entries()) {
    if (i.includes(r)) continue;
    const h = e.x + u, l = e.y + x;
    h >= 0 && h < t[0].length && l >= 0 && l < t.length && Ht(t, h, l) && c.push(r);
  }
  return c;
}
function vt(t, n) {
  const e = Mt.findIndex(({ dx: o, dy: i }) => t === o && n === i);
  return e === -1 ? 0 : e;
}
function dn(t) {
  if (t.length < 3) return [...t];
  const n = [t[0]];
  for (let e = 1; e < t.length - 1; e++) {
    const o = n[n.length - 1], i = t[e], c = t[e + 1];
    xn(o, i, c) || n.push(i);
  }
  return n.push(t[t.length - 1]), n;
}
function xn(t, n, e) {
  return (n.x - t.x) * (e.y - n.y) === (n.y - t.y) * (e.x - n.x);
}
const tt = new Xt("t"), Q = new Xt("af_det");
let H = !1, Tt = !1, K = null;
function xt(t, n) {
  var o;
  const e = document.createElement("canvas");
  e.width = t.width, e.height = t.height, e.getContext("2d").drawImage(t, 0, 0), n && (e.id = n);
  try {
    (o = document == null ? void 0 : document.body) == null || o.append(e);
  } catch {
  }
}
let bt = (t, n, e) => new ImageData(t, n, e);
function Y(...t) {
  Tt && console.log(...t);
}
function mn(...t) {
  Tt && console.log(t.map((n) => `%c${n}`).join(""), ...t.map((n) => `color: ${n}`));
}
async function $n(t) {
  bn(t);
  const n = {
    det: "det" in t ? t.det : {
      input: t.detPath,
      ratio: t.detRatio,
      det_db_thresh: t.det_db_thresh,
      det_db_box_thresh: t.det_db_box_thresh,
      det_db_unclip_ratio: t.det_db_unclip_ratio,
      det_limit_side_len: t.det_limit_side_len,
      mean: t.detMean,
      std: t.detStd,
      erode_size: t.erode_size,
      min_side: t.min_side,
      on: async (o) => {
        t.onDet && t.onDet(o), t.onProgress && t.onProgress("det", 1, 1);
      }
    },
    rec: "rec" in t ? t.rec : {
      input: t.recPath,
      decodeDic: t.dic,
      imgh: t.imgh,
      verticalRotateRatio: t.verticalRotateRatio,
      on: async (o, i, c) => {
        t.onRec && t.onRec(o, {
          text: i.map((r) => r[0].t).join(""),
          mean: i.map((r) => r[0].mean).reduce((r, u) => r + u, 0) / i.length
        }), t.onProgress && t.onProgress("rec", c, o + 1);
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
  }, e = await gn(n);
  return K = e, e;
}
function bn(t) {
  H = !!t.dev, Tt = H || !!t.log, H || (tt.l = () => {
  }, Q.l = () => {
  }), t.canvas && tn(t.canvas), t.imageData && (bt = t.imageData);
}
async function jt(t) {
  let n;
  if (typeof window > "u") {
    const e = t;
    if (!e.data || !e.width || !e.height) throw new Error("invalid image data");
    return e;
  }
  if (typeof t == "string" ? (n = new Image(), n.src = t, await new Promise((e) => {
    n.onload = e;
  })) : (t instanceof ImageData, n = t), n instanceof HTMLImageElement) {
    const o = mt(n.naturalWidth, n.naturalHeight).getContext("2d");
    if (!o) throw new Error("canvas context is null");
    o.drawImage(n, 0, 0), n = o.getImageData(0, 0, n.naturalWidth, n.naturalHeight);
  }
  if (n instanceof HTMLCanvasElement) {
    const e = n.getContext("2d");
    if (!e) throw new Error("canvas context is null");
    n = e.getImageData(0, 0, n.width, n.height);
  }
  return n;
}
function Pt() {
  try {
    mt(1, 1), bt(new Uint8ClampedArray(4), 1, 1);
  } catch (t) {
    throw console.log("nodejs need set canvas, please use setOCREnv to set canvas and imageData"), t;
  }
}
async function Xn(t) {
  if (!K) throw new Error("need init");
  return K.ocr(t);
}
async function Hn(t) {
  if (!K) throw new Error("need init");
  return K.det(t);
}
async function qn(t) {
  if (!K) throw new Error("need init");
  return K.rec(t);
}
async function Kn(t) {
  if (!K) throw new Error("need init");
  return K.recognize(t);
}
async function gn(t) {
  Pt();
  const n = {
    ort: t.ort,
    ortOption: t.ortOption
  }, e = t.docCls ? await yn({ ...t.docCls, ...n }) : void 0, o = await pn({ ...t.det, ...n }), i = await In({ ...t.rec, ...n }), c = async (r) => {
    const u = await jt(r);
    return i.rec(wn(u));
  };
  return {
    ocr: async (r) => {
      let u = await jt(r), x = 0;
      e && (x = await e.docCls(u), Y("dir", x), u = Kt(u, 360 - x));
      const h = await o.det(u), l = await i.rec(h), f = Yn(l, t.analyzeLayout);
      return Y(l, f), tt.l("end"), { src: l, ...f, docDir: x };
    },
    det: o.det,
    rec: i.rec,
    recRaw: i.rawRec,
    recognize: c
  };
}
function Et(t, n, e) {
  return typeof n == "string" || n instanceof ArrayBuffer || n instanceof SharedArrayBuffer, t.InferenceSession.create(n, e);
}
async function yn(t) {
  const n = await Et(t.ort, t.input, t.ortOption);
  return { docCls: async (o) => sn(o, t.ort, n, [0, 90, 180, 270], 224, 224) };
}
async function pn(t) {
  Pt();
  let n = 1;
  const e = await Et(t.ort, t.input, t.ortOption);
  t.ratio !== void 0 && (n = t.ratio);
  const o = t.det_db_thresh ?? 0.3, i = t.det_db_box_thresh ?? 0.5, c = t.det_db_unclip_ratio ?? 1.6, r = t.erode_size ?? 0, u = t.min_side ?? 3, x = t.det_limit_side_len ?? 736, h = t.mean ?? [0.485, 0.456, 0.406], l = t.std ?? [0.229, 0.224, 0.225];
  async function f(y) {
    var B;
    const m = y;
    if (H) {
      const N = nt(m);
      xt(N);
    }
    tt.l("pre_det");
    const { data: p, width: b, height: w } = _n(m, n, x, h, l), { transposedData: k, image: C } = p;
    tt.l("det");
    const I = await Mn(k, C, e, t.ort);
    tt.l("aft_det");
    const v = Cn(
      { data: I.data, width: I.dims[3], height: I.dims[2] },
      b,
      w,
      m,
      o,
      i,
      c,
      r,
      u
    );
    return (B = t == null ? void 0 : t.on) == null || B.call(t, v), v;
  }
  return { det: f };
}
function wn(t) {
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
async function In(t) {
  var x;
  Pt();
  let n = 48;
  const e = await Et(t.ort, t.input, t.ortOption), o = t.decodeDic.split(/\r\n|\r|\n/) || [];
  o.at(-1) === "" ? o[o.length - 1] = " " : o.push(" "), t.imgh && (n = t.imgh);
  const i = ((x = t.optimize) == null ? void 0 : x.space) === void 0 ? !0 : t.optimize.space, c = t.verticalRotateRatio ?? 1.5;
  async function r(h, l) {
    var b, w, k;
    const f = [];
    tt.l("bf_rec");
    const y = Ln(h, n, c), m = (l == null ? void 0 : l.topK) || ((b = t.multiChar) == null ? void 0 : b.topK) || 2, p = (l == null ? void 0 : l.threshold) || ((w = t.multiChar) == null ? void 0 : w.threshold) || 1e-5;
    for (const [C, I] of y.entries()) {
      const { b: v, imgH: B, imgW: N } = I, P = await kn(v, B, N, e, t.ort), O = Fn(P, o, { topK: m, threshold: p })[0];
      f.push({
        text: O,
        box: h[C].box,
        style: h[C].style
      }), (k = t == null ? void 0 : t.on) == null || k.call(t, C, O, h.length);
    }
    return tt.l("rec_end"), f;
  }
  async function u(h) {
    const l = [], f = await r(h, { topK: 2, threshold: 1e-5 });
    for (const y of f) {
      const m = y.text.map((w) => i && w[0].t === "" && w[1].t === " " && w[1].mean > 1e-3 ? w[1] : w[0]), p = m.map((w) => w.t).join("").trim(), b = m.map((w) => w.mean).reduce((w, k) => w + k, 0) / m.length;
      b < 0.5 || l.push({
        text: p,
        mean: b,
        box: y.box,
        style: y.style
      });
    }
    return l;
  }
  return { rec: u, rawRec: r };
}
async function Mn(t, n, e, o) {
  const i = Float32Array.from(t.flat(3)), c = new o.Tensor("float32", i, [1, 3, n.height, n.width]), r = {};
  return r[e.inputNames[0]] = c, (await e.run(r))[e.outputNames[0]];
}
async function kn(t, n, e, o, i) {
  const c = Float32Array.from(t.flat(3)), r = new i.Tensor("float32", c, [1, 3, n, e]), u = {};
  return u[o.inputNames[0]] = r, (await o.run(u))[o.outputNames[0]];
}
function _n(t, n, e = 736, o = [0.485, 0.456, 0.406], i = [0.229, 0.224, 0.225]) {
  const c = Math.min(t.height, t.width);
  let r = n;
  n >= 1 && c < e && (r = Math.max(r, e / c));
  const u = Math.max(Math.round(t.height * r / 32) * 32, 32), x = Math.max(Math.round(t.width * r / 32) * 32, 32);
  if (H) {
    const f = nt(t);
    xt(f);
  }
  const h = Dt(t, x, u), l = Bt(h, o, i);
  if (Y(h), H) {
    const f = nt(h);
    xt(f);
  }
  return { data: { transposedData: l, image: h }, width: x, height: u };
}
function Cn(t, n, e, o, i = 0.3, c = 0.5, r = 1.6, u = 0, x = 3) {
  Q.l("");
  const h = n, l = e, { data: f, width: y, height: m } = t, p = new Uint8Array(y * m);
  for (let I = 0; I < f.length; I++) {
    const v = f[I] > i ? 255 : 0;
    p[I] = v;
  }
  let b = p;
  for (let I = 0; I < u; I++) {
    const v = b;
    b = new Uint8Array(y * m);
    for (let B = 0; B < m; B++)
      for (let N = 0; N < y; N++) {
        const P = B * y + N;
        if (v[P] === 0) {
          b[P] = 0;
          continue;
        }
        B > 0 && v[P - y] === 0 || B < m - 1 && v[P + y] === 0 ? b[P] = 0 : b[P] = 255;
      }
  }
  if (H) {
    const I = new Uint8ClampedArray(y * m * 4);
    for (let N = 0; N < b.length; N++) {
      const P = N * 4, O = b[N];
      I[P] = I[P + 1] = I[P + 2] = O, I[P + 3] = 255;
    }
    const v = bt(I, y, m), B = nt(v);
    xt(B, "det_ru");
  }
  Q.l("edge");
  const w = [], k = [];
  for (let I = 0; I < m; I++)
    k.push(Array.from(b.slice(I * y, I * y + y)));
  const C = [];
  if (un(k, C), H) {
    const I = document.querySelector("#det_ru").getContext("2d");
    for (const v of C) {
      I.moveTo(v[0].x, v[0].y);
      for (const B of v)
        I.lineTo(B.x, B.y);
      I.strokeStyle = "red", I.closePath(), I.stroke();
    }
  }
  for (let I = 0; I < C.length; I++) {
    Q.l("get_box");
    const v = x, B = C[I], { points: N, sside: P } = Pn(B);
    if (P < v) continue;
    const O = Nn(N, r), V = O.points;
    if (O.sside < v + 2)
      continue;
    const z = o.width / h, U = o.height / l;
    for (let R = 0; R < V.length; R++)
      V[R][0] *= z, V[R][1] *= U;
    Q.l("order");
    const j = En(V);
    for (const R of j)
      R[0] = X(Math.round(R[0]), 0, o.width), R[1] = X(Math.round(R[1]), 0, o.height);
    const q = Ft(Gt(j[0], j[1])), et = Ft(Gt(j[0], j[3]));
    if (q <= 3 || et <= 3 || Dn(
      f,
      y,
      m,
      N
    ) < c) continue;
    jn(V, "", "red", "det_ru"), Q.l("crop");
    const W = An(o, V);
    Q.l("match best");
    const { bg: L, text: F } = Rn(W), G = Vn(V, W, F);
    w.push({ box: G, img: W, style: { bg: L, text: F } });
  }
  return Q.l("e"), Y(w), w;
}
function Sn(t) {
  let n = -1;
  const e = t.length;
  let o, i = t[e - 1], c = 0;
  for (; ++n < e; )
    o = i, i = t[n], c += o[1] * i[0] - o[0] * i[1];
  return c / 2;
}
function vn(t) {
  let n = -1;
  const e = t.length;
  let o = t[e - 1], i, c, r = o[0], u = o[1], x = 0;
  for (; ++n < e; )
    i = r, c = u, o = t[n], r = o[0], u = o[1], i -= r, c -= u, x += Math.hypot(i, c);
  return x;
}
function Nn(t, n = 2) {
  const e = Math.abs(Sn(t)), o = vn(t), i = e * n / o, c = [];
  for (const [h, l] of t.entries()) {
    const f = t.at((h - 1) % 4), y = t.at((h + 1) % 4), m = l[0] - f[0], p = l[1] - f[1], b = Math.sqrt(m ** 2 + p ** 2), w = m / b * i, k = p / b * i, C = l[0] - y[0], I = l[1] - y[1], v = Math.sqrt(C ** 2 + I ** 2), B = C / v * i, N = I / v * i;
    c.push([l[0] + w + B, l[1] + k + N]);
  }
  const r = [c[0][0] - c[1][0], c[0][1] - c[1][1]], u = [c[2][0] - c[1][0], c[2][1] - c[1][1]], x = r[0] * u[1] - r[1] * u[0];
  return { points: c, sside: Math.abs(x) };
}
function Dn(t, n, e, o) {
  let i = 1 / 0, c = -1 / 0, r = 1 / 0, u = -1 / 0;
  for (const p of o)
    i = Math.min(i, p[0]), c = Math.max(c, p[0]), r = Math.min(r, p[1]), u = Math.max(u, p[1]);
  const x = Math.max(0, Math.min(Math.floor(i), n - 1)), h = Math.max(0, Math.min(Math.ceil(c), n - 1)), l = Math.max(0, Math.min(Math.floor(r), e - 1)), f = Math.max(0, Math.min(Math.ceil(u), e - 1));
  if (h <= x || f <= l) return 0;
  let y = 0, m = 0;
  for (let p = l; p <= f; p++)
    for (let b = x; b <= h; b++)
      Bn([b + 0.5, p + 0.5], o) && (y += t[p * n + b], m++);
  return m > 0 ? y / m : 0;
}
function Bn(t, n) {
  let e = 0;
  for (let o = 0; o < 4; o++) {
    const i = n[o], c = n[(o + 1) % 4], r = (c[0] - i[0]) * (t[1] - i[1]) - (c[1] - i[1]) * (t[0] - i[0]);
    if (r !== 0) {
      const u = r > 0 ? 1 : -1;
      if (e === 0) e = u;
      else if (u !== e) return !1;
    }
  }
  return !0;
}
function Tn(t, n, e) {
  const o = n.width, i = n.height, c = e * Math.PI / 180, r = Math.cos(c), u = Math.sin(c), x = t.x, h = t.y, l = o * 0.5, f = i * 0.5, y = [], m = x - l * r + f * u, p = h - l * u - f * r;
  y.push([m, p]);
  const b = x + l * r + f * u, w = h + l * u - f * r;
  y.push([b, w]);
  const k = x + l * r - f * u, C = h + l * u + f * r;
  y.push([k, C]);
  const I = x - l * r - f * u, v = h - l * u + f * r;
  return y.push([I, v]), y;
}
function Pn(t) {
  const e = an(t), o = Array.from(Tn(e.center, e.size, e.angle)).sort(
    (l, f) => l[0] - f[0]
  );
  let i = 0, c = 1, r = 2, u = 3;
  o[1][1] > o[0][1] ? (i = 0, u = 1) : (i = 1, u = 0), o[3][1] > o[2][1] ? (c = 2, r = 3) : (c = 3, r = 2);
  const x = [o[i], o[c], o[r], o[u]], h = Math.min(e.size.height, e.size.width);
  return { points: x, sside: h };
}
function Gt(t, n) {
  return Math.sqrt((t[0] - n[0]) ** 2 + (t[1] - n[1]) ** 2);
}
function En(t) {
  const n = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0]
  ], e = t.map((c) => c[0] + c[1]);
  n[0] = t[e.indexOf(Math.min(...e))], n[2] = t[e.indexOf(Math.max(...e))];
  const o = t.filter((c) => c !== n[0] && c !== n[2]), i = o[1].map((c, r) => c - o[0][r]);
  return n[1] = o[i.indexOf(Math.min(...i))], n[3] = o[i.indexOf(Math.max(...i))], n;
}
function An(t, n) {
  const [e, o, i, c] = n.map((h) => ({ x: h[0], y: h[1] })), r = Math.max(
    Math.hypot(o.x - e.x, o.y - e.y),
    Math.hypot(i.x - c.x, i.y - c.y)
  ), u = Math.max(
    Math.hypot(c.x - e.x, c.y - e.y),
    Math.hypot(i.x - o.x, i.y - o.y)
  );
  if (r < 1 || u < 1) throw new Error("点共线，无法形成矩形");
  const x = on(
    t,
    Math.ceil(r),
    Math.ceil(u),
    [
      [e.x, e.y],
      [o.x, o.y],
      [i.x, i.y],
      [c.x, c.y]
    ]
  );
  return x ? bt(x.data, x.width, x.height) : zn(t, e, o, c, r, u);
}
function zn(t, n, e, o, i, c) {
  const r = e.x - n.x, u = e.y - n.y, x = o.x - n.x, h = o.y - n.y, l = r * h - x * u;
  if (l === 0) throw new Error("点共线，无法形成矩形");
  const f = i * h / l, y = -x * i / l, m = -c * u / l, p = r * c / l, b = -f * n.x - y * n.y, w = -m * n.x - p * n.y, k = nt(t), C = mt(Math.ceil(i), Math.ceil(c)), I = C.getContext("2d");
  return I.setTransform(f, m, y, p, b, w), I.drawImage(k, 0, 0), I.resetTransform(), I.getImageData(0, 0, C.width, C.height);
}
function Rn(t) {
  var x, h;
  const n = /* @__PURE__ */ new Map(), e = t.data;
  for (let l = 0; l < e.length; l += 4) {
    if (l / 4 % t.width > t.height * 4) continue;
    const y = e[l], m = e[l + 1], p = e[l + 2], b = [y, m, p].join(",");
    n.set(b, (n.get(b) || 0) + 1);
  }
  const o = On(n, 20).map((l) => ({
    el: l.el.split(",").map(Number),
    count: l.count
  })), i = ((x = o.at(0)) == null ? void 0 : x.el) || [255, 255, 255], c = ((h = o.at(1)) == null ? void 0 : h.el) || [0, 0, 0];
  let r = c;
  const u = 100;
  if (wt(c, i) < u) {
    const l = o.slice(1).filter((f) => wt(f.el, i) > 50);
    l.length > 0 && (r = [0, 1, 2].map(
      (f) => Math.round(qt(l.map((y) => [y.el[f], y.count])))
    )), (l.length === 0 || wt(r, i) < u) && (r = i.map((f) => 255 - f)), mn(`rgb(${r.join(",")})`);
  }
  return {
    bg: i,
    text: r,
    textEdge: c
  };
}
function wt(t, n) {
  const e = t, o = n;
  return Math.sqrt((e[0] - o[0]) ** 2 + (e[1] - o[1]) ** 2 + (e[2] - o[2]) ** 2);
}
function On(t, n = 1) {
  let e = [];
  return t.forEach((o, i) => {
    e.length === 0 ? e.push({ el: i, count: o }) : (e.length < n ? e.push({ el: i, count: o }) : e.find((c) => c.count <= o) && e.push({ el: i, count: o }), e.sort((c, r) => r.count - c.count), e.length > n && (e = e.slice(0, n)));
  }), e;
}
function Vn(t, n, e) {
  let o = 0, i = n.height, c = 0, r = n.width;
  function u(m) {
    return wt(m, e) < 200;
  }
  t: for (let m = o; m < n.height; m++)
    for (let p = 0; p < n.width; p++) {
      const b = pt(n, p, m);
      if (u(b)) {
        o = m;
        break t;
      }
    }
  t: for (let m = i - 1; m >= 0; m--)
    for (let p = 0; p < n.width; p++) {
      const b = pt(n, p, m);
      if (u(b)) {
        i = m;
        break t;
      }
    }
  t: for (let m = c; m < n.width; m++)
    for (let p = o; p <= i; p++) {
      const b = pt(n, m, p);
      if (u(b)) {
        c = m;
        break t;
      }
    }
  t: for (let m = r - 1; m >= 0; m--)
    for (let p = o; p <= i; p++) {
      const b = pt(n, m, p);
      if (u(b)) {
        r = m;
        break t;
      }
    }
  const x = X(o - 1, 0, 4), h = X(n.height - i - 1, 0, 4), l = X(c - 1, 0, 4), f = X(n.width - r - 1, 0, 4);
  return [
    [t[0][0] + l, t[0][1] + x],
    [t[1][0] - f, t[1][1] + x],
    [t[2][0] - f, t[2][1] - h],
    [t[3][0] + l, t[3][1] - h]
  ];
}
function pt(t, n, e) {
  const o = (e * t.width + n) * 4;
  return Array.from(t.data.slice(o, o + 4));
}
function Ln(t, n, e = 1.5) {
  const o = [];
  function i(c) {
    const r = Math.floor(n * (c.width / c.height)), u = Dt(c, r, n, void 0, "high");
    return H && xt(nt(u, r, n)), { data: u, w: r, h: n };
  }
  for (const c of t) {
    let r = c.img;
    r.height > r.width * e && (r = Kt(r, -90));
    const u = i(r);
    o.push({ b: Bt(u.data, [0.5, 0.5, 0.5], [0.5, 0.5, 0.5]), imgH: u.h, imgW: u.w });
  }
  return Y(o), o;
}
function Fn(t, n, e) {
  const o = t.dims[2], i = [];
  let c = t.dims[0] - 1;
  const r = e.topK, u = e.threshold;
  function x(l) {
    return n.at(l - 1) ?? "";
  }
  for (let l = 0; l < t.data.length; l += o * t.dims[1]) {
    const f = [];
    for (let y = l; y < l + o * t.dims[1]; y += o) {
      const m = t.data.slice(y, y + o), p = [];
      for (let b = 0; b < m.length; b++) {
        const w = m[b];
        if (!(w < u)) {
          if (!(p.length === r && w <= p.at(-1).v)) {
            const k = p.findIndex((C) => C.v > w);
            k === -1 ? p.unshift({ t: b, v: w }) : p.splice(k + 1, 0, { t: b, v: w });
          }
          p.length > r && p.pop();
        }
      }
      f.push(p);
    }
    i[c] = h(f), c--;
  }
  function h(l) {
    const f = [];
    for (let y = 0; y < l.length; y++)
      l[y][0].t !== 0 && (y > 0 && l[y - 1][0].t === l[y][0].t || f.push(l[y].map((m) => ({ t: x(m.t), mean: m.v }))));
    return f;
  }
  return i;
}
function Yn(t, n) {
  var Vt;
  Y(t);
  const e = (n == null ? void 0 : n.docDirs) ?? [
    { block: "tb", inline: "lr" },
    { block: "rl", inline: "tb" }
  ], o = { block: "tb", inline: "lr" }, i = {
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
      readingDir: o,
      angle: { reading: { inline: 0, block: 90 }, angle: 0 }
    };
  const r = [
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
  function x(s) {
    const a = l.center(s);
    for (let d = r.length - 1; d >= 0; d--) {
      const M = r[d].box;
      if (a[0] >= M[0][0] && a[0] <= M[1][0] && a[1] >= M[0][1] && a[1] <= M[3][1])
        return d;
    }
    return u;
  }
  const h = {
    center: (s, a) => [(s[0] + a[0]) / 2, (s[1] + a[1]) / 2],
    disByV: (s, a, d) => Math.abs(d === "block" ? f.dotMup(s, c.block) - f.dotMup(a, c.block) : f.dotMup(s, c.inline) - f.dotMup(a, c.inline)),
    compare: (s, a, d) => d === "block" ? f.dotMup(s, c.block) - f.dotMup(a, c.block) : f.dotMup(s, c.inline) - f.dotMup(a, c.inline),
    toInline: (s) => f.dotMup(s, c.inline),
    toBlock: (s) => f.dotMup(s, c.block)
  }, l = {
    inlineStart: (s) => h.center(s[0], s[3]),
    inlineEnd: (s) => h.center(s[1], s[2]),
    blockStart: (s) => h.center(s[0], s[1]),
    blockEnd: (s) => h.center(s[2], s[3]),
    inlineSize: (s) => s[1][0] - s[0][0],
    blockSize: (s) => s[3][1] - s[0][1],
    inlineStartDis: (s, a) => h.disByV(s[0], a[0], "inline"),
    inlineEndDis: (s, a) => h.disByV(s[1], a[1], "inline"),
    blockGap: (s, a) => h.disByV(s[0], a[3], "block"),
    inlineCenter: (s) => (s[2][0] + s[0][0]) / 2,
    blockCenter: (s) => (s[2][1] + s[0][1]) / 2,
    inlineStartCenter: (s) => l.inlineStart(s),
    center: (s) => h.center(s[0], s[2])
  }, f = {
    fromPonts: (s, a) => [s[0] - a[0], s[1] - a[1]],
    dotMup: (s, a) => s[0] * a[0] + s[1] * a[1],
    numMup: (s, a) => [s[0] * a, s[1] * a],
    add: (s, a) => [s[0] + a[0], s[1] + a[1]]
  };
  function y(s) {
    let a = 0, d = 0;
    const g = [];
    for (const [M, _] of s.entries()) {
      const S = _ > 180 ? _ - 180 : _, T = S - 180, A = M === 0 ? S : Math.abs(T - a) < Math.abs(S - a) ? T : S;
      g.push(A), a = (a * d + A) / (d + 1), d++;
    }
    return { av: a, l: g };
  }
  function m(s, a) {
    return Math.abs(s - a) < 45 || Math.abs(s - (a - 180)) < 45 || Math.abs(s - 180 - a) < 45;
  }
  function p(s) {
    s.sort((d, g) => d - g);
    const a = Math.floor(s.length / 2);
    return s.length % 2 === 0 ? (s[a - 1] + s[a]) / 2 : s[a];
  }
  function b(s) {
    return s === "lr" || s === "rl" ? "x" : "y";
  }
  function w(s, a) {
    let d = Number.POSITIVE_INFINITY, g = -1;
    for (let M = 0; M < s.length; M++) {
      const _ = a(s[M]);
      _ < d && (d = _, g = M);
    }
    return s[g];
  }
  const k = {
    lr: [1, 0],
    rl: [-1, 0],
    tb: [0, 1],
    bt: [0, -1]
  };
  function C(s, a) {
    const d = k[s.inline], g = k[s.block], M = k[a.inline], _ = k[a.block], S = [f.dotMup(M, d), f.dotMup(M, g)], T = [f.dotMup(_, d), f.dotMup(_, g)];
    return (A) => [f.dotMup(A, S), f.dotMup(A, T)];
  }
  function I(s, a) {
    const d = C(s, a);
    return {
      b: (g) => {
        for (const M of g) {
          const [_, S] = d(M);
          M[0] = _, M[1] = S;
        }
      },
      p: d
    };
  }
  function v(s) {
    return (a) => {
      const d = [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0]
      ];
      for (let g = 0; g < s.length; g++)
        d[g] = a[s[g]];
      return d;
    };
  }
  function B(s, a) {
    return Math.sqrt((s[0] - a[0]) ** 2 + (s[1] - a[1]) ** 2);
  }
  function N(s) {
    const a = s.flatMap((E) => E.map((D) => D)), d = Math.min(...a.map((E) => f.dotMup(E, c.inline))), g = Math.max(...a.map((E) => f.dotMup(E, c.inline))), M = Math.min(...a.map((E) => f.dotMup(E, c.block))), _ = Math.max(...a.map((E) => f.dotMup(E, c.block))), S = f.add(f.numMup(c.inline, d), f.numMup(c.block, M)), T = f.numMup(c.inline, g - d), A = f.numMup(c.block, _ - M);
    return [S, f.add(S, T), f.add(f.add(S, T), A), f.add(S, A)];
  }
  function P(s) {
    let a = null, d = Number.POSITIVE_INFINITY;
    for (const A in Z) {
      const E = Z[A].src.at(-1);
      if (!E) continue;
      const D = B(s.box[0], E.box[0]);
      D < d && (a = Number(A), d = D);
    }
    if (a === null) {
      Z.push({ src: [s] });
      return;
    }
    const g = Z[a].src.at(-1), M = l.inlineSize(s.box), _ = l.inlineSize(g.box), S = Math.min(M, _), T = l.blockSize(s.box);
    if (
      // 左右至少有一边是相近的，中心距离要相近
      // 行之间也不要离太远
      !((l.inlineStartDis(s.box, g.box) < 3 * T || l.inlineEndDis(s.box, g.box) < 3 * T || h.disByV(l.center(s.box), l.center(g.box), "inline") < S * 0.4) && l.blockGap(s.box, g.box) < T * 1.1)
    ) {
      Z.push({ src: [s] });
      return;
    }
    Z[a].src.push(s);
  }
  function O(s) {
    var M, _;
    const a = new RegExp("\\p{Ideographic}", "u"), d = /[。，！？；：“”‘’《》、【】（）…—]/, g = {
      box: N(s.map((S) => S.box)),
      text: "",
      mean: qt(s.map((S) => [S.mean, S.text.length])),
      style: s[0].style
    };
    for (const S of s) {
      const T = g.text.at(-1);
      T && (!T.match(a) && !T.match(d) || !((M = S.text.at(0)) != null && M.match(a)) && !((_ = S.text.at(0)) != null && _.match(d))) && (g.text += " "), g.text += S.text;
    }
    return g;
  }
  function V(s) {
    s.sort((a, d) => {
      const g = a.src.at(0) ? l.blockSize(a.src.at(0).box) : 2;
      return h.disByV(l.blockStart(a.outerBox), l.blockStart(d.outerBox), "block") < g ? h.compare(l.inlineStart(a.outerBox), l.inlineStart(d.outerBox), "inline") : h.compare(l.blockStart(a.outerBox), l.blockStart(d.outerBox), "block");
    });
  }
  if (n != null && n.columnsTip)
    for (const s of n.columnsTip) r.push(structuredClone(s));
  const z = {
    inline: 0,
    block: 90
  }, U = t.map((s) => {
    const a = s.box, d = a[1][0] - a[0][0], g = a[3][1] - a[0][1];
    let M = { x: 0, y: 0 };
    if (d < g) {
      const S = f.fromPonts(h.center(a[2], a[3]), h.center(a[0], a[1]));
      M = { x: S[0], y: S[1] };
    } else {
      const S = f.fromPonts(h.center(a[1], a[2]), h.center(a[0], a[3]));
      M = { x: S[0], y: S[1] };
    }
    return It(Math.atan2(M.y, M.x) * (180 / Math.PI));
  }), j = y(U), q = U.filter((s) => m(s, j.av)), et = p(q), gt = p(q.map((s) => Math.abs(s - et))), W = q.filter((s) => Math.abs((s - et) / (gt * 1.4826)) < 2), L = It(y(W).av);
  Y("dir0", U, j, q, W, L);
  const F = It(L + 90), G = m(L, 0) ? "x" : "y", R = m(F, 90) ? "y" : "x", at = e.find((s) => G === b(s.inline) && R === b(s.block)) ?? e.at(0);
  at && (o.block = at.block, o.inline = at.inline);
  const lt = {
    lr: 0,
    rl: 180,
    tb: 90,
    bt: 270
  };
  z.inline = w(
    [L, L - 360, L - 180, L + 180],
    (s) => Math.abs(s - lt[o.inline])
  ), z.block = w(
    [F, F - 360, F - 180, F + 180],
    (s) => Math.abs(s - lt[o.block])
  ), i.inline = [Math.cos(z.inline * (Math.PI / 180)), Math.sin(z.inline * (Math.PI / 180))], i.block = [Math.cos(z.block * (Math.PI / 180)), Math.sin(z.block * (Math.PI / 180))], Y("dir", o, z, i, L, F);
  const ut = [
    [o.inline[0], o.block[0]],
    [o.inline[1], o.block[0]],
    [o.inline[1], o.block[1]],
    [o.inline[0], o.block[1]]
  ].map(
    ([s, a]) => ({
      lt: 0,
      rt: 1,
      rb: 2,
      lb: 3
    })[s === "l" || s === "r" ? s + a : a + s]
  ), ot = I({ inline: "lr", block: "tb" }, o), zt = v(ut), Ut = t.map((s) => {
    const a = zt(s.box);
    return ot.b(a), {
      ...s,
      box: a
    };
  });
  for (const s of r)
    s.box = zt(s.box), ot.b(s.box);
  c.inline = ot.p(i.inline), c.block = ot.p(i.block), Y("相对坐标系", c);
  const Wt = Ut.sort((s, a) => h.compare(l.blockStart(s.box), l.blockStart(a.box), "block")), st = [];
  for (const s of Wt) {
    const a = x(s.box), d = (Vt = st.at(-1)) == null ? void 0 : Vt.line.at(-1);
    if (!d) {
      st.push({ line: [{ src: s, colId: a }] });
      continue;
    }
    const g = l.center(s.box), M = l.center(d.src.box);
    if (h.disByV(g, M, "block") < 0.5 * l.blockSize(s.box)) {
      const _ = st.at(-1);
      _ ? _.line.push({ src: s, colId: a }) : st.push({ line: [{ src: s, colId: a }] });
    } else
      st.push({ line: [{ src: s, colId: a }] });
  }
  const yt = [];
  for (const s of st) {
    if (s.line.length === 1) {
      yt.push({ src: s.line[0].src, colId: s.line[0].colId });
      continue;
    }
    const a = Nt(s.line.map((g) => l.blockSize(g.src.box)));
    s.line.sort((g, M) => h.compare(l.inlineStart(g.src.box), l.inlineStart(M.src.box), "inline"));
    let d = s.line.at(0);
    for (const g of s.line.slice(1)) {
      const M = l.inlineEnd(d.src.box), _ = l.inlineStart(g.src.box);
      r[g.colId].type === "table" || g.colId !== d.colId || h.toInline(_) - h.toInline(M) > a ? (yt.push({ ...d }), d = g) : (d.src.text += g.src.text, d.src.mean = (d.src.mean + g.src.mean) / 2, d.src.box = N([d.src.box, g.src.box]));
    }
    yt.push({ ...d });
  }
  const Z = [], kt = [], ht = [];
  for (const s of yt)
    if (s.colId === u)
      kt.push(s);
    else {
      const a = ht.find((d) => d.colId === s.colId);
      a ? a.src.push(s.src) : ht.push({ src: [s.src], type: r[s.colId].type, colId: s.colId });
    }
  kt.sort((s, a) => h.compare(l.blockStart(s.src.box), l.blockStart(a.src.box), "block"));
  for (const s of kt)
    P(s.src);
  const ft = [];
  for (const [s, a] of Z.entries()) {
    const d = a.src, g = N(d.map((T) => T.box)), M = l.blockCenter(g), _ = l.inlineSize(g);
    if (s === 0) {
      ft.push({ smallCol: [{ src: d, outerBox: g, x: M, w: _ }] });
      continue;
    }
    const S = ft.find((T) => {
      const A = T.smallCol.at(-1), E = l.blockSize(d.at(0).box);
      return l.inlineStartDis(A.outerBox, g) < 3 * E && l.inlineEndDis(A.outerBox, g) < 3 * E && l.blockGap(g, A.outerBox) < E * 2.1;
    });
    S ? S.smallCol.push({ src: d, outerBox: g, x: M, w: _ }) : ft.push({ smallCol: [{ src: d, outerBox: g, x: M, w: _ }] });
  }
  for (const s of ft)
    s.smallCol.sort((a, d) => h.compare(l.blockStart(a.outerBox), l.blockStart(d.outerBox), "block"));
  for (const s of ht)
    s.src.sort((a, d) => h.compare(l.blockStart(a.box), l.blockStart(d.box), "block"));
  const _t = [];
  for (const s of ft) {
    const a = N(s.smallCol.map((g) => g.outerBox)), d = s.smallCol.flatMap((g) => g.src);
    _t.push({ src: d, outerBox: a, type: "none" });
  }
  V(_t);
  const dt = [];
  for (const s of _t) {
    const a = dt.at(-1);
    if (!a) {
      dt.push(s);
      continue;
    }
    if (a.type !== "none") {
      dt.push(s);
      continue;
    }
    const d = a.outerBox, g = l.blockSize(s.src[0].box);
    a.src.length === 1 && l.inlineStartDis(d, s.outerBox) < 3 * g || // 标题
    s.src.length === 1 && l.inlineStartDis(d, s.outerBox) < 3 * g || // 末尾
    l.inlineStartDis(d, s.outerBox) < 3 * g && l.inlineEndDis(d, s.outerBox) < 3 * g ? (a.src.push(...s.src), a.outerBox = N(a.src.map((M) => M.box))) : dt.push(s);
  }
  let Ct = !1;
  const J = [];
  for (const s of dt) {
    const a = J.at(-1), d = { ...s, reCal: !1 };
    if (!a) {
      J.push(d);
      continue;
    }
    const g = l.blockSize(d.src.at(0).box);
    h.compare(l.blockEnd(d.outerBox), l.blockEnd(a.outerBox), "block") < 0 && (l.inlineStartDis(a.outerBox, d.outerBox) < 3 * g || l.inlineEndDis(a.outerBox, d.outerBox) < 3 * g) ? (a.src.push(...d.src), a.reCal = !0, Ct = !0) : J.push(d);
  }
  for (const s of J)
    s.reCal && (s.src.sort((a, d) => h.compare(l.blockStart(a.box), l.blockStart(d.box), "block")), s.outerBox = N(s.src.map((a) => a.box)));
  ht.length && (Ct = !0);
  for (const s of ht) {
    const a = N(s.src.map((g) => g.box)), d = s.src;
    J.push({ src: d, outerBox: a, type: s.type, reCal: !1 });
  }
  Ct && V(J);
  const Rt = I(o, { inline: "lr", block: "tb" }), Ot = J.map((s) => {
    const a = s.src, d = [];
    if (s.type === "auto" || s.type === "none") {
      const _ = {};
      for (let D = 1; D < a.length; D++) {
        const $ = a[D - 1].box, rt = a[D].box, it = h.disByV(l.center(rt), l.center($), "block");
        _[it] || (_[it] = 0), _[it]++;
      }
      const S = Nt(a.map((D) => l.blockSize(D.box))), T = [[]];
      for (const D of Object.keys(_).map(($) => Number($)).sort()) {
        const $ = T.at(-1), rt = $.at(-1);
        rt !== void 0 ? Math.abs(rt - D) < S * 0.5 ? $.push(D) : T.push([]) : $.push(D);
      }
      const A = T.map((D) => Nt(D)).sort((D, $) => D - $).at(0) || 0;
      Y("d", _, T, A), d.push([a[0]]);
      let E = a[0];
      for (let D = 1; D < a.length; D++) {
        const $ = f.add(
          f.add(l.inlineStartCenter(E.box), f.numMup(c.block, A)),
          f.numMup(c.inline, -l.inlineStartDis(E.box, s.outerBox))
        ), rt = l.inlineStartCenter(a[D].box), it = l.blockSize(a[D].box);
        if (l.inlineEndDis(E.box, s.outerBox) > 2 * it || B($, rt) > it * 0.5)
          d.push([a[D]]);
        else {
          const Lt = d.at(-1);
          Lt ? Lt.push(a[D]) : d.push([a[D]]);
        }
        E = a[D];
      }
    } else (s.type === "table" || s.type === "raw" || s.type === "raw-blank") && d.push(a);
    for (const _ of a) Rt.b(_.box);
    Rt.b(s.outerBox);
    const g = [];
    for (const [_, S] of ut.entries())
      g[S] = _;
    const M = v(g);
    for (const _ of a)
      _.box = M(_.box);
    return s.outerBox = M(s.outerBox), Y(d), {
      src: a,
      outerBox: s.outerBox,
      parragraphs: d.map((_) => ({ src: _, parse: O(_) }))
    };
  }), Qt = Ot.flatMap((s) => s.parragraphs.map((a) => a.parse));
  let ct = 0;
  return o.inline === "lr" && (ct = z.inline), o.inline === "rl" && (ct = z.inline - 180), o.block === "lr" && (ct = z.block), o.block === "rl" && (ct = z.block - 180), Y("angle", ct), {
    columns: Ot,
    parragraphs: Qt,
    readingDir: o,
    angle: { reading: z, angle: ct }
  };
}
function Nt(t) {
  return t.reduce((n, e) => n + e, 0) / t.length;
}
function qt(t) {
  const n = t.map((o) => o[1]).reduce((o, i) => o + i, 0);
  let e = 0;
  for (const o of t)
    e += o[0] * o[1] / n;
  return e;
}
function It(t) {
  return (t % 360 + 360) % 360;
}
function Kt(t, n) {
  const e = It(n);
  if (e === 0) return t;
  if (![90, 180, 270].includes(e)) throw new Error("只支持90度的旋转");
  const o = new Uint8ClampedArray(t.height * t.width * 4);
  for (let r = 0; r < t.height; r++)
    for (let u = 0; u < t.width; u++) {
      const x = r * t.width + u, h = e === 90 ? u * t.height + (t.height - r - 1) : e === 180 ? t.width - u - 1 + (t.height - r - 1) * t.width : (t.width - u - 1) * t.height + r;
      o.set(t.data.slice(x * 4, x * 4 + 4), h * 4);
    }
  const i = e === 90 || e === 270 ? t.height : t.width, c = e === 90 || e === 270 ? t.width : t.height;
  return bt(o, i, c);
}
function jn(t, n = "", e, o, i) {
  if (!H) return;
  const r = document.querySelector(`#${o}`).getContext("2d");
  r.beginPath(), r.strokeStyle = e, r.moveTo(t[0][0], t[0][1]), r.lineTo(t[1][0], t[1][1]), r.lineTo(t[2][0], t[2][1]), r.lineTo(t[3][0], t[3][1]), r.lineTo(t[0][0], t[0][1]), r.stroke(), r.strokeStyle = "black", r.strokeText(n, t[0][0], t[0][1]);
}
export {
  Yn as analyzeLayout,
  Hn as det,
  $n as init,
  pn as initDet,
  yn as initDocDirCls,
  In as initRec,
  jt as loadImg,
  Xn as ocr,
  qn as rec,
  Kn as recognize,
  Kt as rotateImg,
  bn as setOCREnv,
  wn as warpDet
};
