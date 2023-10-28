export interface DownloadableFile {
    name: string;
    path: string[];
    url: string;
    key: string;
    chk: {
        sha1?: string | string[];
        size?: number;
    };
    unzip?: {
        file: string[];
        exclude?: string[];
    };
    noRetry?: true;
    executable?: boolean | string;
    dynamic?: boolean;
}
