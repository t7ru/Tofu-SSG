import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  preview: {
    port: 1337,
    open: true,
  },
  base: "/assets/",
  build: {
    outDir: "dist/assets",
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: path.resolve(__dirname, "src/main.ts"),
      output: {
        entryFileNames: "js/[name].js",
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names[0].split("?")[0];
          if (name.endsWith(".css")) return "css/main.css";
          if (/\.(woff2?|ttf|eot|svg)$/.test(name))
            return "fonts/[name][extname]";
          return "assets/[name][extname]";
        },
      },
    },
  },
});
