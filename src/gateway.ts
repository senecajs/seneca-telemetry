/* Copyright © 2021-2022 Richard Rodger, MIT License. */


import { Open } from 'gubu'


function gateway(this: any, options: any) {
  let seneca: any = this
  const root: any = seneca.root
  const tu: any = seneca.export('transport/utils')


  const hooknames = [
    // Functions to modify the custom object in Seneca message meta$ descriptions
    'custom',

    // Functions to modify the fixed arguments to Seneca messages
    'fixed',

    // Functions to modify the seneca request delegate
    'delegate',

    // TODO: rename: before
    // Functions to modify the action or message
    'action',

    // TODO: rename: after
    // Functions to modify the result
    'result'
  ]

  const hooks: any = hooknames.reduce((a: any, n) => (a[n] = [], a), {})

  const tag = seneca.plugin.tag
  if (null != tag && '-' !== tag) {
    seneca = seneca.fix({ tag })
  }

  seneca.message('sys:gateway,add:hook', async function add_hook(msg: any) {
    let hook: string = msg.hook
    let action: (...params: any[]) => any = msg.action

    if (null != action) {
      let hookactions = hooks[hook]
      hookactions.push(action)
      return { ok: true, hook, count: hookactions.length }
    }
    else {
      return { ok: false, why: 'no-action' }
    }
  })


  seneca.message('sys:gateway,get:hooks', async function get_hook(msg: any) {
    let hook: string = msg.hook
    let hookactions = hooks[hook]
    return { ok: true, hook, count: hookactions.length, hooks: hookactions }
  })


  // Handle inbound JSON, converting it into a message, and submitting to Seneca.
  async function handler(json: any, ctx: any) {
    const seneca = await prepare(json, ctx)
    const msg = tu.internalize_msg(seneca, json)

    // TODO: disallow directives!

    return await new Promise(async (resolve) => {
      var out = null
      for (var i = 0; i < hooks.action.length; i++) {
        out = await hooks.action[i].call(seneca, msg, ctx)
        if (out) {
          return resolve(out)
        }
      }

      seneca.act(msg, async function(this: any, err: any, out: any, meta: any) {
        for (var i = 0; i < hooks.result.length; i++) {
          await hooks.result[i].call(seneca, out, msg, err, meta, ctx)
        }

        if (err && !options.debug) {
          err.stack = null
        }

        var out = tu.externalize_reply(this, err, out, meta)

        // Don't expose internal activity unless debugging
        if (!options.debug) {

          // TODO: externalize_reply should help with this
          if (err) {
            out = {
              handler$: {
                seneca: true,
                code: err.code,
                error: true,
                meta: out.$meta,
              }
            }
          }

          if (out.meta$) {
            out.meta$ = {
              id: out.meta$.id
            }
          }
        }

        resolve(out)
      })
    })
  }


  async function prepare(json: any, ctx: any) {
    let i, hookaction

    let custom: any = seneca.util.deep({}, options.custom)
    for (i = 0; i < hooks.custom.length; i++) {
      hookaction = hooks.custom[i]
      if ('object' === typeof (hookaction)) {
        custom = seneca.util.deep(custom, hookaction)
      }
      else {
        await hookaction(custom, json, ctx)
      }
    }


    let fixed: any = seneca.util.deep({}, options.fixed)
    for (i = 0; i < hooks.fixed.length; i++) {
      hookaction = hooks.fixed[i]
      if ('object' === typeof (hookaction)) {
        fixed = seneca.util.deep(fixed, hookaction)
      }
      else {
        await hookaction(fixed, json, ctx)
      }
    }

    // NOTE: a new delegate is created for each request to ensure isolation.
    const delegate = root.delegate(fixed, { custom: custom })

    for (i = 0; i < hooks.delegate.length; i++) {
      await hooks.delegate[i].call(delegate, json, ctx)
    }

    return delegate
  }


  function parseJSON(data: any) {
    if (null == data) return {}

    let str = String(data)

    try {
      return JSON.parse(str)
    } catch (e: any) {
      e.handler$ = {
        error$: e.message,
        input$: str,
      }
      return e
    }
  }


  return {
    exports: {
      handler,
      parseJSON,
    }
  }
}


// Default options.
gateway.defaults = {

  custom: Open({

    // Assume gateway is used to handle external messages.
    safe: false
  }),

  fixed: Open({}),

  // When true, errors will include stack trace.
  debug: false
}


export default gateway

if ('undefined' !== typeof (module)) {
  module.exports = gateway
}
