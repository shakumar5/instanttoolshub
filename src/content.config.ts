import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().max(100),
    description: z.string().max(160),
    author: z.string(),
    datePublished: z.date(),
    dateModified: z.date(),
    topic: z.enum(['tutorial', 'comparison', 'reference']),
    tools: z.array(z.enum([
      'json-formatter', 'base64', 'regex-tester', 'jwt-decoder',
      'hash-generator', 'url-encoder-decoder', 'timestamp',
      'markdown-editor', 'color-converter', 'code-minifier-beautifier'
    ])),
    excerpt: z.string().max(200),
  }),
});

export const collections = { blog };
