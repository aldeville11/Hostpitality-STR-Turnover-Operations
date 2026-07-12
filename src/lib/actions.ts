"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  loginWithCredentials,
  requireUser,
} from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { processDueJobs } from "@/lib/jobs";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const result = await loginWithCredentials(email, password);
  if ("error" in result && result.error) {
    return { error: result.error };
  }

  const user = result.user!;
  if (!user.companyId) redirect("/signup");

  const company = await prisma.company.findUnique({ where: { id: user.companyId } });
  if (!company?.onboardedAt) redirect("/onboarding");
  redirect("/dashboard");
}

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) {
    await writeAuditLog({
      companyId: user.companyId,
      userId: user.id,
      action: "auth.logout",
      entityType: "User",
      entityId: user.id,
    });
  }
  await destroySession();
  redirect("/login");
}

export async function signupAction(formData: FormData) {
  const schema = z.object({
    companyName: z.string().min(2),
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
  });

  const parsed = schema.safeParse({
    companyName: formData.get("companyName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Please fill all fields correctly." };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Email already registered." };

  let slug = slugify(parsed.data.companyName);
  if (await prisma.company.findUnique({ where: { slug } })) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const company = await prisma.company.create({
    data: {
      name: parsed.data.companyName.trim(),
      slug,
      onboardingStep: "company",
      onboardingProgress: JSON.stringify({}),
      users: {
        create: {
          email,
          name: parsed.data.name.trim(),
          passwordHash,
          role: "OPS_MANAGER",
        },
      },
    },
    include: { users: true },
  });

  const user = company.users[0];

  await writeAuditLog({
    companyId: company.id,
    userId: user.id,
    action: "auth.signup",
    entityType: "Company",
    entityId: company.id,
    metadata: { email },
  });

  await writeAuditLog({
    companyId: company.id,
    userId: user.id,
    action: "company.created",
    entityType: "Company",
    entityId: company.id,
  });

  await createSession(user.id);
  redirect("/onboarding/company");
}

export async function processJobsAction() {
  await requireUser({ permission: "settings:manage" });
  await processDueJobs(25);
}
