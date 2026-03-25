import type { APIRoute } from "astro";
import { Resend } from "resend";

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

const TO_EMAIL = "impressionzoutdoors@gmail.com";
const FROM_EMAIL = "noreply@impressionz.co.nz";

const yesNo = (v: string) => (v === "yes" ? "Yes" : "No");

const hiringLabels: Record<string, string> = {
  researching: "Just researching",
  thinking: "Thinking about it",
  might_hire: "Likely to hire",
  going_to_hire: "Ready to proceed",
};

export const POST: APIRoute = async ({ request }) => {
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  const name = data.get("name")?.toString().trim();
  const email = data.get("email")?.toString().trim();
  const phone = data.get("phone")?.toString().trim();
  const suburb = data.get("suburb")?.toString().trim();
  const propertyOwner = data.get("propertyOwner")?.toString();
  const wasteRemoval = data.get("wasteRemoval")?.toString();
  const plantsPurchasing = data.get("plantsPurchasing")?.toString();
  const hiringDecision = data.get("hiringDecision")?.toString();
  const additionalDetails = data.get("additionalDetails")?.toString().trim();
  const photos = data.getAll("photos").filter((f) => f instanceof File && f.size > 0) as File[];

  if (!name || !email || !suburb || !propertyOwner || !wasteRemoval || !plantsPurchasing || !hiringDecision) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 12px;background:#f4f6f0;font-weight:600;width:200px;vertical-align:top">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${value}</td></tr>`;

  const html = `
    <h2 style="font-family:serif;color:#006400;margin-bottom:16px">New enquiry — ImpressioNZ Outdoors</h2>
    <table style="border-collapse:collapse;width:100%;max-width:620px;font-family:sans-serif;font-size:14px">
      ${row("Name", name)}
      ${row("Email", `<a href="mailto:${email}">${email}</a>`)}
      ${row("Phone", phone || "Not provided")}
      ${row("Suburb / address", suburb)}
      ${row("Property owner?", yesNo(propertyOwner))}
      ${row("Waste removal needed?", yesNo(wasteRemoval))}
      ${row("Plants purchasing needed?", yesNo(plantsPurchasing))}
      ${row("How soon to proceed?", hiringLabels[hiringDecision] ?? hiringDecision)}
      ${additionalDetails ? row("Additional details", additionalDetails.replace(/\n/g, "<br>")) : ""}
      ${photos.length > 0 ? row("Photos", `${photos.length} attached`) : ""}
    </table>
    <p style="margin-top:24px;font-size:12px;color:#9ca3af">Sent from impressionz.co.nz contact form</p>
  `;

  // Build attachments from uploaded files
  const attachments = await Promise.all(
    photos.map(async (file) => ({
      filename: file.name,
      content: Buffer.from(await file.arrayBuffer()),
    }))
  );

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    replyTo: email,
    subject: `New enquiry from ${name} — ${suburb}`,
    html,
    attachments,
  });

  if (error) {
    console.error("Resend error:", error);
    return new Response(JSON.stringify({ error: "Failed to send message" }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
