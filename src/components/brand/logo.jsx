import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_NAME, BRAND_TITLE, LOGO_ICON_SRC, LOGO_SRC } from "@/lib/constants";

/**
 * @param {"full" | "icon" | "mark"} variant — full image, icon only, or icon + BRAND_TITLE
 */
export function Logo({
  className,
  variant = "full",
  href,
  priority = false,
  showTitle,
}) {
  const withTitle = showTitle ?? variant === "mark";
  const useIcon = variant === "icon" || variant === "mark";
  const src = useIcon ? LOGO_ICON_SRC : LOGO_SRC;
  const size = useIcon
    ? { width: 36, height: 36, className: cn("h-9 w-9 shrink-0 object-contain", className) }
    : {
        width: 160,
        height: 48,
        className: cn("h-9 w-auto max-w-[140px] object-contain object-left", className),
      };

  const img = (
    <Image
      src={src}
      alt={APP_NAME}
      width={size.width}
      height={size.height}
      className={size.className}
      priority={priority}
    />
  );

  const content = withTitle ? (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      {img}
      <span className="truncate text-base font-semibold tracking-tight text-foreground">
        {BRAND_TITLE}
      </span>
    </span>
  ) : (
    img
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex min-w-0 max-w-full shrink-0 items-center">
        {content}
      </Link>
    );
  }

  return content;
}
