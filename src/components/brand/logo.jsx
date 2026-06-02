import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_NAME, LOGO_ICON_SRC, LOGO_SRC } from "@/lib/constants";

/**
 * @param {"full" | "icon"} variant — full wordmark or compact mark for sidebar collapsed
 */
export function Logo({ className, variant = "full", href, priority = false }) {
  const src = variant === "icon" ? LOGO_ICON_SRC : LOGO_SRC;
  const size =
    variant === "icon"
      ? { width: 36, height: 36, className: cn("h-9 w-9 object-contain", className) }
      : { width: 160, height: 48, className: cn("h-9 w-auto max-w-[140px] object-contain object-left", className) };

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

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center">
        {img}
      </Link>
    );
  }

  return img;
}
