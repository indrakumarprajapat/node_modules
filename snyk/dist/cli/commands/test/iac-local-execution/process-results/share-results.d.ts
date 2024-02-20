import { Policy } from '../../../../../lib/policy/find-and-load-policy';
import { ProjectAttributes, Tag } from '../../../../../lib/types';
import { IacFileScanResult, IaCTestFlags, ShareResultsOutput } from '../types';
export declare function formatAndShareResults({ results, options, orgPublicId, policy, tags, attributes, }: {
    results: IacFileScanResult[];
    options: IaCTestFlags;
    orgPublicId: string;
    policy: Policy | undefined;
    tags?: Tag[];
    attributes?: ProjectAttributes;
}): Promise<ShareResultsOutput>;