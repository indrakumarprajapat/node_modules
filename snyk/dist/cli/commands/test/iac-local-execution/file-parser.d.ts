import { IacFileData, IacFileParsed, IaCTestFlags, ParsingResults } from './types';
import { CustomError } from '../../../../lib/errors';
export declare function parseFiles(filesData: IacFileData[], options?: IaCTestFlags, isTFVarSupportEnabled?: boolean): Promise<ParsingResults>;
export declare function parseNonTerraformFiles(filesData: IacFileData[], options: IaCTestFlags): ParsingResults;
export declare function parseTerraformFiles(filesData: IacFileData[]): ParsingResults;
export declare function tryParseIacFile(fileData: IacFileData, options?: IaCTestFlags): IacFileParsed[];
export declare class UnsupportedFileTypeError extends CustomError {
    constructor(fileType: string);
}