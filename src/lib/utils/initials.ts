/**
 * Utility function to extract initials from a user's name or email address.
 * Follows DRY principles across task cards, detail modals, and comments.
 */
export function getInitials(nameOrEmail?: string | null): string {
  if (!nameOrEmail || !nameOrEmail.trim()) {
    return "--";
  }

  const clean = nameOrEmail.trim();

  // If email address, get part before @
  const target = clean.includes("@") ? clean.split("@")[0]! : clean;

  const parts = target.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "--";

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}
