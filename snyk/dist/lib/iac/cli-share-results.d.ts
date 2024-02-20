import { IacShareResultsFormat, IaCTestFlags, ShareResultsOutput } from '../../cli/commands/test/iac-local-execution/types';
import { Policy } from '../policy/find-and-load-policy';
import { ProjectAttributes, Tag } from '../types';
export declare function shareResults({ results, policy, tags, attributes, options, }: {
    results: IacShareResultsFormat[];
    policy: Policy | undefined;
    tags?: Tag[];
    attributes?: ProjectAttributes;
    options?: IaCTestFlags;
}): Promise<ShareResultsOutput>;