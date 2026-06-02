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
import { BioEditor, EducationEditor } from "@/components/employees/profile-section-editor";
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
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((j) => setIsOwner(j.data?.id === employeeId))
      .catch(() => setIsOwner(false));
  }, [employeeId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/employees/${employeeId}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const row = j.data;
        if (row) {
          setEmployee({
            ...row,
            education: Array.isArray(row.education) ? row.education : [],
            documents: Array.isArray(row.documents) ? row.documents : [],
          });
        } else {
          setEmployee(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setEmployee(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
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
  const hierarchyCards = [
    {
      label: "Business Unit",
      value: employee.businessUnit || "—",
      icon: Building2,
    },
    {
      label: "Department",
      value: employee.department?.name || "—",
      icon: Building2,
    },
    {
      label: "Sub Department",
      value: employee.subDepartment || "—",
      icon: Building2,
    },
  ];
  if (employee.manager) {
    hierarchyCards.push({
      label: "Reporting Manager",
      value: `${employee.manager.firstName} ${employee.manager.lastName}`,
      icon: Users,
    });
  }

  const fallbackBio = `${employee.firstName} is a valued member of ${employee.organization?.name || "the organization"}.`;

  return <div className="space-y-0 -mx-4 lg:-mx-8">
      {/* Banner */}
      <div className="relative rounded-xl mx-4 lg:mx-8 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 text-white px-5 lg:px-7 pt-6 pb-7">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <Avatar className="h-20 w-20 border-4 border-white/20 shrink-0">
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {getInitials(employee.firstName, employee.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold sm:text-2xl">
                {employee.firstName} {employee.lastName}
              </h2>
              <Badge variant="outline" className={cn("border", status.className)}>
                {status.label}
              </Badge>
            </div>
            <p className="text-white/80 mt-1">{employee.designation?.title || "Employee"}</p>
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
      <div
        className={cn(
          "px-4 lg:px-8 mt-6 mb-2 grid gap-4 sm:grid-cols-2",
          hierarchyCards.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
        )}
      >
        {hierarchyCards.map((item) => (
          <Card key={item.label} className="shadow-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
              <p className="font-medium mt-1 flex items-center gap-2">
                <item.icon className="h-4 w-4 text-primary shrink-0" />
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="px-4 lg:px-8 pt-4 pb-6">
        <Tabs defaultValue="about">
          <TabsList className="mb-6">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="job">Job</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                {isOwner ? (
                  <BioEditor
                    employeeId={employee.id}
                    initialBio={employee.bio}
                    fallbackBio={fallbackBio}
                    onSaved={(data) =>
                      setEmployee((prev) => ({
                        ...prev,
                        bio: data.bio,
                        education: Array.isArray(data.education) ? data.education : prev.education,
                      }))
                    }
                  />
                ) : (
                  <>
                    <p className="text-base font-semibold">Summary</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                      {employee.bio || fallbackBio}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                {isOwner ? (
                  <EducationEditor
                    employeeId={employee.id}
                    initialEducation={employee.education}
                    onSaved={(data) =>
                      setEmployee((prev) => ({
                        ...prev,
                        education: Array.isArray(data.education) ? data.education : [],
                        bio: data.bio ?? prev.bio,
                      }))
                    }
                  />
                ) : (
                  <>
                    <p className="text-base font-semibold">Degrees & Certificates</p>
                    {Array.isArray(employee.education) && employee.education.length > 0 ? (
                      <div className="space-y-4 mt-4">
                        {employee.education.map((edu, i) => (
                          <div
                            key={i}
                            className="grid sm:grid-cols-3 gap-2 text-sm border-b pb-3 last:border-0"
                          >
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
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-4">No education records added.</p>
                    )}
                  </>
                )}
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
                  <p className="font-medium">
                    {employee.dateOfJoining ? formatDate(employee.dateOfJoining) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Employment Status</p>
                  <Badge variant="success">{employee.status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Designation</p>
                  <p className="font-medium">{employee.designation?.title || "—"}</p>
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
                {(employee.documents || []).length > 0 ? (
                  <ul className="space-y-2">
                    {(employee.documents || []).map((doc) => (
                      <li
                        key={doc.id}
                        className="flex justify-between items-center border rounded-lg px-4 py-3 text-sm"
                      >
                        <span className="font-medium">{doc.name}</span>
                        <span className="text-muted-foreground">{doc.type}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}