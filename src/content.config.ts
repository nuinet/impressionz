import { defineCollection } from "astro:content";
import { z } from "zod";
import { glob } from "astro/loaders";

const gallery = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/gallery" }),
  schema: z.object({
    image: z.string().optional(),
    alt: z.string(),
    caption: z.string().optional().default(""),
    order: z.number().default(99),
    mediaType: z.enum(["image", "video"]).default("image"),
    videoUrl: z.string().optional(),
  }),
});

const home = defineCollection({
  loader: glob({ pattern: "home.yaml", base: "./src/content/pages" }),
  schema: z.object({
    heroTitle: z.string(),
    heroSubtitle: z.string(),
    aboutBody: z.string(),
    ctaHeading: z.string(),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/testimonials" }),
  schema: z.object({
    quote: z.string(),
    name: z.string(),
    suburb: z.string(),
    order: z.number().default(99),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/services" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    detail: z.string(),
    order: z.number().default(99),
  }),
});

const contact = defineCollection({
  loader: glob({ pattern: "contact.yaml", base: "./src/content/pages" }),
  schema: z.object({
    phone: z.string(),
    email: z.string(),
    facebookUrl: z.string(),
    facebookLabel: z.string(),
    serviceArea: z.string(),
    depositNote: z.string(),
  }),
});

const terms = defineCollection({
  loader: glob({ pattern: "terms.yaml", base: "./src/content/pages" }),
  schema: z.object({
    items: z.array(z.object({
      heading: z.string(),
      body: z.string(),
    })),
  }),
});

export const collections = { gallery, home, testimonials, services, contact, terms };
