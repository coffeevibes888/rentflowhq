import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    const body = await req.json();
    const {
      fullName,
      age,
      email,
      phone,
      currentAddress,
      currentEmployer,
      monthlySalary,
      yearlySalary,
      hasPets,
      petCount,
      ssn,
      notes,
      propertySlug,
    } = body as {
      fullName?: string;
      age?: string;
      email?: string;
      phone?: string;
      currentAddress?: string;
      currentEmployer?: string;
      monthlySalary?: string;
      yearlySalary?: string;
      hasPets?: string;
      petCount?: string;
      ssn?: string;
      notes?: string;
      propertySlug?: string;
    };

    if (!fullName || !email || !phone || !currentAddress || !currentEmployer || !ssn) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const notesCombined = [
      notes,
      age ? `Age: ${age}` : undefined,
      currentAddress ? `Address: ${currentAddress}` : undefined,
      currentEmployer ? `Employer: ${currentEmployer}` : undefined,
      monthlySalary ? `Salary (monthly): ${monthlySalary}` : undefined,
      yearlySalary ? `Salary (yearly): ${yearlySalary}` : undefined,
      hasPets ? `Has pets: ${hasPets}` : undefined,
      petCount ? `Number of pets: ${petCount}` : undefined,
      hasPets && hasPets.toLowerCase().startsWith("y")
        ? "Note: Applicant was informed that a $300 annual pet fee is added for pets."
        : undefined,
      propertySlug ? `Property: ${propertySlug}` : undefined,
      ssn ? `SSN: ${ssn}` : undefined,
    ]
      .filter(Boolean)
      .join("\n");

    const existingUser = email
      ? await prisma.user.findUnique({ where: { email } })
      : null;

    const applicantId =
      existingUser?.id || (session?.user?.email === email ? (session.user.id as string | undefined) : undefined);

    const unit = propertySlug
      ? await prisma.unit.findFirst({
          where: {
            isAvailable: true,
            property: {
              slug: propertySlug,
            },
          },
          orderBy: { createdAt: "asc" },
        })
      : null;

    await prisma.rentalApplication.create({
      data: {
        fullName,
        email,
        phone,
        notes: notesCombined,
        status: "pending",
        propertySlug: propertySlug || null,
        unitId: unit?.id ?? null,
        applicantId: applicantId ?? null,
      },
    });

    revalidatePath("/admin/applications");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Application error", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
