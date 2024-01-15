"use strict";
/* Copyright © 2021-2024 Richard Rodger, MIT License. */
Object.defineProperty(exports, "__esModule", { value: true });
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
        msg: {},
        trace: {},
        runs: {},
    });
    if (options.active) {
        root.order.inward.add((spec) => {
            var _a, _b, _c, _d;
            var _e, _f, _g, _h, _j;
            const actdef = spec.ctx.actdef;
            const meta = spec.data.meta;
            if (actdef) {
                const when = Date.now();
                // console.log('IN', meta)
                const pat = actdef.pattern;
                const msgm = ((_a = (_e = tdata.msg)[pat]) !== null && _a !== void 0 ? _a : (_e[pat] = { c: [], d: [], m: [] }));
                msgm.c.push(when);
                let index = msgm.c.length - 1;
                msgm.m[index] = meta.mi;
                (_b = (_f = meta.custom)._sys_Telemetry_index) !== null && _b !== void 0 ? _b : (_f._sys_Telemetry_index = {});
                meta.custom._sys_Telemetry_index[meta.mi] = index;
                const tracem = ((_c = (_g = tdata.trace)[_h = meta.tx]) !== null && _c !== void 0 ? _c : (_g[_h] = []));
                const runsm = ((_d = (_j = tdata.runs)[pat]) !== null && _d !== void 0 ? _d : (_j[pat] = []));
                tracem.push({ k: 1, m: meta.mi, p: pat, t: when });
                runsm.push(meta.tx);
                // console.log('IN', pat, meta.custom)
            }
        }, { after: 'announce' });
        root.order.outward.add((spec) => {
            var _a;
            const actdef = spec.ctx.actdef;
            const meta = spec.data.meta;
            if (actdef) {
                const when = Date.now();
                // console.log('OUT', actdef.pattern)
                const pat = actdef.pattern;
                const msgm = tdata.msg[pat];
                const index = (_a = meta.custom) === null || _a === void 0 ? void 0 : _a._sys_Telemetry_index[meta.mi];
                if (msgm && null != index) {
                    msgm.d[index] = Date.now() - msgm.c[index];
                }
                const tracem = tdata.trace[meta.tx];
                if (tracem) {
                    tracem.push({ k: 2, m: meta.mi, p: pat, t: when, e: meta.error ? 1 : 0 });
                }
            }
        }, { before: 'make_error' });
    }
    // console.log('PRELOAD', options, Object.getPrototypeOf(root.order.inward))
}
function Telemetry(options) {
    let seneca = this;
    const root = seneca.root;
    const tdata = root.context._sys_Telemetry;
    seneca
        .fix('sys:telemetry')
        .message('get:msg', { pat: String }, async function getMsg(msg) {
        return {
            pat: msg.pat,
            msg: tdata.msg[msg.pat],
            trace: (tdata.runs[msg.pat] || []).map((tx) => ({
                tx, t: tdata.trace[tx].map((n) => ({
                    ...n,
                    d: tdata.msg[n.p].d[tdata.msg[n.p].m.indexOf(n.m)]
                }))
            }))
        };
    });
    return {
        exports: {
            raw: () => tdata
        }
    };
}
Object.assign(Telemetry, { defaults, preload });
// Prevent name mangling
Object.defineProperty(Telemetry, 'name', { value: 'Telemetry' });
exports.default = Telemetry;
if ('undefined' !== typeof module) {
    module.exports = Telemetry;
}
//# sourceMappingURL=telemetry.js.map