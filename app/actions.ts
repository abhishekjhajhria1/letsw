"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  getCurrentUser,
} from "@/lib/auth";
import { dayKey, addDays } from "@/lib/dates";
import { notify } from "@/lib/notify";

type State = { error?: string } | undefined;

const MAX_CODES_PER_USER = 10;

function randomCode() {
  // readable-ish 8-char code, no ambiguous chars
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export async function registerAction(_prev: State, form: FormData): Promise<State> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const username = String(form.get("username") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const codeRaw = String(form.get("code") || "").trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email." };
  if (!/^[a-z0-9_]{3,20}$/.test(username))
    return { error: "Username must be 3–20 chars: letters, numbers, underscore." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!codeRaw) return { error: "An invite code is required." };

  const code = await prisma.inviteCode.findUnique({ where: { code: codeRaw } });
  if (!code || code.disabled || code.uses >= code.maxUses)
    return { error: "That invite code is invalid or already used up." };

  if (await prisma.user.findUnique({ where: { email } }))
    return { error: "An account with that email already exists." };
  if (await prisma.user.findUnique({ where: { username } }))
    return { error: "That username is taken." };

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const fresh = await tx.inviteCode.findUnique({ where: { id: code.id } });
    if (!fresh || fresh.disabled || fresh.uses >= fresh.maxUses)
      throw new Error("CODE_CONSUMED");
    await tx.inviteCode.update({
      where: { id: code.id },
      data: { uses: { increment: 1 } },
    });
    if (code.ownerId) {
      await tx.user.update({ where: { id: code.ownerId }, data: { crewCount: { increment: 1 } } });
    }
    return tx.user.create({
      data: { email, username, passwordHash, invitedById: code.ownerId ?? null },
    });
  }).catch(() => null);

  if (!user) return { error: "That invite code was just used up. Ask for another." };

  // new members get 3 codes to invite with
  await prisma.inviteCode.createMany({
    data: Array.from({ length: 3 }, () => ({ code: randomCode(), ownerId: user.id })),
  });

  await createSession(user.id);
  redirect("/app");
}

export async function loginAction(_prev: State, form: FormData): Promise<State> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return { error: "Wrong email or password." };
  await createSession(user.id);
  redirect("/app");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function generateCodeAction() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const count = await prisma.inviteCode.count({ where: { ownerId: me.id } });
  if (count >= MAX_CODES_PER_USER) return;
  await prisma.inviteCode.create({ data: { code: randomCode(), ownerId: me.id } });
  revalidatePath("/app/invite");
}

export async function createPartnershipAction(_prev: State, form: FormData): Promise<State> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const partnerName = String(form.get("partner") || "").trim().toLowerCase();
  const title = String(form.get("title") || "").trim();
  const myGoal = String(form.get("goal") || "").trim();
  const category = String(form.get("category") || "general").trim();
  const lengthDays = Math.max(1, Math.min(365, Number(form.get("lengthDays") || 30)));

  if (!partnerName) return { error: "Enter your partner's username." };
  if (partnerName === me.username) return { error: "You can't partner with yourself." };
  if (!title) return { error: "Give your season a name." };
  if (!myGoal) return { error: "Describe your goal." };

  const partner = await prisma.user.findUnique({ where: { username: partnerName } });
  if (!partner) return { error: `No member named "${partnerName}".` };

  const season = await prisma.partnerSeason.create({
    data: {
      title,
      category,
      lengthDays,
      inviterId: me.id,
      inviterGoal: myGoal,
      inviteeId: partner.id,
      status: "pending",
    },
  });
  await notify(partner.id, {
    type: "invited",
    title: `@${me.username} invited you to a season`,
    body: `"${title}" — accept to start.`,
    url: "/app",
  });
  redirect("/app");
}

export async function respondPartnershipAction(form: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const id = String(form.get("id") || "");
  const accept = String(form.get("accept") || "") === "1";
  const goal = String(form.get("goal") || "").trim();

  const season = await prisma.partnerSeason.findUnique({ where: { id } });
  if (!season || season.inviteeId !== me.id || season.status !== "pending") return;

  if (accept) {
    const startedAt = new Date();
    await prisma.partnerSeason.update({
      where: { id },
      data: {
        status: "active",
        inviteeGoal: goal || "Show up every day.",
        startedAt,
        endsAt: addDays(startedAt, season.lengthDays),
      },
    });
    await notify(season.inviterId, {
      type: "accepted",
      title: `@${me.username} accepted your season`,
      body: `"${season.title}" is live. First check-in today.`,
      url: `/app/p/${id}`,
    });
  } else {
    await prisma.partnerSeason.update({ where: { id }, data: { status: "declined" } });
  }
  revalidatePath("/app");
}

export async function checkInAction(form: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const seasonId = String(form.get("seasonId") || "");
  const note = String(form.get("note") || "").trim();
  const proof = String(form.get("proof") || "").trim();

  const season = await prisma.partnerSeason.findUnique({ where: { id: seasonId } });
  if (!season || season.status !== "active") return;
  if (season.inviterId !== me.id && season.inviteeId !== me.id) return;

  const today = dayKey();
  const existing = await prisma.checkIn.findUnique({
    where: { seasonId_authorId_day: { seasonId, authorId: me.id, day: today } },
  });

  if (existing) {
    await prisma.checkIn.update({ where: { id: existing.id }, data: { note, proof } });
  } else {
    await prisma.checkIn.create({ data: { seasonId, authorId: me.id, day: today, note, proof } });

    // streak only advances on the first check-in of a new day
    const data: {
      checkInCount: { increment: number };
      streakCount?: number;
      longestStreak?: number;
      lastCheckInDay?: string;
    } = { checkInCount: { increment: 1 } };

    if (me.lastCheckInDay !== today) {
      const yesterday = dayKey(addDays(new Date(), -1));
      const newStreak = me.lastCheckInDay === yesterday ? me.streakCount + 1 : 1;
      data.streakCount = newStreak;
      data.longestStreak = Math.max(me.longestStreak, newStreak);
      data.lastCheckInDay = today;
    }
    await prisma.user.update({ where: { id: me.id }, data });

    const partnerId = season.inviterId === me.id ? season.inviteeId : season.inviterId;
    await notify(partnerId, {
      type: "checkin",
      title: `@${me.username} completed today's check-in`,
      body: note ? note.slice(0, 80) : "Verify it to keep the streak honest.",
      url: `/app/p/${seasonId}`,
    });
  }
  revalidatePath(`/app/p/${seasonId}`);
  revalidatePath("/app");
}

type SettingsState = { error?: string; ok?: string } | undefined;

export async function changePasswordAction(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const current = String(form.get("current") || "");
  const next = String(form.get("next") || "");
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (!(await verifyPassword(current, me.passwordHash)))
    return { error: "Your current password is wrong." };
  await prisma.user.update({
    where: { id: me.id },
    data: { passwordHash: await hashPassword(next) },
  });
  // log out every other device for safety
  const jar = await cookies();
  const keep = jar.get("lw_session")?.value;
  await prisma.session.deleteMany({ where: { userId: me.id, NOT: { token: keep } } });
  return { ok: "Password updated. Other devices were signed out." };
}

export async function deleteAccountAction(form: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const confirm = String(form.get("confirm") || "").trim().toLowerCase();
  if (confirm !== me.username.toLowerCase()) return;

  await prisma.$transaction([
    ...(me.invitedById
      ? [prisma.user.update({ where: { id: me.invitedById }, data: { crewCount: { decrement: 1 } } })]
      : []),
    prisma.checkIn.updateMany({ where: { verifiedById: me.id }, data: { verifiedById: null, verifiedAt: null } }),
    prisma.partnerSeason.deleteMany({ where: { OR: [{ inviterId: me.id }, { inviteeId: me.id }] } }),
    prisma.checkIn.deleteMany({ where: { authorId: me.id } }),
    prisma.inviteCode.deleteMany({ where: { ownerId: me.id } }),
    prisma.user.updateMany({ where: { invitedById: me.id }, data: { invitedById: null } }),
    prisma.user.delete({ where: { id: me.id } }),
  ]);

  await destroySession();
  redirect("/");
}

export async function verifyCheckInAction(form: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const checkInId = String(form.get("checkInId") || "");
  const ci = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    include: { season: true },
  });
  if (!ci) return;
  // only the partner (not the author) can verify
  const isPartner =
    (ci.season.inviterId === me.id || ci.season.inviteeId === me.id) && ci.authorId !== me.id;
  if (!isPartner) return;
  if (ci.verifiedById) return; // already verified
  await prisma.$transaction([
    prisma.checkIn.update({
      where: { id: checkInId },
      data: { verifiedById: me.id, verifiedAt: new Date() },
    }),
    prisma.user.update({ where: { id: me.id }, data: { verifyCount: { increment: 1 } } }),
  ]);
  await notify(ci.authorId, {
    type: "verified",
    title: `@${me.username} verified your check-in 🎉`,
    body: "That one counts.",
    url: `/app/p/${ci.seasonId}`,
  });
  revalidatePath(`/app/p/${ci.seasonId}`);
}

// ---- push subscriptions ----

export async function savePushSubscriptionAction(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const me = await getCurrentUser();
  if (!me || !sub?.endpoint) return;
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { userId: me.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    create: { userId: me.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });
}

// ---- notification feed ----

export async function markNotificationsReadAction() {
  const me = await getCurrentUser();
  if (!me) return;
  await prisma.notification.updateMany({
    where: { userId: me.id, read: false },
    data: { read: true },
  });
  revalidatePath("/app/inbox");
  revalidatePath("/app");
}

// ---- nudge ----

export async function nudgeAction(form: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const seasonId = String(form.get("seasonId") || "");
  const season = await prisma.partnerSeason.findUnique({ where: { id: seasonId } });
  if (!season || season.status !== "active") return;
  if (season.inviterId !== me.id && season.inviteeId !== me.id) return;
  const partnerId = season.inviterId === me.id ? season.inviteeId : season.inviterId;

  // soft cooldown: at most one nudge to this partner per 3h
  const recent = await prisma.notification.findFirst({
    where: { userId: partnerId, type: "nudge", createdAt: { gt: new Date(Date.now() - 3 * 3600e3) } },
  });
  if (recent) return;

  await notify(partnerId, {
    type: "nudge",
    title: `@${me.username} nudged you 👀`,
    body: `Don't break the streak on "${season.title}".`,
    url: `/app/p/${seasonId}`,
  });
  revalidatePath(`/app/p/${seasonId}`);
}

// ---- co-focus sessions ----

export async function startFocusAction(seasonId: string | null, minutes: number) {
  const me = await getCurrentUser();
  if (!me) return null;
  const mins = Math.max(1, Math.min(180, Math.round(minutes || 25)));
  const endsAt = new Date(Date.now() + mins * 60000);

  let validSeasonId: string | null = null;
  if (seasonId) {
    const season = await prisma.partnerSeason.findUnique({ where: { id: seasonId } });
    if (season && (season.inviterId === me.id || season.inviteeId === me.id)) {
      validSeasonId = season.id;
      const partnerId = season.inviterId === me.id ? season.inviteeId : season.inviterId;
      await notify(partnerId, {
        type: "focus",
        title: `@${me.username} is focusing for ${mins} min`,
        body: "Jump in and co-work — body doubling beats willpower.",
        url: "/app/timer",
      });
    }
  }

  const fs = await prisma.focusSession.create({
    data: { userId: me.id, seasonId: validSeasonId, endsAt },
  });
  return fs.id;
}

export async function endFocusAction(id: string) {
  const me = await getCurrentUser();
  if (!me || !id) return;
  await prisma.focusSession.updateMany({
    where: { id, userId: me.id, endedAt: null },
    data: { endedAt: new Date() },
  });
}

// ---- daily intention ----

export async function setIntentionAction(form: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const seasonId = String(form.get("seasonId") || "");
  const text = String(form.get("text") || "").trim().slice(0, 200);
  if (!text) return;
  const season = await prisma.partnerSeason.findUnique({ where: { id: seasonId } });
  if (!season || (season.inviterId !== me.id && season.inviteeId !== me.id)) return;

  const day = dayKey();
  await prisma.dailyIntention.upsert({
    where: { seasonId_userId_day: { seasonId, userId: me.id, day } },
    update: { text },
    create: { seasonId, userId: me.id, day, text },
  });
  revalidatePath(`/app/p/${seasonId}`);
  revalidatePath("/app");
}

// ---- reminders ----

export async function saveReminderAction(form: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const reminderEnabled = String(form.get("enabled") || "") === "on";
  const reminderTime = String(form.get("time") || "").trim() || null;
  const reminderTz = String(form.get("tz") || "").trim() || null;
  await prisma.user.update({
    where: { id: me.id },
    data: { reminderEnabled, reminderTime, reminderTz },
  });
  revalidatePath("/app/settings");
}
