"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  forgotPasswordSchema,
  ForgotPasswordInput,
  resetPasswordSchema,
  ResetPasswordInput,
} from "@/lib/schemas/passwordResetSchema";
import { logger } from "@/lib/utils/logger";
import { parseOrThrow } from "@/lib/utils/action-utils";
import { sendPasswordResetEmail } from "@/lib/utils/email";
import { findUserByEmail } from "@/lib/data/user.data";
import {
  deleteVerificationTokensByIdentifier,
  createVerificationTokenInDb,
  findVerificationTokenInDb,
  deleteVerificationTokenInDb,
  updateUserPasswordInDb,
} from "@/lib/data/auth.data";

const RESET_TOKEN_EXPIRY_MINUTES = 15;
const TOKEN_PREFIX = "password-reset:";

function getBaseAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Request password reset link.
 * For security reasons, we do not reveal if an email exists in our system.
 */
export async function requestPasswordReset(input: ForgotPasswordInput) {
  const { email } = parseOrThrow(forgotPasswordSchema, input);
  const normalizedEmail = email.toLowerCase().trim();

  logger.auth("password_reset_request", { email: normalizedEmail });

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    logger.auth("password_reset_user_not_found", { email: normalizedEmail });
    // Still return success to prevent email enumeration
    return {
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    };
  }

  // Clear any existing tokens for this identifier
  const identifier = `${TOKEN_PREFIX}${normalizedEmail}`;
  await deleteVerificationTokensByIdentifier(identifier);

  // Generate secure token and expiry date
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await createVerificationTokenInDb({
    identifier,
    token,
    expires,
  });

  const resetUrl = `${getBaseAppUrl()}/reset-password?token=${token}`;

  await sendPasswordResetEmail({
    toEmail: user.email,
    userName: user.name,
    resetUrl,
  });

  logger.auth("password_reset_token_created", { email: normalizedEmail });

  return {
    success: true,
    message: "If an account exists with this email, a password reset link has been sent.",
  };
}

/**
 * Verify validity of a password reset token before displaying the reset form.
 */
export async function verifyResetToken(token: string) {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Invalid reset token provided." };
  }

  const record = await findVerificationTokenInDb(token);

  if (!record || !record.identifier.startsWith(TOKEN_PREFIX)) {
    return { valid: false, error: "Invalid or expired reset link. Please request a new one." };
  }

  if (new Date() > record.expires) {
    // Delete expired token
    await deleteVerificationTokenInDb(token).catch(() => {});

    return {
      valid: false,
      error: "This password reset link has expired (15-minute limit). Please request a new one.",
    };
  }

  const email = record.identifier.replace(TOKEN_PREFIX, "");

  return {
    valid: true,
    email,
  };
}

/**
 * Reset password using valid verification token.
 */
export async function resetPassword(input: ResetPasswordInput) {
  const { token, password } = parseOrThrow(resetPasswordSchema, input);

  const verification = await verifyResetToken(token);
  if (!verification.valid || !verification.email) {
    return {
      success: false,
      error: verification.error || "Invalid or expired token.",
    };
  }

  const email = verification.email;
  const user = await findUserByEmail(email);

  if (!user) {
    return {
      success: false,
      error: "No account found associated with this reset link.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await updateUserPasswordInDb(user.id, passwordHash);

  // Invalidate the used token
  await deleteVerificationTokenInDb(token).catch(() => {});

  logger.auth("password_reset_success", { userId: user.id, email });

  return { success: true };
}
