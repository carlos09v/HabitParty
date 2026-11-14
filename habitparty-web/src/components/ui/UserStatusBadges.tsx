import {
  CheckCircle2,
  Clock,
  Crown,
  Shield,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/utils";

interface UserRoleBadgeProps {
  role?: "USER" | "ADMIN" | string | null;
  adminLabel: string;
  userLabel?: string;
  showUserRole?: boolean;
  className?: string;
}

export function UserRoleBadge({
  role,
  adminLabel,
  userLabel,
  showUserRole = false,
  className,
}: UserRoleBadgeProps) {
  if (role === "ADMIN") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-bold bg-magenta/15 text-magenta border border-magenta/35",
          className,
        )}
      >
        <Shield size={11} />
        {adminLabel}
      </span>
    );
  }

  if (!showUserRole || !userLabel) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-semibold bg-surface text-neutral-300 border border-neutral-700 dark:border-primary/20",
        className,
      )}
    >
      <UserIcon size={11} />
      {userLabel}
    </span>
  );
}

interface UserPlanBadgeProps {
  isPremium?: boolean | null;
  premiumLabel: string;
  freeLabel: string;
  className?: string;
}

export function UserPlanBadge({
  isPremium,
  premiumLabel,
  freeLabel,
  className,
}: UserPlanBadgeProps) {
  if (isPremium) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-bold bg-gold/20 text-amber-800 dark:text-gold border border-gold/40 shadow-2xs",
          className,
        )}
      >
        <Crown size={11} className="stroke-2" />
        {premiumLabel}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-semibold bg-surface border border-neutral-700 dark:border-primary/25 text-neutral-300",
        className,
      )}
    >
      <Sparkles size={11} className="text-neutral-400" />
      {freeLabel}
    </span>
  );
}

interface UserVerifiedBadgeProps {
  isVerified?: boolean | null;
  verifiedLabel: string;
  unverifiedLabel: string;
  title?: string;
  className?: string;
}

export function UserVerifiedBadge({
  isVerified,
  verifiedLabel,
  unverifiedLabel,
  title,
  className,
}: UserVerifiedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-label-m font-bold uppercase tracking-wider border",
        isVerified
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35"
          : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35",
        className,
      )}
      title={title}
    >
      {isVerified ? (
        <CheckCircle2 size={10} className="shrink-0" />
      ) : (
        <Clock size={10} className="shrink-0" />
      )}
      {isVerified ? verifiedLabel : unverifiedLabel}
    </span>
  );
}
