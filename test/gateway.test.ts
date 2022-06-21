
import Gateway from '../src/gateway'

const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')
const GatewayMessages = require('./gateway.messages').default



describe('gateway', () => {

  test('happy', async () => {
    const seneca = Seneca({ legacy: false }).test().use('promisify').use(Gateway)
    await seneca.ready()
  })

  test('messages', async () => {
    const seneca = Seneca({ legacy: false }).test().use('promisify').use(Gateway)
    await (SenecaMsgTest(seneca, GatewayMessages)())
  })

  test('handler', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use(Gateway, {
        custom: {
          z: 3
        }
      })

    seneca.message('foo:1', async (msg: any, meta: any) => ({
      q: msg.q,
      ay: msg.y,
      ax: meta.custom.x,
      az: meta.custom.z,
      safe: meta.custom.safe
    }))
    seneca.act('sys:gateway,add:hook,hook:custom', { action: { x: 1 } })
    seneca.act('sys:gateway,add:hook,hook:fixed',
      { action: (fixed: any) => fixed.y = 2 })

    await seneca.ready()
    let handler = seneca.export('gateway/handler')
    let out = await handler({ foo: 1, q: 99 })
    expect(out.meta$.id).toBeDefined()
    expect(out).toMatchObject({ q: 99, ay: 2, ax: 1, az: 3, safe: false })


    // Can't make unsafe safe!
    out = await handler({ foo: 1, q: 99, custom$: { safe: true } })
    expect(out).toMatchObject({ q: 99, ay: 2, ax: 1, az: 3, safe: false })
  })


  test('tag', async () => {
    const seneca = Seneca({ legacy: false }).test().use('promisify').use({
      define: Gateway, tag: 'foo'
    })
    await seneca.ready()
    // console.log(seneca.list_plugins())
    // console.log(seneca.list('sys:gateway'))
    expect(seneca.list('sys:gateway')).toEqual([
      { add: 'hook', sys: 'gateway', tag: 'foo' },
      { get: 'hooks', sys: 'gateway', tag: 'foo' }
    ])
  })

})

