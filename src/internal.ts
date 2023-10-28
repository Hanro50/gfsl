import { existsSync, mkdirSync, symlinkSync, unlinkSync } from "fs";
import { platform } from "os";
import type { File,Dir } from "index";
export const isWin = platform() == "win32";
export function mkdir(path: string) {
    if (!existsSync(path)) mkdirSync(path, { recursive: true });
}
/**
 * @param dest Path to create the link in
 * @param path Path to the file to link to
 */
export function mklink(dest: string, path: string) {
    try {
      if (existsSync(path)) unlinkSync(path);
  
      symlinkSync(dest, path, "junction");
    } catch (e) {
      console.error(e, existsSync(path), path);
      console.error("[GFSL]: Could not create syslink between d:" + dest + "=>p:" + path);
      process.exit();
    }
  }
  

  export function get7zip(dir: Dir ) {
    const loc = dir.getDir("7z");
    const d = loc.getFile("index.json");
    if (!d.exists()) throw "Not initialized";
    const m = d.toJSON<{ _main: string; [key: string]: string }>();
    return loc.getFile(m._main);
  }