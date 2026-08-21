import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── 1. Bootstrap admin account ────────────────────────────────────────────
  // This is the only way to get an admin into a fresh database.

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@kanban.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Avery Admin";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "ADMIN",
    },
  });

  console.log(`✓ Admin account ready: ${admin.email}`);


  const board = await prisma.board.upsert({
    where: { key: "MAIN" },
    update: { name: "Main Board" },
    create: {
      name: "Main Board",
      key: "MAIN",
      columns: {
        create: [
          { name: "To Do", status: "TODO", position: 0 },
          { name: "In Progress", status: "IN_PROGRESS", position: 1 },
          { name: "Done", status: "DONE", position: 2 },
        ],
      },
    },
    include: { columns: { orderBy: { position: "asc" } } },
  });

  console.log(`✓ Board ready: "${board.name}" (${board.columns.length} columns)`);

  // ── 3. Default labels ─────────────────────────────────────────────────────
  // Useful starting labels — admin can add/edit/delete more via the UI.
  const defaultLabels = [
    { name: "bug", color: "#ef4444" },
    { name: "feature", color: "#22c55e" },
    { name: "docs", color: "#3b82f6" },
    { name: "chore", color: "#64748b" },
    { name: "design", color: "#a855f7" },
  ];

  await Promise.all(
    defaultLabels.map((label) =>
      prisma.label.upsert({
        where: { name_boardId: { name: label.name, boardId: board.id } },
        update: { color: label.color },
        create: { ...label, boardId: board.id },
      }),
    ),
  );

  console.log(`✓ Default labels seeded (${defaultLabels.length})`);
  console.log("\nSeeding complete. Log in with:");
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
