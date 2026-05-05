var Ut = Object.defineProperty;
var Qt = (t, n, o) => n in t ? Ut(t, n, { enumerable: !0, configurable: !0, writable: !0, value: o }) : t[n] = o;
var pt = (t, n, o) => Qt(t, typeof n != "symbol" ? n + "" : n, o);
let Vt = (t, n) => new OffscreenCanvas(t, n);
function ct(t, n) {
  return Vt(t, n);
}
function Zt(t) {
  Vt = t;
}
function Ot(t) {
  return t > 0 ? Math.floor(t) : Math.ceil(t);
}
function tt(t, n, o) {
  return Math.max(n, Math.min(t, o));
}
function Mt(t, n, o, s, a = "high") {
  return Jt(t, n, o, s, a).getImageData(0, 0, n, o);
}
function Jt(t, n, o, s, a = "high") {
  const r = H(t), u = ct(n, o).getContext("2d");
  return u.imageSmoothingEnabled = a !== !1, a && (u.imageSmoothingQuality = a), s === "fill" ? u.scale(Math.min(n / t.width, 1), Math.min(o / t.height, 1)) : u.scale(n / t.width, o / t.height), u.drawImage(r, 0, 0), u;
}
function H(t, n, o) {
  const s = ct(n || t.width, o || t.height);
  return s.getContext("2d").putImageData(t, 0, 0), s;
}
function kt(t, n, o) {
  const s = t.data, a = [], r = [], i = [];
  let u = 0, m = 0;
  for (let h = 0; h < s.length; h += 4)
    i[m] || (i[m] = []), r[m] || (r[m] = []), a[m] || (a[m] = []), a[m][u] = (s[h] / 255 - n[0]) / o[0], r[m][u] = (s[h + 1] / 255 - n[1]) / o[1], i[m][u] = (s[h + 2] / 255 - n[2]) / o[2], u++, u === t.width && (u = 0, m++);
  return [i, r, a];
}
class Ft {
  constructor(n) {
    pt(this, "tl", []);
    pt(this, "name");
    this.name = n;
  }
  l(n) {
    const o = performance.now();
    this.tl.push({ t: n, n: o });
    const s = [];
    for (let r = 1; r < this.tl.length; r++) {
      const i = this.tl[r].n - this.tl[r - 1].n, u = this.tl[r - 1].t, m = s.find((h) => h.n === u);
      m ? (m.c++, m.d += i) : s.push({ d: i, n: u, c: 1 });
    }
    const a = [];
    for (const r of s) {
      const i = r.c > 1 ? `${r.n}x${r.c}` : r.n;
      a.push(`${i} ${r.d}`);
    }
    a.push(this.tl.at(-1).t), console.log(`${this.name} ${s.map((r) => r.d).reduce((r, i) => r + i, 0)}ms: `, a.join(" "));
  }
}
async function tn(t, n, o, s, a, r) {
  const { transposedData: i, image: u } = nn(t, a, r), h = (await en(i, u, n, o))[0].data, l = h.reduce((p, x) => Math.max(p, x)), d = h.findIndex((p) => p === l);
  return s[d];
}
function nn(t, n, o) {
  const s = Mt(t, n, o);
  return { transposedData: kt(s, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]), image: s };
}
async function en(t, n, o, s) {
  const a = t.flat(Number.POSITIVE_INFINITY), r = Float32Array.from(a), i = new o.Tensor("float32", r, [1, 3, n.height, n.width]), u = {};
  u[s.inputNames[0]] = i;
  const m = await s.run(u);
  return Object.values(m);
}
function on(t) {
  if (t.length === 0) throw new Error("Empty contour");
  const n = sn([...t]);
  let o = Number.POSITIVE_INFINITY;
  const s = {
    center: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
    angle: 0
  };
  for (let a = 0; a < n.length; a++) {
    const r = n[a], i = n[(a + 1) % n.length], u = { x: i.x - r.x, y: i.y - r.y }, m = Math.hypot(u.x, u.y), [h, l] = [u.x / m, u.y / m];
    let d = Number.POSITIVE_INFINITY, p = Number.NEGATIVE_INFINITY, x = Number.POSITIVE_INFINITY, y = Number.NEGATIVE_INFINITY;
    for (const I of n) {
      const k = (I.x - r.x) * h + (I.y - r.y) * l;
      d = Math.min(d, k), p = Math.max(p, k);
      const S = -(I.x - r.x) * l + (I.y - r.y) * h;
      x = Math.min(x, S), y = Math.max(y, S);
    }
    const b = (p - d) * (y - x);
    if (b < o) {
      o = b;
      const I = (d + p) / 2, k = (x + y) / 2;
      s.center = {
        x: r.x + h * I - l * k,
        y: r.y + l * I + h * k
      }, s.size = {
        width: p - d,
        height: y - x
      }, s.angle = Math.atan2(l, h) * (180 / Math.PI);
    }
  }
  return s.size.width < s.size.height && ([s.size.width, s.size.height] = [s.size.height, s.size.width], s.angle += 90), s.angle = (s.angle % 180 + 180) % 180, s;
}
function sn(t) {
  t.sort((s, a) => s.x - a.x || s.y - a.y);
  const n = [];
  for (const s of t) {
    for (; n.length >= 2 && Rt(n[n.length - 2], n[n.length - 1], s) <= 0; )
      n.pop();
    n.push(s);
  }
  const o = [];
  for (let s = t.length - 1; s >= 0; s--) {
    const a = t[s];
    for (; o.length >= 2 && Rt(o[o.length - 2], o[o.length - 1], a) <= 0; )
      o.pop();
    o.push(a);
  }
  return n.slice(0, -1).concat(o.slice(0, -1));
}
function Rt(t, n, o) {
  return (n.x - t.x) * (o.y - t.y) - (n.y - t.y) * (o.x - t.x);
}
function cn(t, n, o = "CHAIN_APPROX_SIMPLE") {
  const s = t.length, a = s > 0 ? t[0].length : 0, r = Array.from({ length: s }, () => new Array(a).fill(!1));
  for (let i = 0; i < s; i++)
    for (let u = 0; u < a; u++)
      if (t[i][u] !== 0 && !r[i][u] && jt(t, u, i)) {
        const m = rn(t, r, u, i, o === "CHAIN_APPROX_SIMPLE");
        n.push(m);
      }
}
function jt(t, n, o) {
  return t[o][n] !== 0 && (o > 0 && t[o - 1][n] === 0 || o < t.length - 1 && t[o + 1][n] === 0 || n > 0 && t[o][n - 1] === 0 || n < t[0].length - 1 && t[o][n + 1] === 0);
}
function rn(t, n, o, s, a) {
  const r = [];
  let i = { x: o, y: s }, u = { x: o - 1, y: s };
  const m = /* @__PURE__ */ new Map(), h = /* @__PURE__ */ new Map();
  function l(b) {
    return b.x + b.y * t[0].length;
  }
  function d(b) {
    const I = Math.floor(b / t[0].length);
    return { x: b % t[0].length, y: I };
  }
  function p(b, I) {
    const k = l(b), S = l(I), D = It(I.x - b.x, I.y - b.y), E = It(b.x - I.x, b.y - I.y), A = m.get(k) ?? [], v = m.get(S) ?? [];
    m.set(k, [...A, D]), m.set(S, [...v, E]);
  }
  function x(b) {
    const I = l(i);
    u = i, i = { x: i.x + ft[b].dx, y: i.y + ft[b].dy }, p(u, i);
    const S = (h.get(I) ?? []).filter((D) => D !== b);
    S.length > 0 ? h.set(I, S) : h.delete(I);
  }
  m.set(l(i), [It(-1, 0)]);
  let y = 0;
  do {
    r.push(i), n[i.y][i.x] = !0;
    const b = ln(t, m, i);
    if (b.length === 0) {
      if (h.size === 0)
        break;
      const [I, k] = Array.from(h.entries()).at(0), S = k[0];
      i = d(I), x(S);
    }
    if (b.length >= 1) {
      const I = l(i);
      h.set(I, b);
      const k = b[0];
      x(k);
    }
    y++;
  } while (y < 1e9);
  return a ? an(r) : r;
}
const ft = [
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
  const a = n.get(s(o)) ?? [], r = [];
  for (const [i, { dx: u, dy: m }] of ft.entries()) {
    if (a.includes(i)) continue;
    const h = o.x + u, l = o.y + m;
    h >= 0 && h < t[0].length && l >= 0 && l < t.length && jt(t, h, l) && r.push(i);
  }
  return r;
}
function It(t, n) {
  const o = ft.findIndex(({ dx: s, dy: a }) => t === s && n === a);
  return o === -1 ? 0 : o;
}
function an(t) {
  if (t.length < 3) return [...t];
  const n = [t[0]];
  for (let o = 1; o < t.length - 1; o++) {
    const s = n[n.length - 1], a = t[o], r = t[o + 1];
    un(s, a, r) || n.push(a);
  }
  return n.push(t[t.length - 1]), n;
}
function un(t, n, o) {
  return (n.x - t.x) * (o.y - n.y) === (n.y - t.y) * (o.x - n.x);
}
const G = new Ft("t"), F = new Ft("af_det");
let L = !1, Ct = !1, q = null;
function st(t, n) {
  var s;
  const o = document.createElement("canvas");
  o.width = t.width, o.height = t.height, o.getContext("2d").drawImage(t, 0, 0), n && (o.id = n);
  try {
    (s = document == null ? void 0 : document.body) == null || s.append(o);
  } catch {
  }
}
let dt = (t, n, o) => new ImageData(t, n, o);
function O(...t) {
  Ct && console.log(...t);
}
function hn(...t) {
  Ct && console.log(t.map((n) => `%c${n}`).join(""), ...t.map((n) => `color: ${n}`));
}
async function Ln(t) {
  fn(t);
  const n = {
    det: "det" in t ? t.det : {
      input: t.detPath,
      ratio: t.detRatio,
      on: async (s) => {
        t.onDet && t.onDet(s), t.onProgress && t.onProgress("det", 1, 1);
      }
    },
    rec: "rec" in t ? t.rec : {
      input: t.recPath,
      decodeDic: t.dic,
      imgh: t.imgh,
      on: async (s, a, r) => {
        t.onRec && t.onRec(s, {
          text: a.map((i) => i[0].t).join(""),
          mean: a.map((i) => i[0].mean).reduce((i, u) => i + u, 0) / a.length
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
  return q = o, o;
}
function fn(t) {
  L = !!t.dev, Ct = L || !!t.log, L || (G.l = () => {
  }, F.l = () => {
  }), t.canvas && Zt(t.canvas), t.imageData && (dt = t.imageData);
}
async function dn(t) {
  let n;
  if (typeof window > "u") {
    const o = t;
    if (!o.data || !o.width || !o.height) throw new Error("invalid image data");
    return o;
  }
  if (typeof t == "string" ? (n = new Image(), n.src = t, await new Promise((o) => {
    n.onload = o;
  })) : (t instanceof ImageData, n = t), n instanceof HTMLImageElement) {
    const s = ct(n.naturalWidth, n.naturalHeight).getContext("2d");
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
function St() {
  try {
    ct(1, 1), dt(new Uint8ClampedArray(4), 1, 1);
  } catch (t) {
    throw console.log("nodejs need set canvas, please use setOCREnv to set canvas and imageData"), t;
  }
}
async function Vn(t) {
  if (!q) throw new Error("need init");
  return q.ocr(t);
}
async function Fn(t) {
  if (!q) throw new Error("need init");
  return q.det(t);
}
async function jn(t) {
  if (!q) throw new Error("need init");
  return q.rec(t);
}
async function xn(t) {
  St();
  const n = {
    ort: t.ort,
    ortOption: t.ortOption
  }, o = t.docCls ? await mn({ ...t.docCls, ...n }) : void 0, s = await gn({ ...t.det, ...n }), a = await bn({ ...t.rec, ...n });
  return {
    ocr: async (r) => {
      let i = await dn(r), u = 0;
      o && (u = await o.docCls(i), O("dir", u), i = Gt(i, 360 - u));
      const m = await s.det(i), h = await a.rec(m), l = _n(h, t.analyzeLayout);
      return O(h, l), G.l("end"), { src: h, ...l, docDir: u };
    },
    det: s.det,
    rec: a.rec,
    recRaw: a.rawRec
  };
}
function Nt(t, n, o) {
  return typeof n == "string" || n instanceof ArrayBuffer || n instanceof SharedArrayBuffer, t.InferenceSession.create(n, o);
}
async function mn(t) {
  const n = await Nt(t.ort, t.input, t.ortOption);
  return { docCls: async (s) => tn(s, t.ort, n, [0, 90, 180, 270], 224, 224) };
}
async function gn(t) {
  St();
  let n = 1;
  const o = await Nt(t.ort, t.input, t.ortOption);
  t.ratio !== void 0 && (n = t.ratio);
  async function s(a) {
    var x;
    const r = a;
    if (L) {
      const y = H(r);
      st(y);
    }
    G.l("pre_det");
    const { data: i, width: u, height: m } = In(r, n), { transposedData: h, image: l } = i;
    G.l("det");
    const d = await yn(h, l, o, t.ort);
    G.l("aft_det");
    const p = wn(
      { data: d.data, width: d.dims[3], height: d.dims[2] },
      u,
      m,
      r
    );
    return (x = t == null ? void 0 : t.on) == null || x.call(t, p), p;
  }
  return { det: s };
}
function Yn(t) {
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
async function bn(t) {
  var u;
  St();
  let n = 48;
  const o = await Nt(t.ort, t.input, t.ortOption), s = t.decodeDic.split(/\r\n|\r|\n/) || [];
  s.at(-1) === "" ? s[s.length - 1] = " " : s.push(" "), t.imgh && (n = t.imgh);
  const a = ((u = t.optimize) == null ? void 0 : u.space) === void 0 ? !0 : t.optimize.space;
  async function r(m, h) {
    var y, b, I;
    const l = [];
    G.l("bf_rec");
    const d = En(m, n), p = (h == null ? void 0 : h.topK) || ((y = t.multiChar) == null ? void 0 : y.topK) || 2, x = (h == null ? void 0 : h.threshold) || ((b = t.multiChar) == null ? void 0 : b.threshold) || 1e-5;
    for (const [k, S] of d.entries()) {
      const { b: D, imgH: E, imgW: A } = S, v = await pn(D, E, A, o, t.ort), W = An(v, s, { topK: p, threshold: x })[0];
      l.push({
        text: W,
        box: m[k].box,
        style: m[k].style
      }), (I = t == null ? void 0 : t.on) == null || I.call(t, k, W, m.length);
    }
    return G.l("rec_end"), l;
  }
  async function i(m) {
    const h = [], l = await r(m, { topK: 2, threshold: 1e-5 });
    for (const d of l) {
      const p = d.text.map((b) => a && b[0].t === "" && b[1].t === " " && b[1].mean > 1e-3 ? b[1] : b[0]), x = p.map((b) => b.t).join("").trim(), y = p.map((b) => b.mean).reduce((b, I) => b + I, 0) / p.length;
      y < 0.5 || h.push({
        text: x,
        mean: y,
        box: d.box,
        style: d.style
      });
    }
    return h;
  }
  return { rec: i, rawRec: r };
}
async function yn(t, n, o, s) {
  const a = Float32Array.from(t.flat(3)), r = new s.Tensor("float32", a, [1, 3, n.height, n.width]), i = {};
  return i[o.inputNames[0]] = r, (await o.run(i))[o.outputNames[0]];
}
async function pn(t, n, o, s, a) {
  const r = Float32Array.from(t.flat(3)), i = new a.Tensor("float32", r, [1, 3, n, o]), u = {};
  return u[s.inputNames[0]] = i, (await s.run(u))[s.outputNames[0]];
}
function In(t, n) {
  const o = Math.max(Math.round(t.height * n / 32) * 32, 32), s = Math.max(Math.round(t.width * n / 32) * 32, 32);
  if (L) {
    const i = H(t);
    st(i);
  }
  const a = Mt(t, s, o, "fill"), r = kt(a, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]);
  if (O(a), L) {
    const i = H(a);
    st(i);
  }
  return { data: { transposedData: r, image: a }, width: s, height: o };
}
function wn(t, n, o, s) {
  F.l("");
  const a = Math.min(s.width, n), r = Math.min(s.height, o), { data: i, width: u, height: m } = t, h = new Uint8Array(u * m);
  for (let x = 0; x < i.length; x++) {
    const y = i[x] > 0.3 ? 255 : 0;
    h[x] = y;
  }
  if (L) {
    const x = new Uint8ClampedArray(u * m * 4);
    for (let I = 0; I < i.length; I++) {
      const k = I * 4, S = i[I] > 0.3 ? 255 : 0;
      x[k] = x[k + 1] = x[k + 2] = S, x[k + 3] = 255, h[I] = S;
    }
    const y = dt(x, u, m), b = H(y);
    st(b, "det_ru");
  }
  F.l("edge");
  const l = [], d = [];
  for (let x = 0; x < m; x++)
    d.push(Array.from(h.slice(x * u, x * u + u)));
  const p = [];
  if (cn(d, p), L) {
    const x = document.querySelector("#det_ru").getContext("2d");
    for (const y of p) {
      x.moveTo(y[0].x, y[0].y);
      for (const b of y)
        x.lineTo(b.x, b.y);
      x.strokeStyle = "red", x.closePath(), x.stroke();
    }
  }
  for (let x = 0; x < p.length; x++) {
    F.l("get_box");
    const y = 3, b = p[x], { points: I, sside: k } = Nn(b);
    if (k < y) continue;
    const S = Cn(I), D = S.points;
    if (S.sside < y + 2)
      continue;
    const E = s.width / a, A = s.height / r;
    for (let z = 0; z < D.length; z++)
      D[z][0] *= E, D[z][1] *= A;
    F.l("order");
    const v = Bn(D);
    for (const z of v)
      z[0] = tt(Math.round(z[0]), 0, s.width), z[1] = tt(Math.round(z[1]), 0, s.height);
    const W = Ot(Lt(v[0], v[1])), xt = Ot(Lt(v[0], v[3]));
    if (W <= 3 || xt <= 3) continue;
    zn(D, "", "red", "det_ru"), F.l("crop");
    const $ = Dn(s, D);
    F.l("match best");
    const { bg: _, text: K } = vn($), rt = Pn(D, $, K);
    l.push({ box: rt, img: $, style: { bg: _, text: K } });
  }
  return F.l("e"), O(l), l;
}
function Mn(t) {
  let n = -1;
  const o = t.length;
  let s, a = t[o - 1], r = 0;
  for (; ++n < o; )
    s = a, a = t[n], r += s[1] * a[0] - s[0] * a[1];
  return r / 2;
}
function kn(t) {
  let n = -1;
  const o = t.length;
  let s = t[o - 1], a, r, i = s[0], u = s[1], m = 0;
  for (; ++n < o; )
    a = i, r = u, s = t[n], i = s[0], u = s[1], a -= i, r -= u, m += Math.hypot(a, r);
  return m;
}
function Cn(t) {
  const o = Math.abs(Mn(t)), s = kn(t), a = o * 1.5 / s, r = [];
  for (const [h, l] of t.entries()) {
    const d = t.at((h - 1) % 4), p = t.at((h + 1) % 4), x = l[0] - d[0], y = l[1] - d[1], b = Math.sqrt(x ** 2 + y ** 2), I = x / b * a, k = y / b * a, S = l[0] - p[0], D = l[1] - p[1], E = Math.sqrt(S ** 2 + D ** 2), A = S / E * a, v = D / E * a;
    r.push([l[0] + I + A, l[1] + k + v]);
  }
  const i = [r[0][0] - r[1][0], r[0][1] - r[1][1]], u = [r[2][0] - r[1][0], r[2][1] - r[1][1]], m = i[0] * u[1] - i[1] * u[0];
  return { points: r, sside: Math.abs(m) };
}
function Sn(t, n, o) {
  const s = n.width, a = n.height, r = o * Math.PI / 180, i = Math.cos(r), u = Math.sin(r), m = t.x, h = t.y, l = s * 0.5, d = a * 0.5, p = [], x = m - l * i + d * u, y = h - l * u - d * i;
  p.push([x, y]);
  const b = m + l * i + d * u, I = h + l * u - d * i;
  p.push([b, I]);
  const k = m + l * i - d * u, S = h + l * u + d * i;
  p.push([k, S]);
  const D = m - l * i - d * u, E = h - l * u + d * i;
  return p.push([D, E]), p;
}
function Nn(t) {
  const o = on(t), s = Array.from(Sn(o.center, o.size, o.angle)).sort(
    (l, d) => l[0] - d[0]
  );
  let a = 0, r = 1, i = 2, u = 3;
  s[1][1] > s[0][1] ? (a = 0, u = 1) : (a = 1, u = 0), s[3][1] > s[2][1] ? (r = 2, i = 3) : (r = 3, i = 2);
  const m = [s[a], s[r], s[i], s[u]], h = Math.min(o.size.height, o.size.width);
  return { points: m, sside: h };
}
function Lt(t, n) {
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
  const s = t.filter((r) => r !== n[0] && r !== n[2]), a = s[1].map((r, i) => r - s[0][i]);
  return n[1] = s[a.indexOf(Math.min(...a))], n[3] = s[a.indexOf(Math.max(...a))], n;
}
function Dn(t, n) {
  const [o, s, a, r] = n.map((v) => ({ x: v[0], y: v[1] })), i = Math.sqrt((s.x - o.x) ** 2 + (s.y - o.y) ** 2), u = Math.sqrt((r.x - o.x) ** 2 + (r.y - o.y) ** 2), m = s.x - o.x, h = s.y - o.y, l = r.x - o.x, d = r.y - o.y, p = m * d - l * h;
  if (p === 0) throw new Error("点共线，无法形成矩形");
  const x = i * d / p, y = -l * i / p, b = -u * h / p, I = m * u / p, k = -x * o.x - y * o.y, S = -b * o.x - I * o.y, D = H(t), E = ct(Math.ceil(i), Math.ceil(u)), A = E.getContext("2d");
  return A.setTransform(x, b, y, I, k, S), A.drawImage(D, 0, 0), A.resetTransform(), A.getImageData(0, 0, E.width, E.height);
}
function vn(t) {
  var m, h;
  const n = /* @__PURE__ */ new Map(), o = t.data;
  for (let l = 0; l < o.length; l += 4) {
    if (l / 4 % t.width > t.height * 4) continue;
    const p = o[l], x = o[l + 1], y = o[l + 2], b = [p, x, y].join(",");
    n.set(b, (n.get(b) || 0) + 1);
  }
  const s = Tn(n, 20).map((l) => ({
    el: l.el.split(",").map(Number),
    count: l.count
  })), a = ((m = s.at(0)) == null ? void 0 : m.el) || [255, 255, 255], r = ((h = s.at(1)) == null ? void 0 : h.el) || [0, 0, 0];
  let i = r;
  const u = 100;
  if (ut(r, a) < u) {
    const l = s.slice(1).filter((d) => ut(d.el, a) > 50);
    l.length > 0 && (i = [0, 1, 2].map(
      (d) => Math.round(Yt(l.map((p) => [p.el[d], p.count])))
    )), (l.length === 0 || ut(i, a) < u) && (i = a.map((d) => 255 - d)), hn(`rgb(${i.join(",")})`);
  }
  return {
    bg: a,
    text: i,
    textEdge: r
  };
}
function ut(t, n) {
  const o = t, s = n;
  return Math.sqrt((o[0] - s[0]) ** 2 + (o[1] - s[1]) ** 2 + (o[2] - s[2]) ** 2);
}
function Tn(t, n = 1) {
  let o = [];
  return t.forEach((s, a) => {
    o.length === 0 ? o.push({ el: a, count: s }) : (o.length < n ? o.push({ el: a, count: s }) : o.find((r) => r.count <= s) && o.push({ el: a, count: s }), o.sort((r, i) => i.count - r.count), o.length > n && (o = o.slice(0, n)));
  }), o;
}
function Pn(t, n, o) {
  let s = 0, a = n.height, r = 0, i = n.width;
  function u(x) {
    return ut(x, o) < 200;
  }
  t: for (let x = s; x < n.height; x++)
    for (let y = 0; y < n.width; y++) {
      const b = at(n, y, x);
      if (u(b)) {
        s = x;
        break t;
      }
    }
  t: for (let x = a - 1; x >= 0; x--)
    for (let y = 0; y < n.width; y++) {
      const b = at(n, y, x);
      if (u(b)) {
        a = x;
        break t;
      }
    }
  t: for (let x = r; x < n.width; x++)
    for (let y = s; y <= a; y++) {
      const b = at(n, x, y);
      if (u(b)) {
        r = x;
        break t;
      }
    }
  t: for (let x = i - 1; x >= 0; x--)
    for (let y = s; y <= a; y++) {
      const b = at(n, x, y);
      if (u(b)) {
        i = x;
        break t;
      }
    }
  const m = tt(s - 1, 0, 4), h = tt(n.height - a - 1, 0, 4), l = tt(r - 1, 0, 4), d = tt(n.width - i - 1, 0, 4);
  return [
    [t[0][0] + l, t[0][1] + m],
    [t[1][0] - d, t[1][1] + m],
    [t[2][0] - d, t[2][1] - h],
    [t[3][0] + l, t[3][1] - h]
  ];
}
function at(t, n, o) {
  const s = (o * t.width + n) * 4;
  return Array.from(t.data.slice(s, s + 4));
}
function En(t, n) {
  const o = [];
  function s(a) {
    const r = Math.floor(n * (a.width / a.height)), i = Mt(a, r, n, void 0, !1);
    return L && st(H(i, r, n)), { data: i, w: r, h: n };
  }
  for (const a of t) {
    let r = a.img;
    r.width < r.height && (r = Gt(r, -90));
    const i = s(r);
    o.push({ b: kt(i.data, [0.5, 0.5, 0.5], [0.5, 0.5, 0.5]), imgH: i.h, imgW: i.w });
  }
  return O(o), o;
}
function An(t, n, o) {
  const s = t.dims[2], a = [];
  let r = t.dims[0] - 1;
  const i = o.topK, u = o.threshold;
  function m(l) {
    return n.at(l - 1) ?? "";
  }
  for (let l = 0; l < t.data.length; l += s * t.dims[1]) {
    const d = [];
    for (let p = l; p < l + s * t.dims[1]; p += s) {
      const x = t.data.slice(p, p + s), y = [];
      for (let b = 0; b < x.length; b++) {
        const I = x[b];
        if (!(I < u)) {
          if (!(y.length === i && I <= y.at(-1).v)) {
            const k = y.findIndex((S) => S.v > I);
            k === -1 ? y.unshift({ t: b, v: I }) : y.splice(k + 1, 0, { t: b, v: I });
          }
          y.length > i && y.pop();
        }
      }
      d.push(y);
    }
    a[r] = h(d), r--;
  }
  function h(l) {
    const d = [];
    for (let p = 0; p < l.length; p++)
      l[p][0].t !== 0 && (p > 0 && l[p - 1][0].t === l[p][0].t || d.push(l[p].map((x) => ({ t: m(x.t), mean: x.v }))));
    return d;
  }
  return a;
}
function _n(t, n) {
  var _t;
  O(t);
  const o = (n == null ? void 0 : n.docDirs) ?? [
    { block: "tb", inline: "lr" },
    { block: "rl", inline: "tb" }
  ], s = { block: "tb", inline: "lr" }, a = {
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
  function m(e) {
    const c = l.center(e);
    for (let f = i.length - 1; f >= 0; f--) {
      const w = i[f].box;
      if (c[0] >= w[0][0] && c[0] <= w[1][0] && c[1] >= w[0][1] && c[1] <= w[3][1])
        return f;
    }
    return u;
  }
  const h = {
    center: (e, c) => [(e[0] + c[0]) / 2, (e[1] + c[1]) / 2],
    disByV: (e, c, f) => Math.abs(f === "block" ? d.dotMup(e, r.block) - d.dotMup(c, r.block) : d.dotMup(e, r.inline) - d.dotMup(c, r.inline)),
    compare: (e, c, f) => f === "block" ? d.dotMup(e, r.block) - d.dotMup(c, r.block) : d.dotMup(e, r.inline) - d.dotMup(c, r.inline),
    toInline: (e) => d.dotMup(e, r.inline),
    toBlock: (e) => d.dotMup(e, r.block)
  }, l = {
    inlineStart: (e) => h.center(e[0], e[3]),
    inlineEnd: (e) => h.center(e[1], e[2]),
    blockStart: (e) => h.center(e[0], e[1]),
    blockEnd: (e) => h.center(e[2], e[3]),
    inlineSize: (e) => e[1][0] - e[0][0],
    blockSize: (e) => e[3][1] - e[0][1],
    inlineStartDis: (e, c) => h.disByV(e[0], c[0], "inline"),
    inlineEndDis: (e, c) => h.disByV(e[1], c[1], "inline"),
    blockGap: (e, c) => h.disByV(e[0], c[3], "block"),
    inlineCenter: (e) => (e[2][0] + e[0][0]) / 2,
    blockCenter: (e) => (e[2][1] + e[0][1]) / 2,
    inlineStartCenter: (e) => l.inlineStart(e),
    center: (e) => h.center(e[0], e[2])
  }, d = {
    fromPonts: (e, c) => [e[0] - c[0], e[1] - c[1]],
    dotMup: (e, c) => e[0] * c[0] + e[1] * c[1],
    numMup: (e, c) => [e[0] * c, e[1] * c],
    add: (e, c) => [e[0] + c[0], e[1] + c[1]]
  };
  function p(e) {
    let c = 0, f = 0;
    const g = [];
    for (const [w, M] of e.entries()) {
      const C = M > 180 ? M - 180 : M, B = C - 180, P = w === 0 ? C : Math.abs(B - c) < Math.abs(C - c) ? B : C;
      g.push(P), c = (c * f + P) / (f + 1), f++;
    }
    return { av: c, l: g };
  }
  function x(e, c) {
    return Math.abs(e - c) < 45 || Math.abs(e - (c - 180)) < 45 || Math.abs(e - 180 - c) < 45;
  }
  function y(e) {
    e.sort((f, g) => f - g);
    const c = Math.floor(e.length / 2);
    return e.length % 2 === 0 ? (e[c - 1] + e[c]) / 2 : e[c];
  }
  function b(e) {
    return e === "lr" || e === "rl" ? "x" : "y";
  }
  function I(e, c) {
    let f = Number.POSITIVE_INFINITY, g = -1;
    for (let w = 0; w < e.length; w++) {
      const M = c(e[w]);
      M < f && (f = M, g = w);
    }
    return e[g];
  }
  const k = {
    lr: [1, 0],
    rl: [-1, 0],
    tb: [0, 1],
    bt: [0, -1]
  };
  function S(e, c) {
    const f = k[e.inline], g = k[e.block], w = k[c.inline], M = k[c.block], C = [d.dotMup(w, f), d.dotMup(w, g)], B = [d.dotMup(M, f), d.dotMup(M, g)];
    return (P) => [d.dotMup(P, C), d.dotMup(P, B)];
  }
  function D(e, c) {
    const f = S(e, c);
    return {
      b: (g) => {
        for (const w of g) {
          const [M, C] = f(w);
          w[0] = M, w[1] = C;
        }
      },
      p: f
    };
  }
  function E(e) {
    return (c) => {
      const f = [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0]
      ];
      for (let g = 0; g < e.length; g++)
        f[g] = c[e[g]];
      return f;
    };
  }
  function A(e, c) {
    return Math.sqrt((e[0] - c[0]) ** 2 + (e[1] - c[1]) ** 2);
  }
  function v(e) {
    const c = e.flatMap((T) => T.map((N) => N)), f = Math.min(...c.map((T) => d.dotMup(T, r.inline))), g = Math.max(...c.map((T) => d.dotMup(T, r.inline))), w = Math.min(...c.map((T) => d.dotMup(T, r.block))), M = Math.max(...c.map((T) => d.dotMup(T, r.block))), C = d.add(d.numMup(r.inline, f), d.numMup(r.block, w)), B = d.numMup(r.inline, g - f), P = d.numMup(r.block, M - w);
    return [C, d.add(C, B), d.add(d.add(C, B), P), d.add(C, P)];
  }
  function W(e) {
    let c = null, f = Number.POSITIVE_INFINITY;
    for (const P in j) {
      const T = j[P].src.at(-1);
      if (!T) continue;
      const N = A(e.box[0], T.box[0]);
      N < f && (c = Number(P), f = N);
    }
    if (c === null) {
      j.push({ src: [e] });
      return;
    }
    const g = j[c].src.at(-1), w = l.inlineSize(e.box), M = l.inlineSize(g.box), C = Math.min(w, M), B = l.blockSize(e.box);
    if (
      // 左右至少有一边是相近的，中心距离要相近
      // 行之间也不要离太远
      !((l.inlineStartDis(e.box, g.box) < 3 * B || l.inlineEndDis(e.box, g.box) < 3 * B || h.disByV(l.center(e.box), l.center(g.box), "inline") < C * 0.4) && l.blockGap(e.box, g.box) < B * 1.1)
    ) {
      j.push({ src: [e] });
      return;
    }
    j[c].src.push(e);
  }
  function xt(e) {
    var w, M;
    const c = new RegExp("\\p{Ideographic}", "u"), f = /[。，！？；：“”‘’《》、【】（）…—]/, g = {
      box: v(e.map((C) => C.box)),
      text: "",
      mean: Yt(e.map((C) => [C.mean, C.text.length])),
      style: e[0].style
    };
    for (const C of e) {
      const B = g.text.at(-1);
      B && (!B.match(c) && !B.match(f) || !((w = C.text.at(0)) != null && w.match(c)) && !((M = C.text.at(0)) != null && M.match(f))) && (g.text += " "), g.text += C.text;
    }
    return g;
  }
  function $(e) {
    e.sort((c, f) => {
      const g = c.src.at(0) ? l.blockSize(c.src.at(0).box) : 2;
      return h.disByV(l.blockStart(c.outerBox), l.blockStart(f.outerBox), "block") < g ? h.compare(l.inlineStart(c.outerBox), l.inlineStart(f.outerBox), "inline") : h.compare(l.blockStart(c.outerBox), l.blockStart(f.outerBox), "block");
    });
  }
  if (n != null && n.columnsTip)
    for (const e of n.columnsTip) i.push(structuredClone(e));
  const _ = {
    inline: 0,
    block: 90
  }, K = t.map((e) => {
    const c = e.box, f = c[1][0] - c[0][0], g = c[3][1] - c[0][1];
    let w = { x: 0, y: 0 };
    if (f < g) {
      const C = d.fromPonts(h.center(c[2], c[3]), h.center(c[0], c[1]));
      w = { x: C[0], y: C[1] };
    } else {
      const C = d.fromPonts(h.center(c[1], c[2]), h.center(c[0], c[3]));
      w = { x: C[0], y: C[1] };
    }
    return ht(Math.atan2(w.y, w.x) * (180 / Math.PI));
  }), rt = p(K), z = K.filter((e) => x(e, rt.av)), Bt = y(z), Ht = y(z.map((e) => Math.abs(e - Bt))), Dt = z.filter((e) => Math.abs((e - Bt) / (Ht * 1.4826)) < 2), V = ht(p(Dt).av);
  O("dir0", K, rt, z, Dt, V);
  const X = ht(V + 90), qt = x(V, 0) ? "x" : "y", Wt = x(X, 90) ? "y" : "x", mt = o.find((e) => qt === b(e.inline) && Wt === b(e.block)) ?? o.at(0);
  mt && (s.block = mt.block, s.inline = mt.inline);
  const vt = {
    lr: 0,
    rl: 180,
    tb: 90,
    bt: 270
  };
  _.inline = I(
    [V, V - 360, V - 180, V + 180],
    (e) => Math.abs(e - vt[s.inline])
  ), _.block = I(
    [X, X - 360, X - 180, X + 180],
    (e) => Math.abs(e - vt[s.block])
  ), a.inline = [Math.cos(_.inline * (Math.PI / 180)), Math.sin(_.inline * (Math.PI / 180))], a.block = [Math.cos(_.block * (Math.PI / 180)), Math.sin(_.block * (Math.PI / 180))], O("dir", s, _, a, V, X);
  const Tt = [
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
  ), it = D({ inline: "lr", block: "tb" }, s), Pt = E(Tt), $t = t.map((e) => {
    const c = Pt(e.box);
    return it.b(c), {
      ...e,
      box: c
    };
  });
  for (const e of i)
    e.box = Pt(e.box), it.b(e.box);
  r.inline = it.p(a.inline), r.block = it.p(a.block), O("相对坐标系", r);
  const Kt = $t.sort((e, c) => h.compare(l.blockStart(e.box), l.blockStart(c.box), "block")), U = [];
  for (const e of Kt) {
    const c = m(e.box), f = (_t = U.at(-1)) == null ? void 0 : _t.line.at(-1);
    if (!f) {
      U.push({ line: [{ src: e, colId: c }] });
      continue;
    }
    const g = l.center(e.box), w = l.center(f.src.box);
    if (h.disByV(g, w, "block") < 0.5 * l.blockSize(e.box)) {
      const M = U.at(-1);
      M ? M.line.push({ src: e, colId: c }) : U.push({ line: [{ src: e, colId: c }] });
    } else
      U.push({ line: [{ src: e, colId: c }] });
  }
  const lt = [];
  for (const e of U) {
    if (e.line.length === 1) {
      lt.push({ src: e.line[0].src, colId: e.line[0].colId });
      continue;
    }
    const c = wt(e.line.map((g) => l.blockSize(g.src.box)));
    e.line.sort((g, w) => h.compare(l.inlineStart(g.src.box), l.inlineStart(w.src.box), "inline"));
    let f = e.line.at(0);
    for (const g of e.line.slice(1)) {
      const w = l.inlineEnd(f.src.box), M = l.inlineStart(g.src.box);
      i[g.colId].type === "table" || g.colId !== f.colId || h.toInline(M) - h.toInline(w) > c ? (lt.push({ ...f }), f = g) : (f.src.text += g.src.text, f.src.mean = (f.src.mean + g.src.mean) / 2, f.src.box = v([f.src.box, g.src.box]));
    }
    lt.push({ ...f });
  }
  const j = [], gt = [], nt = [];
  for (const e of lt)
    if (e.colId === u)
      gt.push(e);
    else {
      const c = nt.find((f) => f.colId === e.colId);
      c ? c.src.push(e.src) : nt.push({ src: [e.src], type: i[e.colId].type, colId: e.colId });
    }
  gt.sort((e, c) => h.compare(l.blockStart(e.src.box), l.blockStart(c.src.box), "block"));
  for (const e of gt)
    W(e.src);
  const et = [];
  for (const [e, c] of j.entries()) {
    const f = c.src, g = v(f.map((B) => B.box)), w = l.blockCenter(g), M = l.inlineSize(g);
    if (e === 0) {
      et.push({ smallCol: [{ src: f, outerBox: g, x: w, w: M }] });
      continue;
    }
    const C = et.find((B) => {
      const P = B.smallCol.at(-1), T = l.blockSize(f.at(0).box);
      return l.inlineStartDis(P.outerBox, g) < 3 * T && l.inlineEndDis(P.outerBox, g) < 3 * T && l.blockGap(g, P.outerBox) < T * 2.1;
    });
    C ? C.smallCol.push({ src: f, outerBox: g, x: w, w: M }) : et.push({ smallCol: [{ src: f, outerBox: g, x: w, w: M }] });
  }
  for (const e of et)
    e.smallCol.sort((c, f) => h.compare(l.blockStart(c.outerBox), l.blockStart(f.outerBox), "block"));
  for (const e of nt)
    e.src.sort((c, f) => h.compare(l.blockStart(c.box), l.blockStart(f.box), "block"));
  const bt = [];
  for (const e of et) {
    const c = v(e.smallCol.map((g) => g.outerBox)), f = e.smallCol.flatMap((g) => g.src);
    bt.push({ src: f, outerBox: c, type: "none" });
  }
  $(bt);
  const ot = [];
  for (const e of bt) {
    const c = ot.at(-1);
    if (!c) {
      ot.push(e);
      continue;
    }
    if (c.type !== "none") {
      ot.push(e);
      continue;
    }
    const f = c.outerBox, g = l.blockSize(e.src[0].box);
    c.src.length === 1 && l.inlineStartDis(f, e.outerBox) < 3 * g || // 标题
    e.src.length === 1 && l.inlineStartDis(f, e.outerBox) < 3 * g || // 末尾
    l.inlineStartDis(f, e.outerBox) < 3 * g && l.inlineEndDis(f, e.outerBox) < 3 * g ? (c.src.push(...e.src), c.outerBox = v(c.src.map((w) => w.box))) : ot.push(e);
  }
  let yt = !1;
  const Y = [];
  for (const e of ot) {
    const c = Y.at(-1), f = { ...e, reCal: !1 };
    if (!c) {
      Y.push(f);
      continue;
    }
    const g = l.blockSize(f.src.at(0).box);
    h.compare(l.blockEnd(f.outerBox), l.blockEnd(c.outerBox), "block") < 0 && (l.inlineStartDis(c.outerBox, f.outerBox) < 3 * g || l.inlineEndDis(c.outerBox, f.outerBox) < 3 * g) ? (c.src.push(...f.src), c.reCal = !0, yt = !0) : Y.push(f);
  }
  for (const e of Y)
    e.reCal && (e.src.sort((c, f) => h.compare(l.blockStart(c.box), l.blockStart(f.box), "block")), e.outerBox = v(e.src.map((c) => c.box)));
  nt.length && (yt = !0);
  for (const e of nt) {
    const c = v(e.src.map((g) => g.box)), f = e.src;
    Y.push({ src: f, outerBox: c, type: e.type, reCal: !1 });
  }
  yt && $(Y);
  const Et = D(s, { inline: "lr", block: "tb" }), At = Y.map((e) => {
    const c = e.src, f = [];
    if (e.type === "auto" || e.type === "none") {
      const M = {};
      for (let N = 1; N < c.length; N++) {
        const R = c[N - 1].box, Z = c[N].box, J = h.disByV(l.center(Z), l.center(R), "block");
        M[J] || (M[J] = 0), M[J]++;
      }
      const C = wt(c.map((N) => l.blockSize(N.box))), B = [[]];
      for (const N of Object.keys(M).map((R) => Number(R)).sort()) {
        const R = B.at(-1), Z = R.at(-1);
        Z !== void 0 ? Math.abs(Z - N) < C * 0.5 ? R.push(N) : B.push([]) : R.push(N);
      }
      const P = B.map((N) => wt(N)).sort((N, R) => N - R).at(0) || 0;
      O("d", M, B, P), f.push([c[0]]);
      let T = c[0];
      for (let N = 1; N < c.length; N++) {
        const R = d.add(
          d.add(l.inlineStartCenter(T.box), d.numMup(r.block, P)),
          d.numMup(r.inline, -l.inlineStartDis(T.box, e.outerBox))
        ), Z = l.inlineStartCenter(c[N].box), J = l.blockSize(c[N].box);
        if (l.inlineEndDis(T.box, e.outerBox) > 2 * J || A(R, Z) > J * 0.5)
          f.push([c[N]]);
        else {
          const zt = f.at(-1);
          zt ? zt.push(c[N]) : f.push([c[N]]);
        }
        T = c[N];
      }
    } else (e.type === "table" || e.type === "raw" || e.type === "raw-blank") && f.push(c);
    for (const M of c) Et.b(M.box);
    Et.b(e.outerBox);
    const g = [];
    for (const [M, C] of Tt.entries())
      g[C] = M;
    const w = E(g);
    for (const M of c)
      M.box = w(M.box);
    return e.outerBox = w(e.outerBox), O(f), {
      src: c,
      outerBox: e.outerBox,
      parragraphs: f.map((M) => ({ src: M, parse: xt(M) }))
    };
  }), Xt = At.flatMap((e) => e.parragraphs.map((c) => c.parse));
  let Q = 0;
  return s.inline === "lr" && (Q = _.inline), s.inline === "rl" && (Q = _.inline - 180), s.block === "lr" && (Q = _.block), s.block === "rl" && (Q = _.block - 180), O("angle", Q), {
    columns: At,
    parragraphs: Xt,
    readingDir: s,
    angle: { reading: _, angle: Q }
  };
}
function wt(t) {
  return t.reduce((n, o) => n + o, 0) / t.length;
}
function Yt(t) {
  const n = t.map((s) => s[1]).reduce((s, a) => s + a, 0);
  let o = 0;
  for (const s of t)
    o += s[0] * s[1] / n;
  return o;
}
function ht(t) {
  return (t % 360 + 360) % 360;
}
function Gt(t, n) {
  const o = ht(n);
  if (o === 0) return t;
  if (![90, 180, 270].includes(o)) throw new Error("只支持90度的旋转");
  const s = new Uint8ClampedArray(t.height * t.width * 4);
  for (let i = 0; i < t.height; i++)
    for (let u = 0; u < t.width; u++) {
      const m = i * t.width + u, h = o === 90 ? u * t.height + (t.height - i - 1) : o === 180 ? t.width - u - 1 + (t.height - i - 1) * t.width : (t.width - u - 1) * t.height + i;
      s.set(t.data.slice(m * 4, m * 4 + 4), h * 4);
    }
  const a = o === 90 || o === 270 ? t.height : t.width, r = o === 90 || o === 270 ? t.width : t.height;
  return dt(s, a, r);
}
function zn(t, n = "", o, s, a) {
  if (!L) return;
  const i = document.querySelector(`#${s}`).getContext("2d");
  i.beginPath(), i.strokeStyle = o, i.moveTo(t[0][0], t[0][1]), i.lineTo(t[1][0], t[1][1]), i.lineTo(t[2][0], t[2][1]), i.lineTo(t[3][0], t[3][1]), i.lineTo(t[0][0], t[0][1]), i.stroke(), i.strokeStyle = "black", i.strokeText(n, t[0][0], t[0][1]);
}
export {
  _n as analyzeLayout,
  Fn as det,
  Ln as init,
  gn as initDet,
  mn as initDocDirCls,
  bn as initRec,
  dn as loadImg,
  Vn as ocr,
  jn as rec,
  Gt as rotateImg,
  fn as setOCREnv,
  Yn as warpDet
};
