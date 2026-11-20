

export default {
  print: false,
  pattern: 'sys:telemetry',
  allow: { missing: true },

  calls: [
    // A pattern that was never called has no records.
    {
      name: 'get-msg-none',
      pattern: 'get:msg',
      params: { pat: 'not:called' },
      out: { pat: 'not:called', aggd: {} },
      verify: (call: any) => {
        const out = call.result.out
        return undefined === out.msg && Array.isArray(out.trace) &&
          0 === out.trace.length ? true : 'unexpected: ' + JSON.stringify(out)
      },
    },

    {
      pattern: 'set:active',
      params: { active: true },
      verify: (_call: any, _callmap: any, _spec: any, seneca: any) =>
        true === seneca.export('Telemetry/raw')().active || 'not active',
    },

    {
      pattern: 'set:active',
      params: { active: false },
      verify: (_call: any, _callmap: any, _spec: any, seneca: any) =>
        false === seneca.export('Telemetry/raw')().active || 'still active',
    },
  ]
}
