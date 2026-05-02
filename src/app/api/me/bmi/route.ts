import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BmiEntryCreateDTO } from "@/lib/dtos";
import { handle, ok } from "@/lib/http";

export const runtime = "nodejs";

function computeBmi(heightCm: number, weightKg: number): number {
  const meters = heightCm / 100;
  return weightKg / (meters * meters);
}

function categoryFor(bmi: number): string {
  if (bmi < 18.5) return "low";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "over";
  return "obese";
}

function serializeEntry(entry: {
  id: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  category: string;
  measuredAt: Date;
}) {
  return {
    id: entry.id,
    heightCm: entry.heightCm,
    weightKg: entry.weightKg,
    bmi: entry.bmi,
    category: entry.category,
    measuredAt: entry.measuredAt.toISOString(),
  };
}

export const GET = handle(async () => {
  const session = requireSession();
  const entries = await prisma.bmiEntry.findMany({
    where: { userId: session.sub },
    orderBy: { measuredAt: "desc" },
    take: 12,
  });
  return ok(entries.map(serializeEntry));
});

export const POST = handle(async (req: NextRequest) => {
  const session = requireSession();
  const body = await req.json().catch(() => ({}));
  const input = BmiEntryCreateDTO.parse(body ?? {});
  const bmi = computeBmi(input.heightCm, input.weightKg);
  const entry = await prisma.bmiEntry.create({
    data: {
      userId: session.sub,
      gymId: session.gymId,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      bmi,
      category: categoryFor(bmi),
    },
  });
  return ok(serializeEntry(entry));
});
