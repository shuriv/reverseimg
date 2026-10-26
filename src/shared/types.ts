export const SETTINGS_VERSION = 1;

export type ReverseEngineId =
  | "googleLens"
  | "bing"
  | "yandex"
  | "tineye"
  | "saucenao";

export type KeywordEngineId =
  | "googleImages"
  | "bingImages"
  | "yandexImages"
  | "duckduckgo"
  | "braveImages";

export type Theme = "system" | "light" | "dark";

export interface Settings {
  version: number;
  reverse: {
    enabled: ReverseEngineId[];
    order: ReverseEngineId[];
    default: ReverseEngineId;
  };
  keyword: {
    enabled: KeywordEngineId[];
    order: KeywordEngineId[];
    default: KeywordEngineId;
  };
  behavior: {
    openInNewTab: boolean;
    showContextSubmenu: boolean;
    rememberLastEngine: boolean;
    theme: Theme;
  };
  last: {
    keyword?: KeywordEngineId;
    reverse?: ReverseEngineId;
  };
}

export interface PendingUpload {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  size: number;
  createdAt: number;
}

export interface UploadInput {
  blob: Blob;
  name: string;
  type: string;
  size: number;
}

export type UploadField =
  | { kind: "file"; name: string }
  | { kind: "hidden"; name: string; value: string };

export interface UploadFormSpec {
  action: string;
  method: "POST";
  enctype: "multipart/form-data" | "application/x-www-form-urlencoded";
  fields: UploadField[];
}

export interface UploadAdapter {
  maxBytes: number;
  build: (file: UploadInput) => Promise<UploadFormSpec> | UploadFormSpec;
}

export interface ReverseEngine {
  id: ReverseEngineId;
  name: string;
  homepage: string;
  color: string;
  urlSearch: (imageUrl: string) => string;
  upload?: UploadAdapter;
}

export interface KeywordEngine {
  id: KeywordEngineId;
  name: string;
  homepage: string;
  color: string;
  searchUrl: (query: string) => string;
}
