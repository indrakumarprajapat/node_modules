import { MonitorMeta, MonitorResult, PolicyOptions, MonitorOptions, Options, Contributor, ProjectAttributes, Tag } from '../types';
import { PluginMetadata } from '@snyk/cli-interface/legacy/plugin';
import { ScannedProject } from '@snyk/cli-interface/legacy/common';
export declare function monitor(root: string, meta: MonitorMeta, scannedProject: ScannedProject, options: Options & MonitorOptions & PolicyOptions, pluginMeta: PluginMetadata, targetFileRelativePath?: string, contributors?: Contributor[], projectAttributes?: ProjectAttributes, tags?: Tag[]): Promise<MonitorResult>;
export declare function monitorDepGraph(root: string, meta: MonitorMeta, scannedProject: ScannedProject, pluginMeta: PluginMetadata, options: MonitorOptions & PolicyOptions, targetFileRelativePath?: string, contributors?: Contributor[], projectAttributes?: ProjectAttributes, tags?: Tag[]): Promise<MonitorResult>;
