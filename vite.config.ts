import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));
const amoBuild = process.env.AMO === "1";

export default defineConfig({
  root: resolve(root, "src"),
  publicDir: resolve(root, "public"),
  build: {
    outDir: resolve(root, "dist"),
    emptyOutDir: true,
    target: "firefox142",
    minify: amoBuild ? false : true,
    sourcemap: amoBuild ? false : true,
    rollupOptions: {
      input: {
        background: resolve(root, "src/background/index.ts"),
        popup: resolve(root, "src/popup.html"),
        options: resolve(root, "src/options.html"),
        upload: resolve(root, "src/upload.html"),
        error: resolve(root, "src/error.html"),
        privacy: resolve(root, "src/privacy.html")
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "background"
            ? "background.js"
            : "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
