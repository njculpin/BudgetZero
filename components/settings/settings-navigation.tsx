"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CreditCard, DollarSign, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SettingsNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const settingsNavItems: SettingsNavItem[] = [
  {
    label: "Profile",
    href: "/settings/profile",
    icon: User,
  },
  {
    label: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    label: "Privacy & Security",
    href: "/settings/privacy",
    icon: Shield,
  },
  {
    label: "Billing",
    href: "/settings/billing",
    icon: CreditCard,
  },
  {
    label: "Payouts",
    href: "/settings/payouts",
    icon: DollarSign,
  },
];

export function SettingsNavigation() {
  const pathname = usePathname();

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-slate-900 px-2">Settings</h3>
      <nav className="space-y-1" aria-label="Settings navigation">
        {settingsNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                isActive && "bg-accent text-accent-foreground"
              )}
              size="sm"
              asChild
            >
              <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                <Icon className="w-4 h-4 mr-2" aria-hidden="true" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
