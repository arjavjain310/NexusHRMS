import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Wallet,
  TrendingUp,
  Briefcase,
  FileSearch,
  Bot,
  Mic,
  PartyPopper,
  User,
  ClipboardCheck,
  CalendarRange,
} from "lucide-react";

const ICON_MAP = {
  LayoutDashboard,
  User,
  Users,
  Clock,
  CalendarDays,
  Wallet,
  TrendingUp,
  Briefcase,
  FileSearch,
  Bot,
  Mic,
  PartyPopper,
  ClipboardCheck,
  CalendarRange,
};

export function getNavIcon(name) {
  return ICON_MAP[name] || LayoutDashboard;
}
