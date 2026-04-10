import { parse } from "node-html-parser";

const FEED_URL = `${import.meta.env.PUBLIC_WORKER_URL}/feed`;

export interface SubstackPost {
  slug: string;
  title: string;
  date: string;
  description: string;
  content: string;
  link: string;
  thumbnail: string | null;
  enclosureType: string | null;
}

function extractSlug(link: string): string {
  const match = link.match(/\/p\/([^/?#]+)/);
  return match ? match[1] : "";
}

function extractFirstImage(html: string): string | null {
  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  return match ? match[1] : null;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function sanitizeContent(html: string): string {
  if (!html.trim()) return html;
  const root = parse(html);

  // Remove Substack subscription widgets
  root.querySelectorAll(".subscription-widget-wrap-editor, .subscription-widget-wrap, .subscription-widget").forEach(el => el.remove());

  // Remove Substack subscribe CTA divs
  root.querySelectorAll("[data-component-name='SubscribeWidgetToDOM']").forEach(el => el.remove());

  // Remove "Thanks for reading" / subscribe nudge paragraphs
  root.querySelectorAll("p").forEach(p => {
    const text = p.text.toLowerCase();
    if (text.includes("subscribe for free") || text.includes("thanks for reading")) {
      p.remove();
    }
  });

  return root.innerHTML;
}

function getField(itemXml: string, tag: string): string {
  // CDATA
  const cdata = itemXml.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`)
  );
  if (cdata) return cdata[1];
  // Plain
  const plain = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return plain ? plain[1].trim() : "";
}

function parseItems(xml: string): SubstackPost[] {
  const posts: SubstackPost[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;

  while ((m = itemRe.exec(xml)) !== null) {
    const item = m[1];

    // <link> in RSS 2.0 is a text node between tags (not an attribute)
    const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
    const link = linkMatch ? linkMatch[1].trim() : "";

    const slug = extractSlug(link);
    if (!slug) continue;

    const content = sanitizeContent(getField(item, "content:encoded") || getField(item, "description"));
    const description = stripTags(getField(item, "description")).slice(0, 200);
    const enclosureMatch = item.match(/<enclosure[^>]+type="([^"]+)"/);
    const enclosureType = enclosureMatch ? enclosureMatch[1] : null;

    posts.push({
      slug,
      title: getField(item, "title") || "Untitled",
      date: getField(item, "pubDate"),
      description,
      content,
      link,
      thumbnail: extractFirstImage(content),
      enclosureType,
    });
  }

  return posts;
}

export async function getPosts(): Promise<SubstackPost[]> {
  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) {
      console.warn(`[substack] Feed returned ${res.status}`);
      return [];
    }
    const xml = await res.text();
    return parseItems(xml);
  } catch (e) {
    console.warn("[substack] Feed fetch failed:", e);
    return [];
  }
}

export async function getPost(slug: string): Promise<SubstackPost | null> {
  const posts = await getPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}
