import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Groups parsed from Groups 1 .docx (50 groups, names only)
const DOC1_GROUPS = [
  "Egypt Call Centers",
  "Vodafone UK and IE",
  "Job Offers",
  "German Speakers Jobs in Egypt (Deutsche Jobs in Ägypten)",
  "Call Center Find Jobs in Egypt",
  "French Speakers Jobs in Egypt",
  "French Speakers",
  "French speakers in Cairo",
  "German speakers",
  "German Speakers Jobs & Courses In Egypt",
  "Fluent English speakers jobs and vacancies In Egypt وظائف",
  "German Speakers Community",
  "German Speakers رابطة متحدثي اللغة الألمانية",
  "Jobs Call Center In Egypt",
  "German Jobs and German Learners in Egypt",
  "Jobs for German speakers in Egypt",
  "German Speakers Jobs for Call Center in Egypt",
  "Call center offers",
  "German Speakers",
  "Call Center Jobs ( Messenger )",
  "call center jobs for English speakers in Egypt",
  "Hiring For All Egypt",
  "Wuzzafny - وظفني",
  "German Speakers Jobs & Courses",
  "jobs in egypt - وظائف في مصر",
  "We're hiring - Jobs in Egypt",
  "Call Center Jobs, Vacancies, Recruitment & Offers [English, Spanish, German]",
  "Call center men in Egypt",
  "We're hiring! (English accounts)",
  "Call Center Jobs for English Speakers in Egypt",
  "Jobs for English Speakers in Egypt",
  "Egypt Excellent & Fluent Speakers Jobs",
  "English Speakers Community",
  "Jobs in Egypt",
  "CALL CENTER (CAREERS)",
  "Call Center Jobs ( وحوش السماعات )",
  "شغل وظائف job call center",
  "Customer services Jobs",
  "Jobs in Egypt (2)",
  "Jobs for Native English Speakers in EGYPT",
  "Job 4 u",
  "شغل",
  "وظائف في مصر - Jobs in Egypt",
  "Call Center Job Offers in Egypt",
  "Full Time Part Time Jobs in Egypt",
  "وظائف الكول سنتر call center jobs",
  "Concentrix job opportunities",
  "Job Seekers Egypt",
  "Vacancies",
  "Call center helpers",
].map((name) => ({ name, url: null as string | null, source: "doc1" }));

// Groups parsed from Groups 2.docx (49 groups, 10 with URLs)
const DOC2_GROUPS: { name: string; url: string | null; source: string }[] = [
  { name: "شغل و وظايف", url: "https://www.facebook.com/groups/1253239304794299/", source: "doc2" },
  { name: "تلى سيلز - Telesales", url: null, source: "doc2" },
  { name: "Wuzzfny سفير الشغل", url: null, source: "doc2" },
  { name: "البحث عن وظيفه - Looking for a job", url: null, source: "doc2" },
  { name: "Jobs in Cairo", url: null, source: "doc2" },
  { name: "Jobs in Egypt", url: null, source: "doc2" },
  { name: "وظائف Jobs", url: "https://www.facebook.com/groups/720951205414239/", source: "doc2" },
  { name: "وظائف كول سنتر 2023", url: "https://www.facebook.com/groups/6141467269202299/", source: "doc2" },
  { name: "Group (3064722367129753)", url: "https://www.facebook.com/groups/3064722367129753/", source: "doc2" },
  { name: "كول سنتر مصـر ( خدمه عملاء )", url: "https://www.facebook.com/groups/420051268023822/", source: "doc2" },
  { name: "وظائف كول سنتر", url: "https://www.facebook.com/groups/417730378651471/", source: "doc2" },
  { name: "شغل كول سنتر", url: null, source: "doc2" },
  { name: "وظائف مدينة اكتوبر وزايد", url: null, source: "doc2" },
  { name: "Jobs in Cairo & Egypt - وظائف في القاهرة و مصر", url: null, source: "doc2" },
  { name: "Egypt Call Center Syndicate", url: null, source: "doc2" },
  { name: "Jobs & Freelance in Egypt", url: "https://www.facebook.com/groups/1872154666443002/", source: "doc2" },
  { name: "Jobtalk Egypt", url: "https://www.facebook.com/groups/5796625813762960/", source: "doc2" },
  { name: "Group (681550315596377)", url: "https://www.facebook.com/groups/681550315596377/", source: "doc2" },
  { name: "وظائف في مصر - Jobs in Egypt", url: null, source: "doc2" },
  { name: "Job 4 u (2)", url: "https://www.facebook.com/groups/job4uuu/", source: "doc2" },
  { name: "Dream Job In Egypt", url: "https://www.facebook.com/groups/375900543568598/", source: "doc2" },
  { name: "Job Seekers", url: null, source: "doc2" },
  { name: "jobs in egypt - وظائف في مصر (2)", url: null, source: "doc2" },
  { name: "french speakers in cairo", url: null, source: "doc2" },
  { name: "German speakers (2)", url: null, source: "doc2" },
  { name: "German Speakers association in Egypt - رابطة متحدثي الالمانيه في مصر", url: null, source: "doc2" },
  { name: "وظائف خالية", url: null, source: "doc2" },
  { name: "وظائف خاليه للجميع", url: null, source: "doc2" },
  { name: "وظائف خاليه", url: "https://www.facebook.com/groups/egyfreejobs/", source: "doc2" },
  { name: "وظائف خاليه في القاهره", url: null, source: "doc2" },
  { name: "وظائف مصر", url: null, source: "doc2" },
  { name: "وظائف القاهره الجديده", url: null, source: "doc2" },
  { name: "وظائف القاهرة", url: null, source: "doc2" },
  { name: "Summer Training & Jobs Group", url: null, source: "doc2" },
  { name: "Jobs (2)", url: null, source: "doc2" },
  { name: "Expats In Egypt", url: null, source: "doc2" },
  { name: "Jobs in Egypt, Cairo", url: null, source: "doc2" },
  { name: "Expats Community in Egypt", url: null, source: "doc2" },
  { name: "وظائف", url: null, source: "doc2" },
  { name: "وظائف خاليه (2)", url: null, source: "doc2" },
  { name: "Bank Jobs Recruitment", url: null, source: "doc2" },
  { name: "Jobs (3)", url: null, source: "doc2" },
  { name: "Jobs for Native English Speakers in EGYPT (2)", url: null, source: "doc2" },
  { name: "English Speakers jobs in Egypt", url: null, source: "doc2" },
  { name: "English Speakers Community (2)", url: null, source: "doc2" },
  { name: "English Speakers in Egypt", url: null, source: "doc2" },
  { name: "Foreigners Living In Egypt - اجانب عايشين في مصر", url: null, source: "doc2" },
  { name: "Egypt cold callers", url: null, source: "doc2" },
  { name: "fluent english speakers", url: null, source: "doc2" },
];

export async function POST() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  // Check if already imported
  const existing = await prisma.facebookGroup.count();
  if (existing > 0) {
    return Response.json(
      { error: "Groups already imported. Delete existing groups first if you want to re-import." },
      { status: 409 }
    );
  }

  const allGroups = [...DOC1_GROUPS, ...DOC2_GROUPS];

  const result = await prisma.facebookGroup.createMany({
    data: allGroups,
    skipDuplicates: true,
  });

  return Response.json({ created: result.count });
}
