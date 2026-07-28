"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Server, Users, Activity, Terminal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RequireRole } from "@/components/auth/RequireRole";

export default function PlatformAdminDashboardPage() {
  return (
    <RequireRole role="platform_admin">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[16px] border border-[#E2E8F0] bg-[#0F172A] p-6 text-white shadow-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="solid" size="sm" className="bg-[#FF006E] text-white">
                Platform Admin
              </Badge>
              <Badge variant="success" size="sm" dot>
                Global Nodes Active
              </Badge>
            </div>
            <h1 className="font-heading text-2xl font-bold">
              Frontend Arena System Telemetry
            </h1>
            <p className="text-sm text-slate-300">
              Super-admin system governance, cluster health, and global user management.
            </p>
          </div>

          <Button variant="gradient" leftIcon={<Terminal className="h-4 w-4" />}>
            System Diagnostics
          </Button>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[#475569]">Global Users</p>
              <h3 className="font-heading text-2xl font-bold text-[#0F172A]">52,840</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#FF006E]/10 text-[#FF006E]">
              <Users className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[#475569]">Subnet Health</p>
              <h3 className="font-heading text-2xl font-bold text-[#22C55E]">99.99%</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#22C55E]/10 text-[#16A34A]">
              <Server className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[#475569]">Active Sockets</p>
              <h3 className="font-heading text-2xl font-bold text-[#0F172A] font-code">14,290</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#FFD60A]/15 text-[#8A6500]">
              <Activity className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[#475569]">System Security</p>
              <h3 className="font-heading text-2xl font-bold text-[#0F172A]">SOC2 Pass</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#F59E0B]/10 text-[#D97706]">
              <Shield className="h-5 w-5" />
            </div>
          </Card>
        </div>

        {/* Global Cluster Table */}
        <Card>
          <CardHeader className="py-4 border-b border-[#E2E8F0]/60">
            <CardTitle className="text-base font-bold text-[#0F172A]">
              Global Node Audit Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subnet Cluster</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Load</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-bold text-[#0F172A]">node-us-east-1</TableCell>
                  <TableCell>N. Virginia</TableCell>
                  <TableCell className="font-code">24.5%</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="success" size="sm">Healthy</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold text-[#0F172A]">node-eu-west-1</TableCell>
                  <TableCell>Frankfurt</TableCell>
                  <TableCell className="font-code">42.1%</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="success" size="sm">Healthy</Badge>
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
