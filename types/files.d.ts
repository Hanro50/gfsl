/// <reference types="node" />
import type { DownloadableFile } from "./types";
export interface WrappedObj {
    save: () => void;
    getFile: () => File;
}
export declare function stringify(json: object): string;
export declare function packAsync(pathToDirOrFile: string, pathToArchive: string, zipDir?: Dir): Promise<void>;
export declare class Dir {
    path: string[];
    constructor(...path: string[]);
    /**Returns a hash of all the sub files in a folder */
    getHash(algorithm?: string): string;
    /**Checks if a directory or file is in a relative or absolute state */
    isRelative(): boolean;
    /**Return the system path of a directory */
    sysPath(): string;
    /**Double checks if the directory exists */
    mkdir(): this;
    /**Creates a system link to this file and puts the link at the destination file that was provided as input (similar to {@link linkFrom})*/
    linkTo(dest: string | string[] | this): void;
    /**Creates a system link to a set file or directory using this file or folder as the the placeholder for the link (similar to {@link linkTo})*/
    linkFrom(path: string | string[] | this): void;
    /**Returns the system temp directory */
    static tmpdir(): Dir;
    /**Returns the amount of files in a directory*/
    getSize(): number;
    /**Checks if a directory is a symbolic link */
    isLink(): boolean;
    /**Does the same as the {@link sysPath} function */
    toString(): string;
    /**Gets a new directory relative to this directory */
    getDir(..._file: string[]): Dir;
    /**Gets a new file relative to this directory */
    getFile(..._file: string[]): File;
    /**Removes this file or directory */
    rm(): this;
    /**Copies this file or directory to a set location*/
    copyTo(dir: this): void;
    /**Moves this file or directory to a set location*/
    moveTo(file: this): this;
    /**Checks if this file exists */
    exists(): boolean;
    /**Returns a java path off this directory or file */
    javaPath(): string;
    /**Gets the name of this directory*/
    getName(): string;
    /**Lists a set directory's contents*/
    ls(): (File | Dir)[];
    /**Checks if the size value given matches with this object. (@see {@link getSize})*/
    size(expected: number): boolean;
    /**Checks if an expected hash matches with this object. (@see {@link getHash})*/
    sha1(expected: string | string[]): boolean;
    /**Returns false if the file is in missmatch.*/
    chkSelf(chk?: {
        sha1?: string | string[];
        size?: number;
    }): boolean;
}
export declare class File extends Dir {
    name: string;
    constructor(...path: string[]);
    /**Gets the directory of a set file */
    dir(): Dir;
    /**Reads a file and returns the raw array buffer */
    readRaw(): Buffer;
    /**Reads a file and returns it as a string */
    read(): string;
    /**Returns a base64 representation of the file */
    toBase64(): string;
    /**@override Gets the name of this file*/
    getName(): string;
    /**@override Return the system path of a file*/
    sysPath(): string;
    /**@override */
    javaPath(): string;
    /**@override gets the hash of this file*/
    getHash(algorithm?: string): string;
    /**@override gets the size of this file*/
    getSize(): number;
    /**Reads a set file and returns a json representation of that object*/
    toJSON<T>(): T;
    /**
     * Downloads a set file using fetch internally
     * @param url The url of the file you want to download
     * @param chk The file check
     * @returns this object to allow for chaining
     */
    download(url: string, chk?: {
        sha1?: string | string[];
        size?: number;
    }, opt?: {
        noRetry?: true;
        signal?: AbortSignal;
        onReDownload?: (file: File) => void;
    }): Promise<this>;
    /**Sets the execution bit on a set file, used on Linux and Mac systems */
    chmod(): void;
    /**Writes data to file. Automatically converts JSON objects to parsable strings before saving them*/
    write(data: string | ArrayBuffer | object): void;
    /**Loads a json object from the file system and adds some shortcut functions to make it easier to save. */
    load<T>(def: T, serializer?: (raw: T) => T): T & WrappedObj;
    /**Turns an object into a wrappedObj. Essentially this just adds functions to make it easier to save. */
    wrap<T>(obj: T): T & WrappedObj;
    toDownloadable(url: string, key?: string, chk?: {
        sha1?: string | string[];
        size?: number;
    }, opt?: {
        executable?: boolean | string;
        unzip?: {
            file: Dir;
            exclude?: string[];
        };
    }): DownloadableFile;
    /**
     * 0 Full redownload
     * 1 unzip only
     * 2 fine
     */
    static check(json: Partial<DownloadableFile>): number;
    expand(json: Partial<DownloadableFile>, zipDir: Dir): Promise<void>;
    static process(json: DownloadableFile, zipDir: Dir): Promise<void>;
    /**Similar to {@link extract}, but uses a blacklist approach */
    unzip(path: Dir, exclude?: string[], zipDir?: Dir): Promise<void>;
    /**Similar to {@link unzip}, but uses a whitelist approach */
    extract(path: Dir, files: string[], zipDir?: Dir): Promise<void>;
    isExecutable(): Promise<boolean>;
}
/**The location serving 7zip binary*/
export declare function set7zipRepo(z7: string): void;
export declare function download7zip(dir: Dir, os: "linux" | "windows" | "osx", arch: "arm" | "arm64" | "x32" | "x64"): Promise<void>;
