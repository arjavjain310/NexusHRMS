import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const HOLIDAYS = [
  { name: "New Year's Day", date: "Jan 1, 2025" },
  { name: "Independence Day", date: "Jul 4, 2025" },
  { name: "Thanksgiving", date: "Nov 27, 2025" },
  { name: "Christmas", date: "Dec 25, 2025" },
];

export default function HolidaysPage() {
  return (
    <div>
      <PageHeader
        title="Holiday Calendar"
        description="Company holidays and optional leave days"
      />
      <Card>
        <CardHeader>
          <CardTitle>2025 Holidays</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {HOLIDAYS.map((h) => (
            <div key={h.name} className="flex items-center justify-between rounded-lg border p-4">
              <span className="font-medium">{h.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{h.date}</span>
                <Badge variant="success">Public</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
