declare function gateway(this: any, options: any): {
    exports: {
        handler: (json: any, ctx: any) => Promise<unknown>;
        parseJSON: (data: any) => any;
    };
};
declare namespace gateway {
    var defaults: {
        custom: import("gubu").Node & {
            [name: string]: any;
        };
        fixed: import("gubu").Node & {
            [name: string]: any;
        };
        debug: boolean;
    };
}
export default gateway;
