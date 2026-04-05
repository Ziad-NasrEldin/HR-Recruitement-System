import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import type { GradReq, WorkModel, OfferStatus, Prisma } from "@/generated/prisma/client";

function parseStatus(header: string): OfferStatus {
  const h = String(header).toLowerCase().trim();
  return h.includes("hold") ? "ON_HOLD" : "ACTIVE";
}

function parseGradReq(val: string): GradReq {
  const v = String(val).toLowerCase();
  if (v.includes("undergrad")) return "ANY";
  if (v.includes("grad")) return "GRADUATE";
  return "ANY";
}

function parseWorkModel(location: string): WorkModel {
  const l = String(location).toLowerCase();
  if (l.includes("wfh") || l.includes("work from home") || l.includes("remote") || l.includes("from home"))
    return "WFH";
  if (l.includes("hybrid")) return "HYBRID";
  return "ON_SITE";
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const toCreate: Prisma.OfferCreateManyInput[] = [];
  let skippedCount = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });

    if (rows.length < 2) continue;

    const company = sheetName.trim();
    const headerRow = rows[0];

    for (let col = 1; col < headerRow.length; col++) {
      const statusStr = String(headerRow[col] ?? "").trim();
      if (!statusStr) continue;

      const getValue = (label: string): string => {
        const row = rows.find((r) =>
          String(r[0] ?? "")
            .toLowerCase()
            .trim()
            .includes(label.toLowerCase())
        );
        return row ? String(row[col] ?? "").trim() : "";
      };

      const language = getValue("language");
      if (!language) {
        skippedCount++;
        continue;
      }

      const accountType = getValue("acount") || getValue("account") || "General";
      const gradStr = getValue("graduation");
      const locationStr = getValue("location");
      const interviewStr = getValue("interview");
      const processStr = getValue("process");
      const offerDetails = getValue("offer detail") || getValue("offer");
      const formLink = getValue("form");

      toCreate.push({
        company,
        status: parseStatus(statusStr),
        language,
        accountType,
        graduationRequirement: parseGradReq(gradStr),
        location: locationStr || "TBD",
        workModel: parseWorkModel(locationStr),
        salaryDetails: { min: 0, max: 0, currency: "EGP" },
        workingHours: "",
        shift: "",
        daysOff: "",
        benefits: offerDetails,
        interviewProcess: [interviewStr, processStr].filter(Boolean).join("\n"),
        formLink: formLink || null,
        commissionAmount: 0,
        commissionCurrency: "EGP",
        commissionPeriodDays: 30,
        requirements: null,
      });
    }
  }

  if (toCreate.length === 0) {
    return Response.json({ error: "No valid offers found in file" }, { status: 400 });
  }

  try {
    const result = await prisma.offer.createMany({ data: toCreate });
    return Response.json({ created: result.count, skipped: skippedCount });
  } catch (err) {
    console.error("Import offers error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
