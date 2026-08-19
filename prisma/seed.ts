import { PrismaClient, Priority, Role, TaskStatus } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const defaultBoard = {
  name: "Main Board",
  key: "MAIN",
  columns: [
    { name: "To Do", status: TaskStatus.TODO, position: 0 },
    { name: "In Progress", status: TaskStatus.IN_PROGRESS, position: 1 },
    { name: "Done", status: TaskStatus.DONE, position: 2 },
  ],
};

const credentials = {
  admin: {
    email: "admin@kanban.local",
    name: "Avery Admin",
    password: "Admin123!",
    role: Role.ADMIN,
  },
  maya: {
    email: "maya@kanban.local",
    name: "Maya Member",
    password: "Member123!",
    role: Role.MEMBER,
  },
  liam: {
    email: "liam@kanban.local",
    name: "Liam Member",
    password: "Member123!",
    role: Role.MEMBER,
  },
};

async function upsertUser(user: (typeof credentials)[keyof typeof credentials]) {
  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      passwordHash: await bcrypt.hash(user.password, 12),
      role: user.role,
    },
    create: {
      name: user.name,
      email: user.email,
      passwordHash: await bcrypt.hash(user.password, 12),
      role: user.role,
    },
  });
}

async function main() {
  const [admin, maya, liam] = await Promise.all([
    upsertUser(credentials.admin),
    upsertUser(credentials.maya),
    upsertUser(credentials.liam),
  ]);

  // Create or find the default board
  const board = await prisma.board.upsert({
    where: { key: defaultBoard.key },
    update: { name: defaultBoard.name },
    create: {
      name: defaultBoard.name,
      key: defaultBoard.key,
      columns: {
        create: defaultBoard.columns,
      },
    },
    include: { columns: { orderBy: { position: "asc" } } },
  });

  const labelData = [
    { name: "bug", color: "#ef4444", boardId: board.id },
    { name: "feature", color: "#22c55e", boardId: board.id },
    { name: "docs", color: "#3b82f6", boardId: board.id },
    { name: "chore", color: "#64748b", boardId: board.id },
    { name: "design", color: "#a855f7", boardId: board.id },
  ];

  await Promise.all(
    labelData.map((label) =>
      prisma.label.upsert({
        where: { name_boardId: { name: label.name, boardId: label.boardId } },
        update: { color: label.color },
        create: label,
      }),
    ),
  );

  const labels = await prisma.label.findMany();

  const byName = (name: string) => labels.find((l) => l.name === name)!;

  const tasks = [
    {
      title: "Design the board layout",
      description: "Create the initial three-column Kanban layout.",
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      assigneeId: maya.id,
      labelIds: [byName("design").id],
    },
    {
      title: "Implement authentication",
      description: "Add secure credentials-based sign-in with role-aware sessions.",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
      assigneeId: liam.id,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      labelIds: [byName("feature").id, byName("docs").id],
    },
    {
      title: "Set up the database schema",
      description: "Model users, tasks, roles, and task statuses with Prisma.",
      status: TaskStatus.DONE,
      priority: Priority.MEDIUM,
      assigneeId: admin.id,
      labelIds: [byName("chore").id],
    },
    {
      title: "Write the deployment checklist",
      description: "Document the steps required to ship the application.",
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      assigneeId: maya.id,
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      labelIds: [byName("docs").id],
    },
  ];

  // Keep reruns predictable without deleting user-created tasks.
  const seededTitles = tasks.map((task) => task.title);
  await prisma.task.deleteMany({
    where: {
      createdById: admin.id,
      title: { in: seededTitles },
    },
  });

  const created = await Promise.all(
    tasks.map((task) =>
      prisma.task.create({
        data: {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          assigneeId: task.assigneeId,
          createdById: admin.id,
          labels: {
            create: task.labelIds.map((labelId) => ({ labelId })),
          },
        },
      }),
    ),
  );

  await prisma.comment.createMany({
    data: [
      {
        content: "Let's review the initial mockups before we build the columns.",
        taskId: created[0].id,
        authorId: maya.id,
      },
      {
        content: "Picking this up after the auth flow is wired up.",
        taskId: created[1].id,
        authorId: liam.id,
      },
    ],
  });

  console.log(`Seeded board "${board.name}" with ${board.columns.length} columns, 3 users, 5 labels, 4 tasks, and 2 comments.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
