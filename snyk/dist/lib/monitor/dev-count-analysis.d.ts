import { Contributor } from '../types';
export declare const SERIOUS_DELIMITER = "_SNYK_SEPARATOR_";
export declare const CONTRIBUTING_DEVELOPER_PERIOD_DAYS = 90;
export declare const MAX_COMMITS_IN_GIT_LOG = 500;
export declare function getContributors({ endDate, periodDays, repoPath }?: {
    endDate: Date;
    periodDays: number;
    repoPath: string;
}): Promise<Contributor[]>;
export declare class GitCommitInfo {
    authorEmail: string;
    commitTimestamp: string;
    constructor(authorEmail: string, commitTimestamp: string);
}
export declare class GitRepoCommitStats {
    commitInfos: GitCommitInfo[];
    constructor(commitInfos: GitCommitInfo[]);
    static empty(): GitRepoCommitStats;
    addCommitInfo(info: GitCommitInfo): void;
    getUniqueAuthorsCount(): number;
    getCommitsCount(): number;
    getUniqueAuthorEmails(): Set<string>;
    getRepoContributors(): Contributor[];
    getMostRecentCommitTimestamp(authorHashedEmail: string): string;
}
export declare function parseGitLogLine(logLine: string): GitCommitInfo;
export declare function parseGitLog(gitLog: string): GitRepoCommitStats;
/**
 * @returns time stamp in seconds-since-epoch of 90 days ago since 90 days is the "contributing devs" timeframe
 */
export declare function getTimestampStartOfContributingDevTimeframe(dNow: Date, timespanInDays?: number): number;
export declare function runGitLog(timestampEpochSecondsStartOfPeriod: number, timestampEpochSecondsEndOfPeriod: number, repoPath: string, fnShellout: (cmd: string, workingDirectory: string) => Promise<string>): Promise<string>;
export declare function separateLines(inputText: string): string[];
export declare function execShell(cmd: string, workingDirectory: string): Promise<string>;
export declare class ShellOutError extends Error {
    innerError: Error | undefined;
    exitCode: number | undefined;
    stdout: string | undefined;
    stderr: string | undefined;
    constructor(message: string, exitCode: number | undefined, stdout: string, stderr: string, innerError: Error | undefined);
}
