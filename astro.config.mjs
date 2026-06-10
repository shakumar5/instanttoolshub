// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Recursively find all .html files in a directory */
async function findHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

/** Astro integration to strip HTML comments and collapse excess whitespace */
function htmlPostProcess() {
  return {
    name: 'html-post-process',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const distPath = dir.pathname.replace(/^\/([A-Z]:)/, '$1');
        const htmlFiles = await findHtmlFiles(distPath);
        for (const file of htmlFiles) {
          let html = await readFile(file, 'utf-8');
          // Remove HTML comments (but preserve conditional comments <!--[if ...)
          html = html.replace(/<!--(?!\[if )[\s\S]*?-->/g, '');
          // Collapse multiple whitespace between tags to single space
          html = html.replace(/>\s{2,}</g, '> <');
          await writeFile(file, html, 'utf-8');
        }
      }
    }
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://instanttoolshub.com',
  compressHTML: true,
  integrations: [sitemap(), htmlPostProcess()],
  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    build: {
      cssMinify: true,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  },
});
