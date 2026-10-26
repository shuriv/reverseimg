import type {
  KeywordEngine,
  KeywordEngineId,
  ReverseEngine,
  ReverseEngineId,
  UploadFormSpec
} from "./types";

export const ALL_REVERSE_IDS: ReverseEngineId[] = [
  "googleLens",
  "bing",
  "yandex",
  "tineye",
  "saucenao"
];

export const ALL_KEYWORD_IDS: KeywordEngineId[] = [
  "googleImages",
  "bingImages",
  "yandexImages",
  "duckduckgo",
  "braveImages"
];

function query(value: string): string {
  return encodeURIComponent(value);
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

function bingUploadAction(name: string): string {
  const params = new URLSearchParams({
    view: "detailv2",
    iss: "sbiupload",
    FORM: "SBIHMP",
    sbifnm: name
  });
  return `https://www.bing.com/images/search?${params.toString()}`;
}

async function bingUpload(file: {
  blob: Blob;
  name: string;
}): Promise<UploadFormSpec> {
  return {
    action: bingUploadAction(file.name),
    method: "POST",
    enctype: "application/x-www-form-urlencoded",
    fields: [
      {
        kind: "hidden",
        name: "imageBin",
        value: await blobToBase64(file.blob)
      }
    ]
  };
}

export const reverseEngines: ReverseEngine[] = [
  {
    id: "googleLens",
    name: "Google Lens",
    homepage: "https://lens.google.com/",
    color: "#4285f4",
    urlSearch: (imageUrl) =>
      `https://lens.google.com/uploadbyurl?url=${query(imageUrl)}`,
    upload: {
      maxBytes: 20 * 1024 * 1024,
      build: () => ({
        action: "https://lens.google.com/v3/upload",
        method: "POST",
        enctype: "multipart/form-data",
        fields: [{ kind: "file", name: "encoded_image" }]
      })
    }
  },
  {
    id: "bing",
    name: "Bing",
    homepage: "https://www.bing.com/images",
    color: "#008373",
    urlSearch: (imageUrl) => {
      const params = new URLSearchParams({
        q: `imgurl:${imageUrl}`,
        view: "detailv2",
        iss: "sbi"
      });
      return `https://www.bing.com/images/search?${params.toString()}`;
    },
    upload: {
      maxBytes: 4 * 1024 * 1024,
      build: bingUpload
    }
  },
  {
    id: "yandex",
    name: "Yandex",
    homepage: "https://yandex.com/images/",
    color: "#fc3f1d",
    urlSearch: (imageUrl) =>
      `https://yandex.com/images/search?rpt=imageview&url=${query(imageUrl)}`
  },
  {
    id: "tineye",
    name: "TinEye",
    homepage: "https://tineye.com/",
    color: "#1b1b1b",
    urlSearch: (imageUrl) => `https://tineye.com/search?url=${query(imageUrl)}`,
    upload: {
      maxBytes: 20 * 1024 * 1024,
      build: () => ({
        action: "https://tineye.com/search",
        method: "POST",
        enctype: "multipart/form-data",
        fields: [
          { kind: "file", name: "image" },
          { kind: "hidden", name: "sort", value: "score" },
          { kind: "hidden", name: "order", value: "desc" }
        ]
      })
    }
  },
  {
    id: "saucenao",
    name: "SauceNAO",
    homepage: "https://saucenao.com/",
    color: "#f28c28",
    urlSearch: (imageUrl) =>
      `https://saucenao.com/search.php?url=${query(imageUrl)}`,
    upload: {
      maxBytes: 10 * 1024 * 1024,
      build: () => ({
        action: "https://saucenao.com/search.php",
        method: "POST",
        enctype: "multipart/form-data",
        fields: [
          { kind: "file", name: "file" },
          { kind: "hidden", name: "db", value: "999" },
          { kind: "hidden", name: "hide", value: "0" }
        ]
      })
    }
  }
];

export const keywordEngines: KeywordEngine[] = [
  {
    id: "googleImages",
    name: "Google Images",
    homepage: "https://images.google.com/",
    color: "#4285f4",
    searchUrl: (text) =>
      `https://www.google.com/search?tbm=isch&q=${query(text)}`
  },
  {
    id: "bingImages",
    name: "Bing Images",
    homepage: "https://www.bing.com/images",
    color: "#008373",
    searchUrl: (text) => `https://www.bing.com/images/search?q=${query(text)}`
  },
  {
    id: "yandexImages",
    name: "Yandex Images",
    homepage: "https://yandex.com/images/",
    color: "#fc3f1d",
    searchUrl: (text) => `https://yandex.com/images/search?text=${query(text)}`
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo",
    homepage: "https://duckduckgo.com/",
    color: "#de5833",
    searchUrl: (text) =>
      `https://duckduckgo.com/?q=${query(text)}&iax=images&ia=images`
  },
  {
    id: "braveImages",
    name: "Brave Images",
    homepage: "https://search.brave.com/images",
    color: "#fb542b",
    searchUrl: (text) => `https://search.brave.com/images?q=${query(text)}`
  }
];

export const reverseEngineMap = new Map(
  reverseEngines.map((engine) => [engine.id, engine])
);
export const keywordEngineMap = new Map(
  keywordEngines.map((engine) => [engine.id, engine])
);

export function getReverseEngine(id: string): ReverseEngine | undefined {
  return reverseEngineMap.get(id as ReverseEngineId);
}

export function getKeywordEngine(id: string): KeywordEngine | undefined {
  return keywordEngineMap.get(id as KeywordEngineId);
}

export function isReverseEngineId(value: unknown): value is ReverseEngineId {
  return typeof value === "string" && reverseEngineMap.has(value as ReverseEngineId);
}

export function isKeywordEngineId(value: unknown): value is KeywordEngineId {
  return typeof value === "string" && keywordEngineMap.has(value as KeywordEngineId);
}
