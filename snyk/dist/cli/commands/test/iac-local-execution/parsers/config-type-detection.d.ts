import { IacFileData, IacFileParsed } from '../types';
export declare const REQUIRED_K8S_FIELDS: string[];
export declare const REQUIRED_CLOUDFORMATION_FIELDS: string[];
export declare const REQUIRED_ARM_FIELDS: string[];
export declare function detectConfigType(fileData: IacFileData, parsedIacFiles: any[]): IacFileParsed[];
export declare function checkRequiredFieldsMatch(parsedDocument: any, requiredFields: string[]): boolean;
