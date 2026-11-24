
import Seneca from 'seneca'
import SenecaMsgTest from 'seneca-msg-test'


import Telemetry from '../src/telemetry'
import TelemetryMessages from './telemetry.messages'


const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))


function makeSeneca(options?: any, log?: string) {
  return Seneca({ legacy: false })
    .test(log)
    .use(Telemetry, options)

    .message('a:1', async function a1(msg: any) {
      await sleep(10)
      return { x: 1 + msg.x }
    })

    .message('b:1', async function b1(this: any, msg: any) {
      const out = await this.post('a:1', { x: msg.x })
      return { x: 2 * out.x }
    })

    .message('c:1', async function c1_0(msg: any) {
      return { x: msg.x }
    })

    .message('c:1', async function c1_1(this: any, msg: any) {
      msg.x += 0.1
      return this.prior(msg)
    })

    .message('d:1', async function d1(msg: any) {
      if (0 === msg.x) throw new Error('BAD')
      return { x: msg.x }
    })
}


function getMsg(seneca: any, pat: string) {
  return seneca.post('sys:telemetry,get:msg', { pat })
}


describe('telemetry', () => {

  test('happy', async () => {
    const seneca = Seneca({ legacy: false }).test().use(Telemetry)
    await seneca.ready()
    expect(seneca.has('sys:telemetry,set:active')).toBe(true)
    expect(seneca.has('sys:telemetry,get:msg')).toBe(true)
  })


  test('messages', async () => {
    const seneca = Seneca({ legacy: false }).test().use(Telemetry)
    await (SenecaMsgTest(seneca, TelemetryMessages)())
  })


  // The active flag must be a boolean.
  test('set-active-invalid', async () => {
    const seneca = Seneca({ legacy: false }).test('silent').use(Telemetry)
    await seneca.ready()

    await expect(seneca.post('sys:telemetry,set:active', { active: 'yes' }))
      .rejects.toMatchObject({ code: 'act_invalid_msg' })
    expect(seneca.export('Telemetry/raw')().active).toBe(false)
  })


  test('basic', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .use(Telemetry)
    await seneca.ready()

    const raw = seneca.export('Telemetry/raw')()
    expect(raw).toMatchObject({ active: false, msg: {}, trace: {}, runs: {} })
  })


  // The hooks are appended to the end of the inward and outward pipelines.
  test('hook-placement', async () => {
    const seneca = Seneca({ legacy: false }).test().use(Telemetry)
    await seneca.ready()

    const inward = seneca.root.order.inward.tasks().map((t: any) => t.name)
    const outward = seneca.root.order.outward.tasks().map((t: any) => t.name)

    expect(inward.slice(-2)).toEqual(['inward_announce', 'telemetry_inward'])
    expect(outward[0]).toEqual('outward_make_error')
    expect(outward[outward.length - 1]).toEqual('telemetry_outward')
  })


  test('inactive-by-default', async () => {
    const seneca = makeSeneca()
    await seneca.ready()

    expect(await seneca.post('a:1', { x: 1 })).toEqual({ x: 2 })

    let out = await getMsg(seneca, 'a:1')
    expect(out.msg).toBeUndefined()
    expect(out.aggd).toEqual({})
    expect(out.trace).toEqual([])

    await seneca.post('sys:telemetry,set:active', { active: true })
    await seneca.post('a:1', { x: 2 })
    out = await getMsg(seneca, 'a:1')
    expect(Object.keys(out.msg).length).toEqual(1)
    expect(Object.values(out.msg)[0]).toMatchObject({ c: [expect.any(Number)] })

    await seneca.post('sys:telemetry,set:active', { active: false })
    await seneca.post('a:1', { x: 3 })
    out = await getMsg(seneca, 'a:1')
    expect((Object.values(out.msg)[0] as any).c.length).toEqual(1)
  })


  test('calls-and-durations', async () => {
    const seneca = makeSeneca({ active: true })
    await seneca.ready()

    await seneca.post('a:1', { x: 1 })
    await seneca.post('a:1', { x: 2 })
    await seneca.post('a:1', { x: 3 })

    const out = await getMsg(seneca, 'a:1')
    expect(out.pat).toEqual('a:1')

    const actids = Object.keys(out.msg)
    expect(actids.length).toEqual(1)
    const actid = actids[0]

    const msgm = out.msg[actid]
    expect(msgm.c.length).toEqual(3)
    expect(msgm.m.length).toEqual(3)
    expect(msgm.d.length).toEqual(3)
    msgm.d.forEach((d: number) => expect(d).toBeGreaterThanOrEqual(0))

    const aggd = out.aggd[actid]
    expect(Object.keys(aggd).sort()).toEqual(['hi', 'lo', 'md', 'mn'])
    expect(aggd.lo).toBeLessThanOrEqual(aggd.md)
    expect(aggd.md).toBeLessThanOrEqual(aggd.hi)

    // One transaction per top level call.
    expect(out.trace.length).toEqual(1)
    expect(out.trace[0].length).toEqual(3)
    expect(new Set(out.trace[0].map((t: any) => t.tx)).size).toEqual(3)
  })


  test('nested-trace', async () => {
    const seneca = makeSeneca({ active: true })
    await seneca.ready()

    expect(await seneca.post('b:1', { x: 1 })).toEqual({ x: 4 })

    const outb = await getMsg(seneca, 'b:1')
    const outa = await getMsg(seneca, 'a:1')

    // Both calls belong to the same transaction.
    const txb = outb.trace[0][0].tx
    expect(outa.trace[0][0].tx).toEqual(txb)

    // In and out of b:1 wrap in and out of a:1.
    const steps = outb.trace[0][0].t.map((n: any) => [n.k, n.p, n.e])
    expect(steps).toEqual([
      [1, 'b:1', undefined],
      [1, 'a:1', undefined],
      [2, 'a:1', 0],
      [2, 'b:1', 0],
    ])

    // Each trace step carries the duration of its call.
    outb.trace[0][0].t.forEach((n: any) =>
      expect(n.d).toBeGreaterThanOrEqual(0))

    // The outer call takes at least as long as the inner one.
    const db = (Object.values(outb.msg)[0] as any).d[0]
    const da = (Object.values(outa.msg)[0] as any).d[0]
    expect(db).toBeGreaterThanOrEqual(da)
  })


  test('prior', async () => {
    const seneca = makeSeneca({ active: true })
    await seneca.ready()

    expect(await seneca.post('c:1', { x: 1 })).toEqual({ x: 1.1 })

    const out = await getMsg(seneca, 'c:1')

    // The overriding action and its prior are recorded separately.
    const actids = Object.keys(out.msg)
    expect(actids.length).toEqual(2)
    expect(actids.some((a) => a.includes('c1_1'))).toBe(true)
    expect(actids.some((a) => a.includes('c1_0'))).toBe(true)

    const steps = out.trace[0][0].t.map((n: any) =>
      [n.k, n.a.includes('c1_1') ? 'c1_1' : 'c1_0'])
    expect(steps).toEqual([
      [1, 'c1_1'],
      [1, 'c1_0'],
      [2, 'c1_0'],
      [2, 'c1_1'],
    ])
  })


  test('error', async () => {
    const seneca = makeSeneca({ active: true }, 'silent')
    await seneca.ready()

    await expect(seneca.post('d:1', { x: 0 })).rejects.toThrow('BAD')
    expect(await seneca.post('d:1', { x: 2 })).toEqual({ x: 2 })

    const out = await getMsg(seneca, 'd:1')
    const actid = Object.keys(out.msg)[0]
    expect(out.msg[actid].c.length).toEqual(2)

    const [failed, passed] = out.trace[0]
    expect(failed.t.map((n: any) => [n.k, n.e])).toEqual([[1, undefined], [2, 1]])
    expect(passed.t.map((n: any) => [n.k, n.e])).toEqual([[1, undefined], [2, 0]])
  })

})

