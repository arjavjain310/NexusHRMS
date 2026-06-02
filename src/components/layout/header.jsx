"use client";

import { LogOut, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import { NotificationsMenu } from "./notifications-menu";
import { ROLE_LABELS } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
export function Header({
  user,
  onMenuClick
}) {
  const router = useRouter();
  const nameParts = user.name.split(" ") || ["User"];
  const firstName = nameParts[0] || "U";
  const lastName = nameParts.slice(1).join(" ") || "";
  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST"
    });
    router.push("/login");
    router.refresh();
  }
  return <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search employees, leaves, candidates..." className="pl-9 bg-muted/50 border-0" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <NotificationsMenu />

        <div className="hidden items-center gap-3 border-l pl-4 sm:flex">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(firstName, lastName || "X")}
            </AvatarFallback>
          </Avatar>
          <div className="text-right">
            <p className="text-sm font-medium leading-none">{user.name || user.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>;
}