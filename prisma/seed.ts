import { PrismaClient, Role, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

  const tasks = [
    {
      title: "Design the board layout",
      description: "Create the initial three-column Kanban layout.",
      status: TaskStatus.TODO,
      assigneeId: maya.id,
    },
    {
      title: "Implement authentication",
      description: "Add secure credentials-based sign-in with role-aware sessions.",
      status: TaskStatus.IN_PROGRESS,
      assigneeId: liam.id,
    },
    {
      title: "Set up the database schema",
      description: "Model users, tasks, roles, and task statuses with Prisma.",
      status: TaskStatus.DONE,
      assigneeId: admin.id,
    },
    {
      title: "Write the deployment checklist",
      description: "Document the steps required to ship the application.",
      status: TaskStatus.TODO,
      assigneeId: maya.id,
    },
  ];

  // Keep reruns predictable without deleting user-created tasks.
  await prisma.task.deleteMany({
    where: {
      createdById: admin.id,
      title: { in: tasks.map((task) => task.title) },
    },
  });

  await prisma.task.createMany({
    data: tasks.map((task) => ({ ...task, createdById: admin.id })),
  });

  console.log("Seeded 3 users and 4 starter tasks.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
