import Link from "next/link";
import Image from "next/image";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
  compact?: boolean;
  className?: string;
};

export function SiteLogo({ compact = false, className }: SiteLogoProps) {
  return (
    <Link
      href="/"
      aria-label={APP_NAME}
      className={cn("flex items-center gap-2 text-foreground", className)}
    >
      <span className="relative flex size-10 shrink-0 items-center justify-center">
        <Image
          src="/brand/selectshot-logo.png"
          alt=""
          width={830}
          height={823}
          priority
          className="size-10 object-contain drop-shadow-[0_0_14px_rgba(56,189,248,0.18)]"
        />
      </span>
      {!compact && (
        <span className="text-base font-semibold tracking-normal">{APP_NAME}</span>
      )}
    </Link>
  );
}
