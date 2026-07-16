import Link from "next/link";
import { Syne } from "next/font/google";
import { cn } from "@/lib/utils";

/** Distinct display face for the 2NP mark (app UI uses Figtree). */
const logoFont = Syne({
  weight: ["700", "800"],
  subsets: ["latin"],
  display: "swap",
});

interface LogoProps {
  className?: string;
  /** When false, show compact monogram only (sidebar collapsed). */
  showText?: boolean;
  onClick?: () => void;
  href?: string;
}

/** Text-based 2NP logo — geometric monogram + wordmark. */
export function Logo({
  className,
  showText = true,
  onClick,
  href = "/dashboard",
}: LogoProps) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5", className)}
      onClick={onClick}
      aria-label="2NP"
    >
      <span
        className={cn(
          logoFont.className,
          "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[13px] font-extrabold tracking-tight text-primary-foreground shadow-sm",
        )}
      >
        2N
      </span>
      {showText && (
        <span
          className={cn(
            logoFont.className,
            "select-none text-[22px] font-extrabold leading-none tracking-[0.08em] text-foreground",
          )}
        >
          2NP
        </span>
      )}
    </Link>
  );
}

export function WordLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-3", className)}
      aria-label="2NP"
    >
      <span
        className={cn(
          logoFont.className,
          "flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-[16px] font-extrabold tracking-tight text-primary-foreground shadow-sm",
        )}
      >
        2N
      </span>
      <span
        className={cn(
          logoFont.className,
          "select-none text-[36px] font-extrabold leading-none tracking-[0.08em] text-foreground",
        )}
      >
        2NP
      </span>
    </span>
  );
}
