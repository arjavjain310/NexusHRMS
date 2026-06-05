"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AddEmployeeForm } from "@/components/employees/add-employee-form";
import { EmployeeMoreOptions } from "@/components/employees/employee-more-options";
import { RemoveEmployeeDialog } from "@/components/employees/remove-employee-dialog";
import { ManageEmployeeAccessDialog } from "@/components/employees/manage-employee-access-dialog";
import { GENDER_LABELS, ROLE_LABELS } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import { Search, ChevronRight } from "lucide-react";

export function EmployeesClient({ canManage = false, isAdmin = false }) {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showRemove, setShowRemove] = useState(false);
  const [showAccess, setShowAccess] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/employees?search=${encodeURIComponent(search)}`);
    const json = await res.json();
    setEmployees(json.data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const showMoreMenu = canManage || isAdmin;

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Employee directory, profiles, departments, and hierarchy"
        action={
          showMoreMenu ? (
            <EmployeeMoreOptions
              canManage={canManage}
              isAdmin={isAdmin}
              onAddEmployee={() => setShowAdd(true)}
              onRemoveEmployee={() => setShowRemove(true)}
              onManageAccess={() => setShowAccess(true)}
            />
          ) : null
        }
      />

      <AddEmployeeForm
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={() => fetchEmployees()}
      />

      <RemoveEmployeeDialog
        open={showRemove}
        onClose={() => setShowRemove(false)}
        employees={employees}
        onRemoved={() => fetchEmployees()}
      />

      <ManageEmployeeAccessDialog open={showAccess} onClose={() => setShowAccess(false)} />

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or code..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse h-20" />
            ))
          : employees.length === 0
            ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No employees found.
                  {canManage && (
                    <>
                      {" "}
                      <button
                        type="button"
                        className="text-primary underline"
                        onClick={() => setShowAdd(true)}
                      >
                        Add your first employee
                      </button>
                    </>
                  )}
                </CardContent>
              </Card>
            )
            : employees.map((emp) => (
                <Link key={emp.id} href={`/employees/${emp.id}`}>
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
                          <Badge variant="secondary">{emp.department?.name || "—"}</Badge>
                          <Badge variant="outline">{emp.designation?.title || "—"}</Badge>
                          {emp.gender && (
                            <Badge variant="outline">
                              {GENDER_LABELS[emp.gender] || emp.gender}
                            </Badge>
                          )}
                          {!emp.gender && (
                            <Badge variant="warning">Gender not set</Badge>
                          )}
                          {emp.user?.role && (
                            <Badge variant="outline">
                              {ROLE_LABELS[emp.user.role] || emp.user.role}
                            </Badge>
                          )}
                          <Badge variant={emp.status === "ACTIVE" ? "success" : "outline"}>
                            {emp.status}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
      </div>
    </div>
  );
}
