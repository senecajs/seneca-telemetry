type Options = {
    debug: boolean;
    active: boolean;
};
export type TelemetryOptions = Partial<Options>;
declare function Telemetry(this: any, _options: Options): {
    exports: {
        raw: () => any;
    };
};
export default Telemetry;
