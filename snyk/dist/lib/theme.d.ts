export declare const icon: {
    RUN: string;
    VALID: string;
    ISSUE: string;
    WARNING: string;
    INFO: string;
};
export declare const color: {
    status: {
        error: (text: string) => string;
        warn: (text: string) => string;
        success: (text: string) => string;
    };
    severity: {
        critical: (text: string) => string;
        high: (text: string) => string;
        medium: (text: string) => string;
        low: (text: string) => string;
    };
};
