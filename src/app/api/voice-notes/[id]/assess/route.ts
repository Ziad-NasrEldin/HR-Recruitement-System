import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ValidationStatus } from "@/generated/prisma/client";

// ─── OpenAI Assessment ─────────────────────────────────────────────────────

async function transcribeAudio(fileUrl: string): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error("OPENAI_API_KEY is not configured");

  // Fetch audio from URL and send to Whisper
  const audioResponse = await fetch(fileUrl);
  if (!audioResponse.ok) {
    throw new Error(`Failed to fetch audio file: ${audioResponse.statusText}`);
  }

  const audioBuffer = await audioResponse.arrayBuffer();
  const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.mp3");
  formData.append("model", "whisper-1");
  formData.append("response_format", "text");

  const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: formData,
  });

  if (!whisperRes.ok) {
    const err = await whisperRes.text();
    throw new Error(`Whisper API error: ${err}`);
  }

  return (await whisperRes.text()).trim();
}

interface AssessmentResult {
  englishLevel: string;
  accentNotes: string;
  overallScore: "PASS" | "FAIL" | "BORDERLINE";
  validationStatus: ValidationStatus;
  summary: string;
}

async function scoreEnglish(
  transcription: string,
  language: string
): Promise<AssessmentResult> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error("OPENAI_API_KEY is not configured");

  const systemPrompt = `You are an expert English language proficiency assessor for HR recruitment.
Your job is to evaluate a candidate's spoken English based on a transcription of their voice note.
The candidate's target language for the job is: ${language}.

Evaluate and return ONLY a valid JSON object with these fields:
- englishLevel: one of "A2", "B1", "B2", "C1", "C2" (CEFR scale)
- accentNotes: brief observation about accent/pronunciation (1-2 sentences)
- overallScore: one of "PASS", "FAIL", "BORDERLINE"
  - PASS: B2 or above, clear communication
  - BORDERLINE: B1 with good potential, minor fluency issues
  - FAIL: A2 or below, significant comprehension barriers
- summary: 2-3 sentence overall assessment

Respond with ONLY the JSON object, no markdown, no explanation.`;

  const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Evaluate this English voice note transcription:\n\n"${transcription}"`,
        },
      ],
    }),
  });

  if (!chatRes.ok) {
    const err = await chatRes.text();
    throw new Error(`GPT-4o API error: ${err}`);
  }

  const chatData = await chatRes.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = chatData.choices[0]?.message?.content ?? "{}";

  let parsed: Partial<AssessmentResult>;
  try {
    parsed = JSON.parse(content) as Partial<AssessmentResult>;
  } catch {
    throw new Error("Failed to parse GPT-4o response as JSON");
  }

  const englishLevel = parsed.englishLevel ?? "B1";
  const accentNotes = parsed.accentNotes ?? "";
  const overallScore = parsed.overallScore ?? "BORDERLINE";
  const summary = parsed.summary ?? "";

  // Map overallScore → validationStatus
  const validationStatus: ValidationStatus =
    overallScore === "PASS"
      ? "APPROVED"
      : overallScore === "FAIL"
      ? "REJECTED"
      : "PENDING"; // BORDERLINE stays PENDING for human review

  return { englishLevel, accentNotes, overallScore, validationStatus, summary };
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const voiceNote = await prisma.voiceNote.findUnique({
    where: { id },
    include: { lead: { select: { recruiterId: true, language: true } } },
  });

  if (!voiceNote) {
    return Response.json({ error: "Voice note not found" }, { status: 404 });
  }

  // Recruiters can only assess their own leads' voice notes
  if (
    session.user.role === "RECRUITER" &&
    voiceNote.lead.recruiterId !== session.user.id
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "AI assessment is not configured. Please set OPENAI_API_KEY." },
      { status: 503 }
    );
  }

  try {
    // Step 1: Transcribe
    const transcription = await transcribeAudio(voiceNote.fileUrl);

    // Step 2: Score
    const assessment = await scoreEnglish(
      transcription,
      voiceNote.lead.language
    );

    // Step 3: Save results
    const updated = await prisma.voiceNote.update({
      where: { id },
      data: {
        transcription,
        englishLevel: assessment.englishLevel,
        accentNotes: `${assessment.accentNotes} ${assessment.summary}`.trim(),
        overallScore: assessment.overallScore,
        validationStatus: assessment.validationStatus,
        assessedAt: new Date(),
      },
    });

    return Response.json({ voiceNote: updated });
  } catch (err) {
    console.error("AI assess error:", err);
    const message = err instanceof Error ? err.message : "Assessment failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
