import { cn } from "@/lib/utils";

export function SkipNavigation() {
  const skipLinks = [
    { href: "#main-content", label: "Skip to main content" },
    { href: "#navigation", label: "Skip to navigation" },
  ];

  return (
    <div className="sr-only focus-within:not-sr-only">
      {skipLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={cn(
            "absolute top-0 left-0 z-[9999] p-3 bg-primary text-primary-foreground font-medium",
            "transform -translate-y-full focus:translate-y-0 transition-transform duration-300",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}
          data-testid={`skip-link-${link.href.replace('#', '')}`}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export default SkipNavigation;