/* Copyright © 2021-2024 Richard Rodger, MIT License. */


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
    msg: {},
    trace: {},
    runs: {},
  }


  if (options.active) {
    root.order.inward.add((spec: any) => {
      const actdef = spec.ctx.actdef
      const meta = spec.data.meta
      if (actdef) {
        const when = Date.now()
        // console.log('IN', meta)
        const pat = actdef.pattern

        const msgm = (tdata.msg[pat] ??= { c: [], d: [], m: [] })
        msgm.c.push(when)
        let index = msgm.c.length - 1
        msgm.m[index] = meta.mi
        meta.custom._sys_Telemetry_index ??= {}
        meta.custom._sys_Telemetry_index[meta.mi] = index

        const tracem = (tdata.trace[meta.tx] ??= [])
        const runsm = (tdata.runs[pat] ??= [])
        tracem.push({ k: 1, m: meta.mi, p: pat, t: when })
        runsm.push(meta.tx)

        // console.log('IN', pat, meta.custom)
      }
    }, { after: 'announce' })

    root.order.outward.add((spec: any) => {
      const actdef = spec.ctx.actdef
      const meta = spec.data.meta
      if (actdef) {
        const when = Date.now()

        // console.log('OUT', actdef.pattern)
        const pat = actdef.pattern


        const msgm = tdata.msg[pat]
        const index = meta.custom?._sys_Telemetry_index[meta.mi]
        if (msgm && null != index) {
          msgm.d[index] = Date.now() - msgm.c[index]
        }

        const tracem = tdata.trace[meta.tx]
        if (tracem) {
          tracem.push({ k: 2, m: meta.mi, p: pat, t: when, e: meta.error ? 1 : 0 })
        }
      }
    }, { before: 'make_error' })

  }

  // console.log('PRELOAD', options, Object.getPrototypeOf(root.order.inward))
}


function Telemetry(this: any, options: Options) {
  let seneca: any = this
  const root: any = seneca.root

  const tdata = root.context._sys_Telemetry

  seneca
    .fix('sys:telemetry')
    .message('get:msg', { pat: String }, async function getMsg(msg: any) {
      return {
        pat: msg.pat,
        msg: tdata.msg[msg.pat],
        trace: (tdata.runs[msg.pat] || []).map((tx: string) =>
        ({
          tx, t: tdata.trace[tx].map((n: any) => ({
            ...n,
            d: tdata.msg[n.p].d[tdata.msg[n.p].m.indexOf(n.m)]
          }))
        }))
      }
    })

  return {
    exports: {
      raw: () => tdata
    }
  }
}



Object.assign(Telemetry, { defaults, preload })

// Prevent name mangling
Object.defineProperty(Telemetry, 'name', { value: 'Telemetry' })

export default Telemetry

if ('undefined' !== typeof module) {
  module.exports = Telemetry
}
