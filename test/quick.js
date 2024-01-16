
const Seneca = require('seneca')
const Telemetry = require('../dist/telemetry')


run()

async function run() {
  const seneca = await Seneca({legacy:false})
	.test()
	.use('promisify')
	.use(Telemetry,{
	  active: true
	})

	.message('a:1', async function a1(msg) {
	  await new Promise(r=>setTimeout(r,100))
	  return {x:1+msg.x}
	})

  	.message('b:1', async function b1(msg) {
	  await new Promise(r=>setTimeout(r,100))
	  let out = await this.post('a:1',{x:msg.x})
	  await new Promise(r=>setTimeout(r,100))
	  return {x:2*msg.x}
	})

    	.message('c:1', async function c1_0(msg) {
	  await new Promise(r=>setTimeout(r,20))
	  let out = await this.post('a:1',{x:msg.x})
	  await new Promise(r=>setTimeout(r,30))
	  out = await this.post('b:1',{x:msg.x})
	  await new Promise(r=>setTimeout(r,40))
	  return {x:0.5*msg.x}
	})

      	.message('c:1', async function c1_1(msg) {
          msg.x += 0.1
          return this.prior(msg)
	})

	.ready()

  for(let i = 0; i < 1; i++) {
    seneca.act('c:1',{x:i}, seneca.util.print)
  }

  await seneca.ready()

  
  // console.dir(seneca.export('Telemetry/raw')(),{depth:null,breakLength:120})
  
  console.dir(await seneca.post('sys:telemetry,get:msg',{pat:'a:1'}),{depth:null,breakLength:120})
  console.dir(await seneca.post('sys:telemetry,get:msg',{pat:'a:1'}),{depth:null,breakLength:120})
  
  console.dir(await seneca.post('sys:telemetry,get:msg',{pat:'b:1'}),{depth:null,breakLength:120})
  console.dir(await seneca.post('sys:telemetry,get:msg',{pat:'c:1'}),{depth:null,breakLength:120})
  // console.dir(seneca.export('Telemetry/raw')(), {depth:null})
}



