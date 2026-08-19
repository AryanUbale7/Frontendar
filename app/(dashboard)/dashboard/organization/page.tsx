"use client";

import React from "react";
import { motion } from "framer-motion";
import { Building2, Users, Trophy, BarChart3, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RequireRole } from "@/components/auth/RequireRole";
import { useUser } from "@/hooks/useUser";

export default function OrganizationDashboardPage() {
  const { user } = useUser();

  return (
    <RequireRole role="org_admin">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[16px] border border-[#E2E8F0] bg-white p-6 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="accent" size="sm">
                Organization Console
              </Badge>
              <Badge variant="success" size="sm" dot>
                Host Active
              </Badge>
            </div>
            <h1 className="font-heading text-2xl font-bold text-[#0F172A]">
              {user?.organizationName || "Acme Tech Hub"} Management
            </h1>
            <p className="text-sm text-[#475569]">
              Manage applicant registrations, hackathon tracks, and prize distributions.
            </p>
          </div>

          <Button variant="default" leftIcon={<Plus className="h-4 w-4" />}>
            Configure New Challenge
          </Button>
        </div>

        {/* Org Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[#475569]">Total Applicants</p>
              <h3 className="font-heading text-2xl font-bold text-[#0F172A]">4,190</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#ACC00B]/10 text-[#ACC00B]">
              <Users className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[#475569]">Hosted Challenges</p>
              <h3 className="font-heading text-2xl font-bold text-[#0F172A]">6</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#FFD60A]/15 text-[#8A6500]">
              <Trophy className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[#475569]">Prize Awarded</p>
              <h3 className="font-heading text-2xl font-bold text-[#0F172A] font-code">$120,000</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#22C55E]/10 text-[#16A34A]">
              <Building2 className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[#475569]">Approval Rate</p>
              <h3 className="font-heading text-2xl font-bold text-[#0F172A]">94.2%</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#F59E0B]/10 text-[#D97706]">
              <BarChart3 className="h-5 w-5" />
            </div>
          </Card>
        </div>

        {/* Org Hackathons Table */}
        <Card>
          <CardHeader className="py-4 border-b border-[#E2E8F0]/60">
            <CardTitle className="text-base font-bold text-[#0F172A]">
              Hosted Event Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Registrations</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-bold text-[#0F172A]">Frontend Wars 2026</TableCell>
                  <TableCell className="font-code">1,240</TableCell>
                  <TableCell className="font-code">342</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">Manage Event</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold text-[#0F172A]">Global AI Challenge</TableCell>
                  <TableCell className="font-code">3,100</TableCell>
                  <TableCell className="font-code">890</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">Manage Event</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </RequireRole>
  );
}
