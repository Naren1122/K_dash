import { prisma } from "@/lib/utils/prisma";

export async function deleteVerificationTokensByIdentifier(identifier: string) {
  return prisma.verificationToken.deleteMany({
    where: { identifier },
  });
}

export async function createVerificationTokenInDb(data: {
  identifier: string;
  token: string;
  expires: Date;
}) {
  return prisma.verificationToken.create({
    data,
  });
}

export async function findVerificationTokenInDb(token: string) {
  return prisma.verificationToken.findUnique({
    where: { token },
  });
}

export async function deleteVerificationTokenInDb(token: string) {
  return prisma.verificationToken.delete({
    where: { token },
  });
}

export async function updateUserPasswordInDb(userId: string, passwordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      emailVerified: new Date(),
    },
  });
}
