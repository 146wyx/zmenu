import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

const minecraftItems = () => {
    const moduleId = 'virtual:minecraft-item-classes';
    const resolvedModuleId = `\0${moduleId}`;

    return {
        name: 'minecraft-item-classes',
        resolveId(id) {
            return id === moduleId ? resolvedModuleId : null;
        },
        load(id) {
            if (id !== resolvedModuleId) return null;

            const icons = readFileSync(resolve(projectRoot, 'resources/sass/minecraft-icons.scss'), 'utf8');
            const classNames = Array.from(new Set(Array.from(
                icons.matchAll(/\.icon-minecraft-([a-z0-9-]+)\{/g),
                (match) => `icon-minecraft-${match[1]}`,
            )));

            return `export default ${JSON.stringify(classNames)};`;
        },
    };
};

export default defineConfig({
    root: resolve(projectRoot, 'standalone'),
    base: './',
    publicDir: false,
    plugins: [react(), minecraftItems()],
    build: {
        outDir: resolve(projectRoot, '..'),
        emptyOutDir: false,
        assetsDir: 'editor-assets',
        sourcemap: false,
        cssCodeSplit: false,
        lib: {
            entry: resolve(projectRoot, 'standalone/src/main.jsx'),
            name: 'ZMenuEditor',
            formats: ['iife'],
            fileName: () => 'zmenu-editor',
            cssFileName: 'zmenu-editor',
        },
        rollupOptions: {
            output: {
                entryFileNames: 'editor-assets/zmenu-editor.js',
                assetFileNames: 'editor-assets/[name][extname]',
                inlineDynamicImports: true,
            },
        },
    },
});
