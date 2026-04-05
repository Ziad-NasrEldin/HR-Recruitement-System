import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SalaryDetails {
  min?: number;
  max?: number;
  currency?: string;
}

function buildOfferContext(offer: {
  language: string;
  accountType: string;
  location: string;
  workModel: string;
  salaryDetails: unknown;
  workingHours: string;
  shift: string;
  daysOff: string;
  benefits: string;
  requirements: string | null;
  formLink: string | null;
}) {
  const salary = offer.salaryDetails as SalaryDetails;
  const salaryStr =
    salary?.min && salary?.max
      ? `${salary.min.toLocaleString()}–${salary.max.toLocaleString()} ${salary.currency ?? "EGP"}`
      : salary?.min
      ? `From ${salary.min.toLocaleString()} ${salary.currency ?? "EGP"}`
      : "Competitive";

  const workModelLabels: Record<string, string> = {
    WFH: "Work From Home",
    ON_SITE: "On Site",
    HYBRID: "Hybrid",
  };

  return `
OFFER DETAILS (DO NOT reveal the company name):
- Role type: ${offer.accountType}
- Required language: ${offer.language}
- Work model: ${workModelLabels[offer.workModel] ?? offer.workModel}
- Location: ${offer.location}
- Salary: ${salaryStr} per month
- Working hours: ${offer.workingHours}
- Shift: ${offer.shift}
- Days off: ${offer.daysOff}
- Benefits: ${offer.benefits}
${offer.requirements ? `- Requirements: ${offer.requirements}` : ""}
${offer.formLink ? `- Application link: ${offer.formLink}` : ""}
`.trim();
}

const SYSTEM_PROMPT = `You are an expert social media copywriter for HR recruitment in Egypt.
Your job is to write engaging, mysterious, and exciting Facebook post variations to attract job candidates.

STRICT RULES:
1. NEVER mention the employer company name — keep it mysterious
2. Write in Egyptian Arabic (عربي مصري) mixed with some English phrases where natural
3. Use trending Egyptian slang, relatable phrases, and cultural references
4. Make the opportunity sound exclusive and exciting — FOMO-inducing
5. Each post must end with a strong call-to-action that directs readers to the application link
6. Each post should have a different tone/angle:
   - Post 1: Mysterious & curiosity-driven ("فرصة مش هتلاقيها تاني...")
   - Post 2: Benefit-focused & aspirational (salary, perks, growth)
   - Post 3: Urgency-driven ("أماكن محدودة...")
   - Post 4: Social proof / community angle ("انضم لتيم...")
   - Post 5: Direct & punchy (short, bold, scroll-stopping)
7. Use emojis naturally throughout
8. Each post should be 3–8 sentences

Respond with ONLY a valid JSON array of 5 strings (the posts), no markdown, no explanation.
Example: ["post 1 text", "post 2 text", "post 3 text", "post 4 text", "post 5 text"]`;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only SUPER_ADMIN can use the post generator
  if (session.user.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "AI is not configured. Please set GEMINI_API_KEY." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { offerId } = body as { offerId?: string };
  if (!offerId) {
    return Response.json({ error: "offerId is required" }, { status: 400 });
  }

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: {
      id: true,
      language: true,
      accountType: true,
      location: true,
      workModel: true,
      salaryDetails: true,
      workingHours: true,
      shift: true,
      daysOff: true,
      benefits: true,
      requirements: true,
      formLink: true,
    },
  });

  if (!offer) {
    return Response.json({ error: "Offer not found" }, { status: 404 });
  }

  const offerContext = buildOfferContext(offer);

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.9 },
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(
      `Generate 5 Facebook recruitment posts for this opportunity:\n\n${offerContext}`
    );
    const content = result.response.text();

    let posts: string[];
    try {
      posts = JSON.parse(content) as string[];
      if (!Array.isArray(posts)) throw new Error("Not an array");
    } catch {
      // Fallback: try to extract array from response
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          posts = JSON.parse(match[0]) as string[];
        } catch {
          return Response.json({ error: "Failed to parse AI response" }, { status: 500 });
        }
      } else {
        return Response.json({ error: "Unexpected AI response format" }, { status: 500 });
      }
    }

    return Response.json({ posts: posts.slice(0, 5) });
  } catch (err) {
    console.error("Generate posts error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
