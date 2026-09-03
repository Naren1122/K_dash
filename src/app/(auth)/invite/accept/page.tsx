import Link from "next/link";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

import { getInvitationByToken } from "@/lib/actions/invitations";
import { InviteAcceptForm } from "@/components/invite/invite-accept-form";
import { CloseTabButton } from "@/components/invite/close-tab-button";

export const metadata = {
  title: "Accept Invitation | Kanban Task Board",
};

interface InviteAcceptPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function InviteAcceptPage({ searchParams }: InviteAcceptPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xl dark:border-red-900/60 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/80 dark:text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Missing Invitation Token
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Please check your invitation email and click the full link provided.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const result = await getInvitationByToken(token);

  if (!result.success || !result.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-xl dark:border-amber-900/60 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
            {result.alreadyAccepted ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            ) : (
              <AlertCircle className="h-6 w-6" />
            )}
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            {result.alreadyAccepted ? "Invitation Accepted" : "Invalid or Expired Link"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {result.alreadyAccepted
              ? "Your account has been set up successfully. You can now close this tab."
              : result.error}
          </p>
          <div className="mt-6">
            {result.alreadyAccepted ? (
              <CloseTabButton label="Done" />
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Go to Login
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { email, name, inviterName } = result.data;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <InviteAcceptForm
          token={token}
          initialEmail={email}
          initialName={name}
          inviterName={inviterName}
        />
      </div>
    </div>
  );
}
