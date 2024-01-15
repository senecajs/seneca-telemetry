
import Seneca from 'seneca'
import SenecaMsgTest from 'seneca-msg-test'


import Telemetry from '../src/telemetry'
import TelemetryMessages from './telemetry.messages'



describe('telemetry', () => {

  test('happy', async () => {
    const seneca = Seneca({ legacy: false }).test().use('promisify').use(Telemetry)
    await seneca.ready()
  })


  test('messages', async () => {
    const seneca = Seneca({ legacy: false }).test().use('promisify').use(Telemetry)
    await (SenecaMsgTest(seneca, TelemetryMessages)())
  })


  test('basic', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use(Telemetry)
  })

})

