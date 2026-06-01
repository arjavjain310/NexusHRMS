import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";










export function StatCard({ title, value, change, trend, icon: Icon, className }) {
  return (
    <Card className={cn("overflow-hidden transition-shadow hover:shadow-soft", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            {change && (
              <div className="flex items-center gap-1 text-xs">
                {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
                <span
                  className={cn(
                    trend === "up" && "text-emerald-600",
                    trend === "down" && "text-red-500",
                    trend === "neutral" && "text-muted-foreground"
                  )}
                >
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className="rounded-xl bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
