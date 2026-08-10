"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, fail, zodError } from "@/lib/actions/action-utils";

const MODULE = "command_center" as const;
const REVALIDATE_PATH = "/dashboard";

function dateOnly(d: Date | string): Date {
  const parsed = new Date(d);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

// ── Tasks (Section 3 Today's Plan + Section 9 Task Management) ────

const taskSchema = z.object({
  title: z.string().min(2, "Title is too short").max(200),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  category: z
    .enum([
      "SITE_VISIT", "INVOICE", "QUOTATION", "TENDER", "FOLLOW_UP",
      "MATERIAL_ORDER", "MEETING", "DOCUMENTATION", "MAINTENANCE", "ADMIN", "OTHER",
    ])
    .default("OTHER"),
  siteId: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  dueTime: z.string().max(10).optional().nullable(),
  reminderAt: z.coerce.date().optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  assignedToId: z.string().optional().nullable(), // defaults to self if omitted
});

export async function createTask(input: z.infer<typeof taskSchema>) {
  const { user, error } = await authorize(MODULE, "create");
  if (!user) return error;

  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? dateOnly(parsed.data.dueDate) : null,
      assignedToId: parsed.data.assignedToId || user.id,
      createdById: user.id,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return ok(task);
}

const taskStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "IN_PROGRESS", "WAITING", "COMPLETED", "CANCELLED"]),
});

export async function updateTaskStatus(input: z.infer<typeof taskStatusSchema>) {
  const { user, error } = await authorize(MODULE, "edit");
  if (!user) return error;

  const parsed = taskStatusSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const existing = await prisma.task.findUnique({ where: { id: parsed.data.id } });
  if (!existing || (existing.assignedToId !== user.id && existing.createdById !== user.id)) {
    return fail("Task not found.");
  }

  const isCompleting = parsed.data.status === "COMPLETED";
  const task = await prisma.task.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      progress: isCompleting ? 100 : existing.progress,
      completedAt: isCompleting ? new Date() : null,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return ok(task);
}

const taskProgressSchema = z.object({ id: z.string(), progress: z.coerce.number().min(0).max(100) });

export async function updateTaskProgress(input: z.infer<typeof taskProgressSchema>) {
  const { user, error } = await authorize(MODULE, "edit");
  if (!user) return error;

  const parsed = taskProgressSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const existing = await prisma.task.findUnique({ where: { id: parsed.data.id } });
  if (!existing || (existing.assignedToId !== user.id && existing.createdById !== user.id)) {
    return fail("Task not found.");
  }

  const task = await prisma.task.update({
    where: { id: parsed.data.id },
    data: { progress: parsed.data.progress },
  });

  revalidatePath(REVALIDATE_PATH);
  return ok(task);
}

export async function deleteTask(id: string) {
  const { user, error } = await authorize(MODULE, "delete");
  if (!user) return error;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || (existing.assignedToId !== user.id && existing.createdById !== user.id)) {
    return fail("Task not found.");
  }

  await prisma.task.delete({ where: { id } });
  revalidatePath(REVALIDATE_PATH);
  return ok(undefined);
}

const commentSchema = z.object({ taskId: z.string(), content: z.string().min(1).max(1000) });

export async function addTaskComment(input: z.infer<typeof commentSchema>) {
  const { user, error } = await authorize(MODULE, "create");
  if (!user) return error;

  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const comment = await prisma.taskComment.create({
    data: { taskId: parsed.data.taskId, content: parsed.data.content, userId: user.id },
  });

  revalidatePath(REVALIDATE_PATH);
  return ok(comment);
}

// ── Follow-ups (Section 4) ─────────────────────────────────────

const followUpSchema = z.object({
  title: z.string().min(2).max(200),
  type: z.enum([
    "CALL_VENDOR", "CALL_CLIENT", "PAYMENT_REMINDER", "QUOTATION_REMINDER",
    "TRANSFORMER_TESTING", "INSPECTION", "OTHER",
  ]),
  dueDate: z.coerce.date(),
  notes: z.string().max(1000).optional().nullable(),
  siteId: z.string().optional().nullable(),
});

export async function createFollowUp(input: z.infer<typeof followUpSchema>) {
  const { user, error } = await authorize(MODULE, "create");
  if (!user) return error;

  const parsed = followUpSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const followUp = await prisma.followUp.create({
    data: {
      ...parsed.data,
      dueDate: dateOnly(parsed.data.dueDate),
      assignedToId: user.id,
      createdById: user.id,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return ok(followUp);
}

export async function completeFollowUp(id: string) {
  const { user, error } = await authorize(MODULE, "edit");
  if (!user) return error;

  const existing = await prisma.followUp.findUnique({ where: { id } });
  if (!existing || existing.assignedToId !== user.id) return fail("Follow-up not found.");

  const followUp = await prisma.followUp.update({ where: { id }, data: { status: "DONE" } });
  revalidatePath(REVALIDATE_PATH);
  return ok(followUp);
}

// ── Quick Notes (Section 5) ─────────────────────────────────────

export async function createNote() {
  const { user, error } = await authorize(MODULE, "create");
  if (!user) return error;

  const note = await prisma.quickNote.create({ data: { content: "", userId: user.id } });
  revalidatePath(REVALIDATE_PATH);
  return ok(note);
}

const noteUpdateSchema = z.object({ id: z.string(), content: z.string().max(5000) });

export async function updateNote(input: z.infer<typeof noteUpdateSchema>) {
  const { user, error } = await authorize(MODULE, "edit");
  if (!user) return error;

  const parsed = noteUpdateSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const existing = await prisma.quickNote.findUnique({ where: { id: parsed.data.id } });
  if (!existing || existing.userId !== user.id) return fail("Note not found.");

  const note = await prisma.quickNote.update({
    where: { id: parsed.data.id },
    data: { content: parsed.data.content },
  });
  // No revalidatePath here — autosave fires on every keystroke pause and
  // a full-page revalidation would be wasteful; the sidebar/badges don't
  // depend on note content.
  return ok(note);
}

export async function deleteNote(id: string) {
  const { user, error } = await authorize(MODULE, "delete");
  if (!user) return error;

  const existing = await prisma.quickNote.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return fail("Note not found.");

  await prisma.quickNote.delete({ where: { id } });
  revalidatePath(REVALIDATE_PATH);
  return ok(undefined);
}

// ── Meetings (Section 6) ─────────────────────────────────────────

const meetingSchema = z.object({
  date: z.coerce.date(),
  time: z.string().min(1).max(10),
  withPerson: z.string().min(1).max(200),
  purpose: z.string().min(1).max(500),
  notes: z.string().max(2000).optional().nullable(),
});

export async function createMeeting(input: z.infer<typeof meetingSchema>) {
  const { user, error } = await authorize(MODULE, "create");
  if (!user) return error;

  const parsed = meetingSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const meeting = await prisma.meeting.create({
    data: { ...parsed.data, date: dateOnly(parsed.data.date), createdById: user.id },
  });

  revalidatePath(REVALIDATE_PATH);
  return ok(meeting);
}

const meetingStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]),
  notes: z.string().max(2000).optional().nullable(),
});

export async function updateMeetingStatus(input: z.infer<typeof meetingStatusSchema>) {
  const { user, error } = await authorize(MODULE, "edit");
  if (!user) return error;

  const parsed = meetingStatusSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const existing = await prisma.meeting.findUnique({ where: { id: parsed.data.id } });
  if (!existing || existing.createdById !== user.id) return fail("Meeting not found.");

  const meeting = await prisma.meeting.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status, notes: parsed.data.notes ?? existing.notes },
  });

  revalidatePath(REVALIDATE_PATH);
  return ok(meeting);
}

// ── Site Visits (Section 8) ───────────────────────────────────────

const siteVisitSchema = z.object({
  siteId: z.string().min(1, "Select a site"),
  date: z.coerce.date(),
  time: z.string().min(1).max(10),
  purpose: z.string().min(1).max(500),
  engineerId: z.string().optional().nullable(), // defaults to self
});

export async function createSiteVisit(input: z.infer<typeof siteVisitSchema>) {
  const { user, error } = await authorize(MODULE, "create");
  if (!user) return error;

  const parsed = siteVisitSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const visit = await prisma.siteVisit.create({
    data: {
      siteId: parsed.data.siteId,
      date: dateOnly(parsed.data.date),
      time: parsed.data.time,
      purpose: parsed.data.purpose,
      engineerId: parsed.data.engineerId || user.id,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return ok(visit);
}

const gpsSchema = z.object({
  id: z.string(),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
});

export async function checkInSiteVisit(input: z.infer<typeof gpsSchema>) {
  const { user, error } = await authorize(MODULE, "edit");
  if (!user) return error;

  const parsed = gpsSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const existing = await prisma.siteVisit.findUnique({ where: { id: parsed.data.id } });
  if (!existing || existing.engineerId !== user.id) return fail("Site visit not found.");

  const visit = await prisma.siteVisit.update({
    where: { id: parsed.data.id },
    data: {
      status: "CHECKED_IN",
      checkInAt: new Date(),
      checkInLat: parsed.data.lat,
      checkInLng: parsed.data.lng,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return ok(visit);
}

export async function checkOutSiteVisit(input: z.infer<typeof gpsSchema>) {
  const { user, error } = await authorize(MODULE, "edit");
  if (!user) return error;

  const parsed = gpsSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const existing = await prisma.siteVisit.findUnique({ where: { id: parsed.data.id } });
  if (!existing || existing.engineerId !== user.id) return fail("Site visit not found.");

  const visit = await prisma.siteVisit.update({
    where: { id: parsed.data.id },
    data: {
      status: "CHECKED_OUT",
      checkOutAt: new Date(),
      checkOutLat: parsed.data.lat,
      checkOutLng: parsed.data.lng,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return ok(visit);
}

// ── Smart Reminders (Section 10) ──────────────────────────────────

const reminderSchema = z.object({
  title: z.string().min(2).max(200),
  type: z.enum([
    "AMC_EXPIRY", "INSURANCE_EXPIRY", "TENDER_SUBMISSION", "INVOICE_DUE", "SALARY_DATE",
    "PF_DUE", "GST_RETURN", "SITE_VISIT", "MAINTENANCE", "CALIBRATION", "VEHICLE_SERVICE", "OTHER",
  ]),
  dueDate: z.coerce.date(),
  notes: z.string().max(1000).optional().nullable(),
  recurrence: z.enum(["NONE", "MONTHLY", "QUARTERLY", "YEARLY"]).default("NONE"),
});

export async function createReminder(input: z.infer<typeof reminderSchema>) {
  const { user, error } = await authorize(MODULE, "create");
  if (!user) return error;

  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const reminder = await prisma.smartReminder.create({
    data: { ...parsed.data, dueDate: dateOnly(parsed.data.dueDate), createdById: user.id },
  });

  revalidatePath(REVALIDATE_PATH);
  return ok(reminder);
}

function nextRecurrence(date: Date, recurrence: "NONE" | "MONTHLY" | "QUARTERLY" | "YEARLY"): Date | null {
  const next = new Date(date);
  if (recurrence === "MONTHLY") next.setMonth(next.getMonth() + 1);
  else if (recurrence === "QUARTERLY") next.setMonth(next.getMonth() + 3);
  else if (recurrence === "YEARLY") next.setFullYear(next.getFullYear() + 1);
  else return null;
  return next;
}

export async function completeReminder(id: string) {
  const { user, error } = await authorize(MODULE, "edit");
  if (!user) return error;

  const existing = await prisma.smartReminder.findUnique({ where: { id } });
  if (!existing) return fail("Reminder not found.");

  await prisma.smartReminder.update({ where: { id }, data: { status: "DONE" } });

  // Recurring reminders spawn their next occurrence automatically.
  const next = nextRecurrence(existing.dueDate, existing.recurrence);
  if (next) {
    await prisma.smartReminder.create({
      data: {
        title: existing.title,
        type: existing.type,
        dueDate: next,
        notes: existing.notes,
        recurrence: existing.recurrence,
        createdById: existing.createdById,
      },
    });
  }

  revalidatePath(REVALIDATE_PATH);
  return ok(undefined);
}

export async function dismissReminder(id: string) {
  const { user, error } = await authorize(MODULE, "edit");
  if (!user) return error;

  await prisma.smartReminder.update({ where: { id }, data: { status: "DISMISSED" } });
  revalidatePath(REVALIDATE_PATH);
  return ok(undefined);
}

// ── End of Day Report (Section 11) ────────────────────────────────

const eodSchema = z.object({
  completedWork: z.string().min(1, "Add at least a line on what you finished").max(4000),
  pendingWork: z.string().max(4000).optional().nullable(),
  tomorrowPlan: z.string().max(4000).optional().nullable(),
});

export async function submitEndOfDayReport(input: z.infer<typeof eodSchema>) {
  const { user, error } = await authorize(MODULE, "create");
  if (!user) return error;

  const parsed = eodSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const today = dateOnly(new Date());

  const report = await prisma.endOfDayReport.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    create: { ...parsed.data, userId: user.id, date: today },
    update: { ...parsed.data },
  });

  revalidatePath(REVALIDATE_PATH);
  return ok(report);
}
