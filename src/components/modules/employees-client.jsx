"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Plus, Search, ChevronRight } from "lucide-react";
export function EmployeesClient() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchEmployees();
  }, [search]);
  async function fetchEmployees() {
    setLoading(true);
    const res = await fetch(`/api/employees?search=${encodeURIComponent(search)}`);
    const json = await res.json();
    setEmployees(json.data || []);
    setLoading(false);
  }
  return <div>
      <PageHeader title="Employees" description="Employee directory, profiles, departments, and hierarchy" action={<Button>
            <Plus className="h-4 w-4" /> Add Employee
          </Button>} />

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, email, or code..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {loading ? Array.from({
        length: 4
      }).map((_, i) => <Card key={i} className="animate-pulse h-20" />) : employees.map(emp => <Link key={emp.id} href={`/employees/${emp.id}`}>
                <Card className="hover:shadow-soft transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(emp.firstName, emp.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{emp.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary">{emp.department.name || "—"}</Badge>
                        <Badge variant="outline">{emp.designation.title}</Badge>
                        <Badge variant={emp.status === "ACTIVE" ? "success" : "outline"}>
                          {emp.status}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>)}
      </div>
    </div>;
}