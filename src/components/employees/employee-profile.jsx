"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials, formatDate } from "@/lib/utils";
import { Mail, Phone, MapPin, Hash, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
const STATUS_LABELS = {
  NOT_IN_YET: {
    label: "NOT IN YET",
    className: "bg-teal-500/15 text-teal-700 border-teal-200"
  },
  CLOCKED_IN: {
    label: "CLOCKED IN",
    className: "bg-emerald-500/15 text-emerald-700 border-emerald-200"
  },
  CLOCKED_OUT: {
    label: "CLOCKED OUT",
    className: "bg-muted text-muted-foreground"
  }
};
export function EmployeeProfile({
  employeeId
}) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/employees/${employeeId}`).then(r => r.json()).then(j => {
      setEmployee(j.data || null);
      setLoading(false);
    });
  }, [employeeId]);
  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Loading profile...</div>;
  }
  if (!employee) {
    return <div className="py-20 text-center">
        <p className="text-muted-foreground">Employee not found</p>
        <Link href="/employees" className="text-primary text-sm mt-2 inline-block">
          Back to directory
        </Link>
      </div>;
  }
  const status = STATUS_LABELS[employee.attendanceStatus || "NOT_IN_YET"] || STATUS_LABELS.NOT_IN_YET;
  return <div className="space-y-0 -m-4 lg:-m-8">
      {/* Banner */}
      <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 text-white px-4 lg:px-8 pt-8 pb-24">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <Avatar className="h-24 w-24 border-4 border-white/20">
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {getInitials(employee.firstName, employee.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold">
                {employee.firstName} {employee.lastName}
              </h1>
              <Badge variant="outline" className={cn("border", status.className)}>
                {status.label}
              </Badge>
            </div>
            <p className="text-white/80 mt-1">{employee.designation.title || "Employee"}</p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> {employee.email}
              </span>
              {employee.phone && <span className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" /> {employee.phone}
                </span>}
              {(employee.city || employee.country) && <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {[employee.city, employee.country].filter(Boolean).join(", ")}
                </span>}
              <span className="flex items-center gap-1.5">
                <Hash className="h-4 w-4" /> {employee.employeeCode}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hierarchy cards */}
      <div className="px-4 lg:px-8 -mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
        {[{
        label: "Business Unit",
        value: employee.businessUnit || "—",
        icon: Building2
      }, {
        label: "Department",
        value: employee.department.name || "—",
        icon: Building2
      }, {
        label: "Sub Department",
        value: employee.subDepartment || "—",
        icon: Building2
      }, {
        label: "Reporting Manager",
        value: employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "—",
        icon: Users
      }].map(item => <Card key={item.label} className="shadow-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
              <p className="font-medium mt-1 flex items-center gap-2">
                <item.icon className="h-4 w-4 text-primary shrink-0" />
                {item.value}
              </p>
            </CardContent>
          </Card>)}
      </div>

      <div className="px-4 lg:px-8 py-6">
        <Tabs defaultValue="about">
          <TabsList className="mb-6">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="job">Job</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {employee.bio || `${employee.firstName} is a valued member of ${employee.organization.name || "the organization"}.`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Degrees & Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                {employee.education.length ? <div className="space-y-4">
                    {employee.education.map((edu, i) => <div key={i} className="grid sm:grid-cols-3 gap-2 text-sm border-b pb-3 last:border-0">
                        <div>
                          <p className="text-muted-foreground text-xs">Degree</p>
                          <p className="font-medium">{edu.degree || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Branch / Specialization</p>
                          <p>{edu.branch || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">CGPA / Percentage</p>
                          <p>{edu.cgpa || "—"}</p>
                        </div>
                      </div>)}
                  </div> : <p className="text-sm text-muted-foreground">No education records added.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardContent className="p-6 grid sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">PAN</p>
                  <p className="font-medium">{employee.panNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">UAN</p>
                  <p className="font-medium">{employee.uan || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">PF Number</p>
                  <p className="font-medium">{employee.pfNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Mode</p>
                  <p className="font-medium">{employee.paymentMode || "Bank Transfer"}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="job">
            <Card>
              <CardContent className="p-6 grid sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Date Joined</p>
                  <p className="font-medium">{formatDate(employee.dateOfJoining)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Employment Status</p>
                  <Badge variant="success">{employee.status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Designation</p>
                  <p className="font-medium">{employee.designation.title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{employee.employeeCode}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardContent className="p-6">
                {employee.documents.length ? <ul className="space-y-2">
                    {employee.documents.map(doc => <li key={doc.id} className="flex justify-between items-center border rounded-lg px-4 py-3 text-sm">
                        <span className="font-medium">{doc.name}</span>
                        <span className="text-muted-foreground">{doc.type}</span>
                      </li>)}
                  </ul> : <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}