"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical, Plus, UserMinus, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmployeeMoreOptions({
  canManage,
  isAdmin,
  onAddEmployee,
  onRemoveEmployee,
  onManageAccess,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (!canManage && !isAdmin) return null;

  const items = [];
  if (canManage) {
    items.push({
      key: "add",
      label: "Add employee",
      icon: Plus,
      onClick: () => {
        setOpen(false);
        onAddEmployee();
      },
    });
    items.push({
      key: "remove",
      label: "Remove employee",
      icon: UserMinus,
      onClick: () => {
        setOpen(false);
        onRemoveEmployee();
      },
    });
  }
  if (isAdmin) {
    items.push({
      key: "access",
      label: "Manage employee access",
      icon: Shield,
      onClick: () => {
        setOpen(false);
        onManageAccess();
      },
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-4 w-4" />
        More options
      </Button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full z-50 mt-2 min-w-[220px] rounded-lg border bg-popover p-1 shadow-lg",
            "animate-in fade-in-0 zoom-in-95"
          )}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted text-left"
              onClick={item.onClick}
            >
              <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
