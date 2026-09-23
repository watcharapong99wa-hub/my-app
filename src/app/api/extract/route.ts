import { GoogleGenAI } from "@google/genai";

// Ported from kepup/server.ts: analyze text/image and extract opportunity details.
// Request: { text?: string, images?: [{ mimeType: string, data: string }] }
// Response: { opportunity: {...} } — mapped by the client in lib/extract.ts.

function generateFallbackTimetable(deadlineStr?: string, category = "competition") {
  const now = new Date();
  const deadline = deadlineStr
    ? new Date(deadlineStr)
    : new Date(now.getTime() + 14 * 86400000);
  const diffDays = Math.max(
    2,
    Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const d1 = new Date(now.getTime() + Math.max(1, Math.floor(diffDays * 0.2)) * 86400000);
  const d2 = new Date(now.getTime() + Math.max(2, Math.floor(diffDays * 0.45)) * 86400000);
  const d3 = new Date(now.getTime() + Math.max(3, Math.floor(diffDays * 0.75)) * 86400000);
  const dFinal = new Date(deadline.getTime() - 86400000);

  if (category === "hackathon" || category === "competition") {
    return [
      {
        id: "step-1",
        titleTh: "รวมทีมและแบ่งบทบาท (Team Formation)",
        titleEn: "Form Team & Assign Roles",
        targetDate: formatDate(d1),
        completed: false,
        description: "หาเพื่อนร่วมทีมตามทักษะที่ต้องใช้ (Coder, Designer, Pitcher) และนัดประชุมแรก",
      },
      {
        id: "step-2",
        titleTh: "ระดมความคิดและเลือกหัวข้อโครงการ (Brainstorming)",
        titleEn: "Brainstorm Project Theme & Proposal",
        targetDate: formatDate(d2),
        completed: false,
        description: "หา Problem statement และสร้าง Prototype/Idea deck เบื้องต้น",
      },
      {
        id: "step-3",
        titleTh: "ขอเอกสารรับรองจากโรงเรียน (ปพ.1 / บัตรนักเรียน)",
        titleEn: "Gather School Documents & Student IDs",
        targetDate: formatDate(d3),
        completed: false,
        description: "เตรียมเอกสารยืนยันสถานภาพนักเรียน และหนังสือยินยอมผู้ปกครอง",
        requiredDocs: ["ใบรับรอง ปพ.1", "สำเนาบัตรประชาชน / นักเรียน"],
      },
      {
        id: "step-4",
        titleTh: "ตรวจสอบข้อมูลและส่งใบสมัคร (Final Submission)",
        titleEn: "Final Review & Submit Application",
        targetDate: formatDate(dFinal),
        completed: false,
        description: "ส่งใบสมัครก่อนกำหนด 24 ชม. เพื่อป้องกันระบบล่ม พร้อมบันทึกหลักฐานการส่ง",
      },
    ];
  }
  return [
    {
      id: "step-1",
      titleTh: "ตรวจสอบเกณฑ์และเตรียมเอกสาร",
      titleEn: "Review Requirements & Prepare Documents",
      targetDate: formatDate(d1),
      completed: false,
      description: "ตรวจเช็คคุณสมบัติและรวบรวมเอกสารที่ต้องใช้",
    },
    {
      id: "step-2",
      titleTh: "จัดเตรียมผลงานและใบสมัคร",
      titleEn: "Prepare Portfolio & Application",
      targetDate: formatDate(d2),
      completed: false,
      description: "เตรียมผลงานและกรอกใบสมัครให้ครบถ้วน",
    },
    {
      id: "step-3",
      titleTh: "ตรวจทานและส่งใบสมัคร",
      titleEn: "Final Review & Submit",
      targetDate: formatDate(dFinal),
      completed: false,
      description: "ตรวจสอบทุกอย่างอีกครั้งแล้วกดส่งก่อนกำหนด",
    },
  ];
}

function fallbackRuleExtractor(text = "", url = "") {
  const lower = (text + " " + url).toLowerCase();

  let category = "competition";
  if (lower.includes("ค่าย") || lower.includes("camp")) category = "camp";
  else if (lower.includes("ทุน") || lower.includes("scholarship")) category = "scholarship";
  else if (lower.includes("workshop") || lower.includes("เวิร์กช็อป") || lower.includes("อบรม"))
    category = "workshop";
  else if (lower.includes("hackathon") || lower.includes("แฮกกาธอน")) category = "hackathon";
  else if (lower.includes("open house") || lower.includes("เปิดบ้าน")) category = "open_house";

  const now = new Date();
  const defaultDeadline = new Date(now.getTime() + 14 * 86400000).toISOString().split("T")[0];
  const defaultEvent = new Date(now.getTime() + 28 * 86400000).toISOString().split("T")[0];

  const titleMatch =
    text.split("\n").filter((l) => l.trim().length > 3)[0] ||
    "กิจกรรมใหม่สำหรับนักเรียน ม.ปลาย";
  const cleanTitle = titleMatch.replace(/^[#*\-•\s]+/, "").slice(0, 80);
  const online = lower.includes("online") || lower.includes("ซูม") || lower.includes("zoom");

  return {
    titleTh: cleanTitle,
    titleEn: cleanTitle,
    category,
    organizerTh: "คณะ/องค์กรผู้จัดกิจกรรม",
    organizerEn: "Event Organizer",
    deadlineDate: defaultDeadline,
    deadlineTime: "23:59",
    eventStartDate: defaultEvent,
    eventEndDate: defaultEvent,
    locationType: online ? "online" : "onsite",
    fee: lower.includes("ฟรี") || lower.includes("free")
      ? "ฟรี (ไม่มีค่าใช้จ่าย)"
      : "ฟรี หรือตามเงื่อนไขผู้จัด",
    requiredDocs: [
      "ใบ ปพ.1 (ระเบียนแสดงผลการเรียน)",
      "สำเนาบัตรประจำตัวนักเรียน",
      "หนังสือยินยอมจากผู้ปกครอง",
    ],
    applicationUrl: url || "https://www.camphub.in.th",
    preparationTimetable: generateFallbackTimetable(defaultDeadline, category),
    confidenceScore: 0.85,
    lowConfidenceFields: ["deadlineDate", "fee"],
  };
}

const PROMPT = (text: string, url: string) => `
You are an expert Thai educational opportunity organizer AI for Thai high school students (นักเรียนระดับชั้น ม.4 - ม.6 ทั่วประเทศ).
Analyze the provided Thai/English text, social media caption, URL, or image poster of an educational opportunity (competition, camp, scholarship, workshop, hackathon, or university open house).

Extract the following structured details accurately. If a field is not explicitly mentioned, provide a reasonable estimate suitable for Thai students and list it in "lowConfidenceFields".

1. "titleTh": Official Thai name of the opportunity or activity.
2. "titleEn": English translation or official English name.
3. "category": Must be one of: "competition", "camp", "scholarship", "workshop", "hackathon", "open_house".
4. "organizerTh": Organizer name in Thai.
5. "organizerEn": Organizer name in English.
6. "deadlineDate": Application deadline formatted strictly as YYYY-MM-DD.
7. "deadlineTime": Time of deadline (e.g., "23:59").
8. "eventStartDate": Activity/event start date (YYYY-MM-DD).
9. "eventEndDate": Activity/event end date (YYYY-MM-DD).
10. "locationType": "onsite", "online", or "hybrid".
11. "fee": Application fee (e.g., "ฟรี (ไม่มีค่าใช้จ่าย)" or "350 บาท").
12. "requiredDocs": Array of required documents.
13. "applicationUrl": Direct registration URL or link mentioned.
14. "preparationTimetable": An array of 3 to 5 realistic milestone steps, each with "id", "titleTh", "titleEn", "targetDate" (YYYY-MM-DD before the deadline), "completed": false, "description".
15. "confidenceScore": number between 0.0 and 1.0.
16. "lowConfidenceFields": Array of field names that were guessed or uncertain.

Input content:
URL: ${url || "None"}
User Text / Caption: ${text || "None"}

Return ONLY valid JSON matching this exact structure without markdown backticks or commentary.
`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { text = "", images = [] } = body as {
    text?: string;
    images?: { mimeType: string; data: string }[];
  };

  try {
    if (!text && images.length === 0) {
      return Response.json(
        { error: "Missing input. Provide text or images." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({
        opportunity: fallbackRuleExtractor(text, ""),
        source: "heuristic",
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const firstImage = images[0];
    const contents = firstImage
      ? [
          {
            parts: [
              {
                inlineData: {
                  data: firstImage.data.replace(/^data:image\/[a-zA-Z+]+;base64,/, ""),
                  mimeType: firstImage.mimeType || "image/jpeg",
                },
              },
              { text: PROMPT(text, "") },
            ],
          },
        ]
      : [PROMPT(text, "")];

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents[0] as never,
      config: { responseMimeType: "application/json" },
    });

    let parsed;
    try {
      parsed = JSON.parse((response.text || "{}").trim());
    } catch {
      parsed = fallbackRuleExtractor(text, "");
    }

    if (
      !parsed.preparationTimetable ||
      !Array.isArray(parsed.preparationTimetable) ||
      parsed.preparationTimetable.length === 0
    ) {
      parsed.preparationTimetable = generateFallbackTimetable(
        parsed.deadlineDate,
        parsed.category
      );
    }

    return Response.json({ opportunity: parsed, source: "gemini" });
  } catch (error) {
    console.error("Extract API error:", error);
    // Graceful fallback like the original Express server - never leave user hanging
    return Response.json({
      opportunity: fallbackRuleExtractor(text, ""),
      source: "fallback_after_error",
    });
  }
}
