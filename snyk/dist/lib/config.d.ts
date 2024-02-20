interface Config {
    PRUNE_DEPS_THRESHOLD: number;
    MAX_PATH_COUNT: number;
    API: string;
    api: string;
    API_REST_URL: string;
    API_V3_URL?: string;
    disableSuggestions: string;
    org: string;
    ROOT: string;
    timeout: number;
    PROJECT_NAME: string;
    TOKEN: string;
    CODE_CLIENT_PROXY_URL: string;
    DISABLE_ANALYTICS: unknown;
    CACHE_PATH?: string;
    DRIFTCTL_PATH?: string;
    DRIFTCTL_URL?: string;
}
declare const config: Config;
export default config;