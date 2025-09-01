import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import UnoCSS from "unocss/vite";

export default defineConfig({
  root: "src",
  base: "./",
    define: {
    '__BUILD_TIME__': '"1756083357864"',
    '__VERSION_TYPE__': '"permanent"'
  },


































  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === "webview",
        },
      },
    }),
    UnoCSS(),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/renderer"),
    emptyOutDir: true,
    rollupOptions: {
      external: (id) => {
        // 排除原始脚本文件，不打包进去
        return id.includes('_origin.cjs') || id.includes('_origin.js');
      }
    }
  },
  server: { 
    port: 5173
  },
});
