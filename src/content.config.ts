import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const gallery = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/gallery" }),
  schema: z.object({
    image: z.string(),
    alt: z.string(),
    caption: z.string().optional().default(""),
    order: z.number().default(99),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/pages" }),
  schema: z.object({
    heroTitle: z.string(),
    heroSubtitle: z.string(),
    aboutBody: z.string(),
    ctaHeading: z.string(),
  }),
});

export const collections = { gallery, pages };
