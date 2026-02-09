import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// Plugin to generate version.json during build
const versionPlugin = () => ({
  name: 'version-generator',
  buildStart() {
    const versionInfo = {
      version: "1.0.0",
      buildTime: new Date().toISOString(),
    };
    
    const versionPath = path.resolve(__dirname, 'public/version.json');
    fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));
    console.log('Generated version.json:', versionInfo);
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    versionPlugin()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
