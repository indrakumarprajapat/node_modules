import { AnyObject } from './config';
declare function noop(): void;
export = StrongGlobalize;
declare class StrongGlobalize {
    static SetRootDir: typeof noop;
    static SetDefaultLanguage: typeof noop;
    static SetPersistentLogging: typeof noop;
    setLanguage: typeof noop;
    getLanguage(): string;
    c(value: any, currencySymbol: string, options: AnyObject): string;
    formatCurrency: (value: any, currencySymbol: string, options: AnyObject<any>) => string;
    d: (value: Date, options: AnyObject<any>) => string;
    formatDate: (value: Date, options: AnyObject<any>) => string;
    n: (value: number, options: AnyObject<any>) => string;
    formatNumber: (value: number, options: AnyObject<any>) => string;
    m: (path: string, variables: any) => any;
    formatMessage: (path: string, variables: any) => any;
    t: (path: string, variables: any) => any;
    Error(...args: any[]): any;
    f(...args: any[]): any;
    format: (...args: any[]) => any;
    ewrite(...args: any[]): void;
    owrite(...args: any[]): void;
    write: (...args: any[]) => void;
    rfc5424(type: string, args: any[], fn: (...args: any[]) => void): any;
    emergency(...args: any[]): any;
    alert(...args: any[]): any;
    critical(...args: any[]): any;
    error(...args: any[]): any;
    warning(...args: any[]): any;
    notice(...args: any[]): any;
    informational(...args: any[]): any;
    debug(...args: any[]): any;
    warn(...args: any[]): any;
    info(...args: any[]): any;
    log(...args: any[]): any;
    help(...args: any[]): any;
    data(...args: any[]): any;
    prompt(...args: any[]): any;
    verbose(...args: any[]): any;
    input(...args: any[]): any;
    silly(...args: any[]): any;
}
