import Link from "next/link";
import { EmployeeProfile } from "@/components/employees/employee-profile";
import { ChevronLeft } from "lucide-react";

export default async function EmployeeDetailPage({
  params,
}

) {
  const { id } = await params;

  return (
    <div>
      <Link
        href="/employees"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4" /> Back to directory
      </Link>
      <EmployeeProfile employeeId={id} />
    </div>
  );
}
