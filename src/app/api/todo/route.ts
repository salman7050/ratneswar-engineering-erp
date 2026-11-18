import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseTodoMeta } from "@/lib/todo-meta";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();

  const [tasks, sites, team] = await Promise.all([
    prisma.task.findMany({
      where: { OR: [{ assignedToId: user.id }, { createdById: user.id }] },
      include: {
        site: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ dueDate: "desc" }, { updatedAt: "desc" }],
      take: 500,
    }),
    prisma.site.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 300,
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    currentUserId: user.id,
    sites,
    team,
    tasks: tasks.map((task) => {
      const meta = parseTodoMeta(task.description);
      return {
        id: task.id,
        title: task.title,
        description: meta.description,
        customAssigneeName: meta.assigneeName,
        priority: task.priority,
        category: task.category,
        status: task.status,
        progress: task.progress,
        dueDate: task.dueDate?.toISOString() ?? null,
        dueTime: task.dueTime,
        reminderAt: task.reminderAt?.toISOString() ?? null,
        attachmentUrl: task.attachmentUrl,
        notes: task.notes,
        completedAt: task.completedAt?.toISOString() ?? null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        site: task.site,
        assignedTo: task.assignedTo,
        createdBy: task.createdBy,
        commentCount: task._count.comments,
      };
    }),
  });
}
