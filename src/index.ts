import { get7zip, isWin, mkdir, mklink } from "./internal.js";
import { createHash } from "crypto";
import { arch, platform, tmpdir, type } from "os";
import { join } from "path";
import fetch from "node-fetch";
import {
  existsSync,

  statSync,

  rmSync,
  readdirSync,
  copyFileSync,
  lstatSync,
  renameSync,
  access,
  createWriteStream,
  readFileSync,
  writeFileSync,
  constants,

} from "fs";
import { execSync, spawn } from "child_process";



export class Dir {
  path: string[];
  constructor(...path: string[]) {
    this.path = [];
    if (!isWin && path[0].startsWith("/")) {
      this.path.push("/");
    }
    path.forEach((e) => {
      if (isWin) e = e.replace(/\\/g, "/");
      this.path.push(...e.split("/"));
    });
    this.path = this.path.filter((el) => {
      return el.length > 0;
    });
  }

  /**Returns a hash of all the sub files in a folder */
  getHash(algorithm = "sha1") {
    let s = "";
    this.ls().forEach((e) => (s += e.getHash(algorithm)));
    return createHash(algorithm).update(s).digest("hex");
  }
  /**Checks if a directory or file is in a relative or absolute state */
  isRelative() {
    if (this.path.length < 1) return true;
    if (isWin) return !this.path[0].includes(":");
    return !this.path[0].startsWith("/");
  }
  /**Return the system path of a directory */
  sysPath() {
    if (this.isRelative()) return join(process.cwd(), ...this.path);
    return join(...this.path);
  }
  /**Double checks if the directory exists */
  mkdir() {
    mkdir(join(...this.path));
    return this;
  }
  /**Creates a system link to this file and puts the link at the destination file that was provided as input (similar to {@link linkFrom})*/
  linkTo(dest: string | string[] | this) {
    if (this instanceof File && platform() == "win32")
      console.warn(
        "[GFSL]: Symlinks in Windows need administrator privileges!\nThings are about to go wrong!",
      );
    if (dest instanceof File) dest = [...dest.path, dest.name];
    if (dest instanceof Dir) dest = dest.path;
    if (dest instanceof Array) dest = join(...dest);
    mklink(dest, this.sysPath());
  }
  /**Creates a system link to a set file or directory using this file or folder as the the placeholder for the link (similar to {@link linkTo})*/
  linkFrom(path: string | string[] | this) {
    if (this instanceof File && platform() == "win32")
      console.warn(
        "[GFSL]: Symlinks in Windows need administrator privileges!\nThings are about to go wrong!",
      );
    if (path instanceof File) path = [...path.path, path.name];
    if (path instanceof Dir) path = path.path;
    if (path instanceof Array) path = join(...path);
    mklink(this.sysPath(), path);
  }
  /**Returns the system temp directory */
  static tmpdir() {
    return new Dir(tmpdir());
  }
  /**Returns the amount of files in a directory*/
  getSize() {
    return readdirSync(this.sysPath()).length;
  }
  /**Checks if a directory is a symbolic link */
  isLink() {
    return lstatSync(this.sysPath()).isSymbolicLink();
  }
  /**Does the same as the {@link sysPath} function */
  toString() {
    return this.sysPath();
  }
  /**Gets a new directory relative to this directory */
  getDir(..._file: string[]) {
    return new Dir(...this.path, ..._file);
  }
  /**Gets a new file relative to this directory */
  getFile(..._file: string[]) {
    return new File(...this.path, ..._file);
  }
  /**Removes this file or directory */
  rm() {
    rmSync(this.sysPath(), { recursive: true, force: true });
    return this;
  }
  /**Copies this file or directory to a set location*/
  copyTo(dir: this) {
    copyFileSync(this.sysPath(), dir.sysPath());
  }
  /**Moves this file or directory to a set location*/
  moveTo(file: this) {
    renameSync(this.sysPath(), file.sysPath());
    return file;
  }
  /**Checks if this file exists */
  exists() {
    return existsSync(this.sysPath());
  }
  /**Returns a java path off this directory or file */
  javaPath() {
    return this.path.join("/");
  }
  /**Gets the name of this directory*/
  getName() {
    return this.path[this.path.length - 1];
  }
  /**Lists a set directory's contents*/
  ls() {
    const res: Array<Dir | File> = [];
    if (this.exists()) {
      readdirSync(this.sysPath()).forEach((e) => {
        const stat = statSync(join(this.sysPath(), e));
        res.push(stat.isFile() ? this.getFile(e) : this.getDir(e));
      });
    }
    return res;
  }
  /**Checks if the size value given matches with this object. (@see {@link getSize})*/
  size(expected: number) {
    if (!this.exists()) return false;
    return this.getSize() == expected;
  }
  /**Checks if an expected hash matches with this object. (@see {@link getHash})*/
  sha1(expected: string | string[]) {
    if (!this.exists()) return false;
    const sha1 = this.getHash();
    let checksums: string[] = [];
    if (typeof expected == "string") checksums.push(expected);
    else checksums = expected;
    for (let chk = 0; chk < checksums.length; chk++) {
      if (checksums[chk] == sha1) return true;
    }
    console.log(
      "[GFSL]: got " + sha1 + "\nexpected:" + expected + "\n" + this.sysPath(),
    );
    return false;
  }
  /**Returns true if the file matches what is expected.*/
  chkSelf(chk?: { sha1?: string | string[]; size?: number }) {
    if (!chk || !this.exists()) return false;
    if (chk.sha1 && !this.sha1(chk.sha1)) return false;
    if (chk.size && !this.size(chk.size)) return false;

    return true;
  }
}

export class File extends Dir {
  name: string;
  constructor(...path: string[]) {
    super(...path);
    this.name = this.path.pop();
  }
  /**Gets the directory of a set file */
  dir(): Dir {
    return new Dir(...this.path);
  }
  /**Reads a file and returns the raw array buffer */
  readRaw() {
    return readFileSync(this.sysPath());
  }
  /**Reads a file and returns it as a string */
  read(): string {
    return this.readRaw().toString();
  }
  /**Returns a base64 representation of the file */
  toBase64() {
    return readFileSync(this.sysPath(), "base64url");
  }
  /**@override Gets the name of this file*/
  getName() {
    return this.name;
  }
  /**@override Return the system path of a file*/
  sysPath() {
    return join(super.sysPath(), this.name);
  }
  /**@override */
  javaPath() {
    return [...this.path, this.name].join("/");
  }
  /**@override gets the hash of this file*/
  getHash(algorithm = "sha1") {
    return createHash(algorithm)
      .update(readFileSync(this.sysPath()))
      .digest("hex");
  }
  /**@override gets the size of this file*/
  getSize() {
    return statSync(this.sysPath()).size;
  }
  /**Reads a set file and returns a json representation of that object*/
  toJSON<T>() {
    if (this.exists())
      return JSON.parse(readFileSync(this.sysPath()).toString()) as T;
    throw "No file to read!";
  }
  /**
   * Downloads a set file using fetch internally
   * @param url The url of the file you want to download
   * @param chk The file check
   * @returns this object to allow for chaining
   * 
   */
  async download(
    url: string,
    chk?: { sha1?: string | string[]; size?: number },
    opt?: {
      noRetry?: true;
      signal?: AbortSignal;
      onReDownload?: (file: File) => void;
    },
  ) {
    if (!this.chkSelf(chk)) {
      await new Promise((resolve, reject) => {
        const file = createWriteStream(this.sysPath());
        fetch(url, { signal: opt?.signal })
          .then((res) => {
            if (!res.ok) {
              if (opt?.noRetry) {
                file.close();
                this.rm();
              } else reject(res.status);
            }
            res.body.pipe(file, { end: true });
            file.on("close", resolve);
          })
          .catch(reject);
      });
      if (opt && "onReDownload" in opt) {
        opt.onReDownload(this);
      }
    }
    return this;
  }
  /**Sets the execution bit on a set file, used on Linux and Mac systems */
  chmod() {
    if (type() != "Windows_NT" && this.exists())
      execSync(`chmod +x "${this.sysPath()}"`);
  }
  /**Writes data to file. Automatically converts JSON objects to parsable strings before saving them*/
  write(data: string | ArrayBuffer | object) {
    if (typeof data == "object") data = jsonEncode(data);
    writeFileSync(this.sysPath(), data);
  }
  /**Loads a json object from the file system and adds some shortcut functions to make it easier to save. */
  load<T>(def: T, serializer: (raw: T) => T = (raw) => raw) {
    const obj: T = this.exists()
      ? serializer(this.toJSON<T>())
      : serializer(def);
    return this.wrap(obj);
  }
  /**Turns an object into a wrappedObj. Essentially this just adds functions to make it easier to save. */
  wrap<T>(obj: T) {
    const result = obj as T & WrappedObj;
    result.getFile = () => this;
    result.save = () => this.write(result);
    return result;
  }

  unzip(path: Dir, opt: { exclude?: string[], include?: string[], zipDir?: Dir } = {}) {
    const com = ["x", this.sysPath(), "-y", "-o" + path.sysPath()];

    if (opt.include) {
      opt.include.forEach((e) => {
        let f = String(e);
        if (f.endsWith("/")) f += "*";
        com.push(f);
      });
    }
    if (opt.exclude) {
      opt.exclude.forEach((e) => {
        let f = String(e);
        if (f.endsWith("/")) f += "*";
        com.push("-xr!" + f);
      });
    }
    return new Promise<void>((e) => {
      const s = spawn(get7zip(opt.zipDir || zipDirectory).sysPath(), com, {
        cwd: join(this.getDir().sysPath()),
        env: process.env,
      });
      s.on("exit", e);
    });
  }

  isExecutable(): Promise<boolean> {
    return new Promise((res) =>
      access(this.sysPath(), constants.F_OK, (err) => res(err ? false : true)),
    );
  }
}

export interface WrappedObj {
  save: () => void;
  getFile: () => File;
}

let zipDirectory = Dir.tmpdir().getDir("gfsl");

export function getRealCpuArch() {
  let architecture = arch(); //ProgramFiles(Arm)
  if (platform() == "win32") {
    if ("ProgramFiles(Arm)" in process.env) architecture = "arm64"; //For arm64
    else if ("PROCESSOR_ARCHITEW6432" in process.env)
      architecture = "x64"; //For AMD64 with 32-bit node
    else if (architecture != "x64") architecture = "x86"; //To filter out ia32 or x32 and translate that to x86
  }
  return architecture;
}
const osMap = {
  "darwin": "osx",
  "win32": "windows",
  "linux": "linux"
}
export async function download7zip(opt:
  {
    dir?: Dir,
    os?: "linux" | "windows" | "osx",
    arch?: "arm" | "arm64" | "x32" | "x64",
    z7Repo?: string
  }
) {
  const dir = opt.dir || zipDirectory;


  const os = opt.os || osMap[platform()] || platform();
  const architexture = opt.arch || getRealCpuArch();
  let z7Repo = opt.z7Repo || "https://download.hanro50.net.za/7-zip"
  if (!z7Repo.endsWith("/")) z7Repo += "/";
  const timeChk = Date.now();
  zipDirectory = dir;
  const chkDef = { _ver: "22.01", data: {} };
  console.log("[GFSL]: Checking 7zip");
  const loc = dir.getDir("7z");

  let chk: {
    _ver: string;
    data: { [key: string]: { size: number; sha1: string } };
  } = chkDef;
  const chkFile = loc.getFile("hash.json");
  let fNew = true;
  if (chkFile.exists()) {
    fNew = false;
    try {
      chk = chkFile.toJSON();
    } catch {
      /* empty */
    }

    try {
      if (chk?._ver != chkDef._ver) {
        loc.rm().mkdir();
        chkFile.rm();
        chk = chkDef;
      }
    } catch {
      /* empty */
    }
  } else loc.mkdir();
  const onReDownload = (file: File, key: string) => {
    console.log("Re-downloading " + file.sysPath());
    const old = JSON.stringify(chk.data[key]);
    chk.data[key] = { size: file.getSize(), sha1: file.getHash() };
    console.log(old + " vs " + JSON.stringify(chk.data[key]));
    if (!fNew) {
      console.warn(
        "The files may have been tampered with!\nSet check file to be rewritten",
      );
      fNew = true;
      //chkFile.rm();
    }
  };
  const manifest = loc.getFile("index.json");

  const link = `${z7Repo}${os}/${architexture}/`;
  console.log(link)

  const f = await manifest.download(link + "index.json", chk.data["index"], {
    onReDownload: (f) => onReDownload(f, "index"),
  });
  // chk.data["index"] = { size: f.getSize(), sha1: f.getHash() }
  const m = f.toJSON<{ _main: string;[key: string]: string }>();
  const _main = m._main;
  for (const key of Object.keys(m)) {
    console.log(key);
    if (key == "_main") continue;
    const obj = m[key];
    const f = await loc.getFile(key).download(link + obj, chk.data[key], {
      onReDownload: (f) => onReDownload(f, key),
    });
    if (key == _main) f.chmod();
  }
  if (fNew) chkFile.write(chk);

  console.log("Zip file check took " + (Date.now() - timeChk) + " ms");
}
export function packAsync(
  pathToDirOrFile: string,
  pathToArchive: string,
  zipDir?: Dir,
) {
  const com = ["a", "-r", pathToArchive, pathToDirOrFile];
  return new Promise<void>((e) => {
    const s = spawn(get7zip(zipDir || zipDirectory).sysPath(), com, { env: process.env });
    s.on("exit", e);
  });
}
export function jsonEncode(json: object) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  return JSON.stringify(json, "\n", "\t");
}