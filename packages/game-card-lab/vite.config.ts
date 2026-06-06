import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: () => "game-card-lab.js"
    },
    rollupOptions: {
      output: {
        assetFileNames: "game-card-lab[extname]"
      }
    }
  }
});
