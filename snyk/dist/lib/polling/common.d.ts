import { ScanResult } from '../ecosystems/types';
import { ResolutionMeta } from './types';
export declare function delayNextStep(attemptsCount: number, maxAttempts: number, pollInterval: number): Promise<void>;
export declare function extractResolutionMetaFromScanResult({ name, target, identity, policy, }: ScanResult): ResolutionMeta;