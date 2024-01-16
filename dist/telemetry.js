"use strict";
/* Copyright © 2021-2024 Richard Rodger, MIT License. */
Object.defineProperty(exports, "__esModule", { value: true });
const { Stats } = require('fast-stats');
// Default options.
const defaults = {
    debug: false,
    active: false,
};
function preload(plugin) {
    var _a;
    var _b;
    const seneca = this;
    const root = seneca.root;
    const options = plugin.options;
    const tdata = (_a = (_b = root.context)._sys_Telemetry) !== null && _a !== void 0 ? _a : (_b._sys_Telemetry = {
        active: options.active,
        msg: {},
        trace: {},
        runs: {},
    });
    root.order.inward.add((spec) => {
        var _a, _b, _c, _d, _e, _f;
        var _g, _h, _j, _k, _l, _m, _o;
        if (!tdata.active)
            return null;
        const actdef = spec.ctx.actdef;
        const meta = spec.data.meta;
        if (actdef) {
            const when = Date.now();
            // console.log('IN', actdef, meta)
            const pat = actdef.pattern;
            const act = actdef.id;
            (_a = (_g = tdata.msg)[pat]) !== null && _a !== void 0 ? _a : (_g[pat] = {});
            const msgm = ((_b = (_h = tdata.msg[pat])[act]) !== null && _b !== void 0 ? _b : (_h[act] = { c: [], d: [], m: [] }));
            msgm.c.push(when);
            let index = msgm.c.length - 1;
            msgm.m[index] = meta.mi;
            (_c = (_j = meta.custom)._sys_Telemetry_index) !== null && _c !== void 0 ? _c : (_j._sys_Telemetry_index = {});
            meta.custom._sys_Telemetry_index[meta.mi] = index;
            const tracem = ((_d = (_k = tdata.trace)[_l = meta.tx]) !== null && _d !== void 0 ? _d : (_k[_l] = []));
            (_e = (_m = tdata.runs)[pat]) !== null && _e !== void 0 ? _e : (_m[pat] = {});
            const runsm = ((_f = (_o = tdata.runs[pat])[act]) !== null && _f !== void 0 ? _f : (_o[act] = []));
            tracem.push({ k: 1, m: meta.mi, p: pat, a: act, t: when });
            runsm.push(meta.tx);
            // console.log('IN', pat, meta.custom)
        }
    }, { after: 'announce' });
    root.order.outward.add((spec) => {
        var _a, _b;
        if (!tdata.active)
            return null;
        const actdef = spec.ctx.actdef;
        const meta = spec.data.meta;
        if (actdef) {
            const when = Date.now();
            // console.log('OUT', actdef.pattern)
            const pat = actdef.pattern;
            const act = actdef.id;
            const msgm = (_a = tdata.msg[pat]) === null || _a === void 0 ? void 0 : _a[act];
            const index = (_b = meta.custom) === null || _b === void 0 ? void 0 : _b._sys_Telemetry_index[meta.mi];
            if (msgm && null != index) {
                msgm.d[index] = Date.now() - msgm.c[index];
            }
            const tracem = tdata.trace[meta.tx];
            if (tracem) {
                tracem.push({ k: 2, m: meta.mi, p: pat, a: act, t: when, e: meta.error ? 1 : 0 });
            }
        }
    }, { before: 'make_error' });
}
function Telemetry(options) {
    let seneca = this;
    const root = seneca.root;
    const tdata = root.context._sys_Telemetry;
    seneca
        .fix('sys:telemetry')
        .message('set:active', { active: Boolean }, async function setActive(msg) {
        const tdata = root.context._sys_Telemetry;
        tdata.active = msg.active;
    })
        .message('get:msg', { pat: String }, async function getMsg(msg) {
        return {
            pat: msg.pat,
            msg: tdata.msg[msg.pat],
            aggd: Object
                .entries(tdata.msg[msg.pat])
                .map((n) => (n[1] = n[1].d, n))
                .reduce((g, a) => ((g[a[0]] = stats(a[1])), g), {}),
            trace: Object
                .entries((tdata.runs[msg.pat] || []))
                .map((an) => an[1].map((tx) => ({
                a: an[0],
                tx,
                t: tdata.trace[tx].map((n) => {
                    var _a;
                    return ({
                        ...n,
                        d: ((_a = n.d) !== null && _a !== void 0 ? _a : (n.d = tdata.msg[n.p][n.a].d[tdata.msg[n.p][n.a].m.indexOf(n.m)]))
                    });
                })
            })))
        };
    });
    return {
        exports: {
            raw: () => tdata
        }
    };
}
function stats(d) {
    let s = new Stats().push(d);
    let r = s.range();
    return { mn: s.amean(), md: s.median(), lo: r[0], hi: r[1] };
}
Object.assign(Telemetry, { defaults, preload });
// Prevent name mangling
Object.defineProperty(Telemetry, 'name', { value: 'Telemetry' });
exports.default = Telemetry;
if ('undefined' !== typeof module) {
    module.exports = Telemetry;
}
//# sourceMappingURL=telemetry.js.map