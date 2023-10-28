import type { File, Dir } from "index";
export declare const isWin: boolean;
export declare function mkdir(path: string): void;
/**
 * @param dest Path to create the link in
 * @param path Path to the file to link to
 */
export declare function mklink(dest: string, path: string): void;
export declare function get7zip(dir: Dir): File;
