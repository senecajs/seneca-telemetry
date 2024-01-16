/* Copyright © 2021-2024 Richard Rodger, MIT License. */


const { Stats } = require('fast-stats')

import { Open } from 'gubu'


type Options = {
  debug: boolean
  active: boolean
}

// Default options.
const defaults = {
  debug: false,
  active: false,
}


export type TelemetryOptions = Partial<Options>




function preload(this: any, plugin: any) {
  const seneca = this
  const root = seneca.root
  const options: Options = plugin.options


  const tdata = root.context._sys_Telemetry ??= {
    active: options.active,
    msg: {},
    trace: {},
    runs: {},
  }


  root.order.inward.add((spec: any) => {
    if (!tdata.active) return null

    const actdef = spec.ctx.actdef
    const meta = spec.data.meta
    if (actdef) {
      const when = Date.now()

      // console.log('IN', actdef, meta)
      const pat = actdef.pattern
      const act = actdef.id

      tdata.msg[pat] ??= {}
      const msgm = (tdata.msg[pat][act] ??= { c: [], d: [], m: [] })
      msgm.c.push(when)
      let index = msgm.c.length - 1
      msgm.m[index] = meta.mi
      meta.custom._sys_Telemetry_index ??= {}
      meta.custom._sys_Telemetry_index[meta.mi] = index

      const tracem = (tdata.trace[meta.tx] ??= [])

      tdata.runs[pat] ??= {}
      const runsm = (tdata.runs[pat][act] ??= [])
      tracem.push({ k: 1, m: meta.mi, p: pat, a: act, t: when })
      runsm.push(meta.tx)

      // console.log('IN', pat, meta.custom)
    }
  }, { after: 'announce' })


  root.order.outward.add((spec: any) => {
    if (!tdata.active) return null

    const actdef = spec.ctx.actdef
    const meta = spec.data.meta
    if (actdef) {
      const when = Date.now()

      // console.log('OUT', actdef.pattern)
      const pat = actdef.pattern
      const act = actdef.id

      const msgm = tdata.msg[pat]?.[act]
      const index = meta.custom?._sys_Telemetry_index[meta.mi]
      if (msgm && null != index) {
        msgm.d[index] = Date.now() - msgm.c[index]
      }

      const tracem = tdata.trace[meta.tx]
      if (tracem) {
        tracem.push({ k: 2, m: meta.mi, p: pat, a: act, t: when, e: meta.error ? 1 : 0 })
      }
    }
  }, { before: 'make_error' })

}


function Telemetry(this: any, options: Options) {
  let seneca: any = this
  const root: any = seneca.root

  const tdata = root.context._sys_Telemetry

  seneca
    .fix('sys:telemetry')

    .message('set:active', { active: Boolean }, async function setActive(msg: any) {
      const tdata = root.context._sys_Telemetry
      tdata.active = msg.active
    })

    .message('get:msg', { pat: String }, async function getMsg(msg: any) {
      return {
        pat: msg.pat,
        msg: tdata.msg[msg.pat],

        aggd: Object
          .entries(tdata.msg[msg.pat])
          .map((n: any[]) => (n[1] = n[1].d, n))
          .reduce((g: any, a: any[]) =>
            ((g[a[0]] = stats(a[1])), g),
            {})
        ,
        trace: Object
          .entries((tdata.runs[msg.pat] || []))
          .map(
            (an: any[]) =>
              an[1].map(
                (tx: string) =>
                ({
                  a: an[0],
                  tx,
                  t: tdata.trace[tx].map((n: any) => ({
                    ...n,
                    d: (n.d ??= tdata.msg[n.p][n.a].d[tdata.msg[n.p][n.a].m.indexOf(n.m)])
                  }))
                })
              )
          )

      }
    })

  return {
    exports: {
      raw: () => tdata
    }
  }
}

function stats(d: number[]) {
  let s = new Stats().push(d)
  let r = s.range()
  return { mn: s.amean(), md: s.median(), lo: r[0], hi: r[1] }
}


Object.assign(Telemetry, { defaults, preload })

// Prevent name mangling
Object.defineProperty(Telemetry, 'name', { value: 'Telemetry' })

export default Telemetry

if ('undefined' !== typeof module) {
  module.exports = Telemetry
}
