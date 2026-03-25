"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, IndianRupee, Users, CheckCircle2, Clock, Search, ReceiptIndianRupee, AlertTriangle, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RentRecord = {
  id: string;
  month: string;
  amount: number;
  status: "paid" | "pending";
  student_id: string;
  students: {
    name: string;
    rooms: {
      room_number: string;
    } | null;
  } | null;
};

export default function RentPage() {
  const [records, setRecords] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const currentMonthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      year: 'numeric' 
    }).format(new Date()).replace(' ', '-');
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthLabel);
  const generationRun = useRef<Record<string, boolean>>({});

  useEffect(() => {
    fetchRentRecords();
  }, []);

  // Lazy generation only when current month is selected
  useEffect(() => {
    if (selectedMonth === currentMonthLabel && !generationRun.current[currentMonthLabel]) {
      generationRun.current[currentMonthLabel] = true;
      autoGenerateCurrentMonthRent();
    }
  }, [selectedMonth, currentMonthLabel]);

  async function fetchRentRecords() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("rent_records")
      .select("*, students(name, rooms(room_number))")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rent ledger:", error.message);
    } else if (data) {
      setRecords(data as any);
    }
    setLoading(false);
  }

  async function autoGenerateCurrentMonthRent() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Check if current month records already exist
    const { data: currentRecords } = await supabase
      .from("rent_records")
      .select("student_id")
      .eq("month", currentMonthLabel)
      .or(`user_id.eq.${user.id},user_id.is.null`);

    const studentsWithRentId = new Set(currentRecords?.map(r => r.student_id) || []);

    // 2. Fetch all active students
    const { data: activeStudents } = await supabase
      .from("students")
      .select("id")
      .eq("is_active", true)
      .or(`user_id.eq.${user.id},user_id.is.null`);

    // 3. Identify missing records
    const missingRentInserts = activeStudents
      ?.filter(s => !studentsWithRentId.has(s.id))
      .map(s => ({
        student_id: s.id,
        user_id: user.id,
        month: currentMonthLabel,
        amount: 8000, 
        status: "pending"
      })) || [];

    // 4. Batch insert missing records
    if (missingRentInserts.length > 0) {
      const { error: insertError } = await supabase
        .from("rent_records")
        .insert(missingRentInserts);
      
      if (!insertError) {
        // Just refresh the data
        fetchRentRecords();
      } else {
        console.error("Error auto-generating rent:", insertError.message);
      }
    }
  }

  const markAsPaid = async (id: string) => {
    setUpdatingId(id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("rent_records")
      .update({ status: "paid" })
      .eq("id", id)
      .or(`user_id.eq.${user?.id},user_id.is.null`);
    
    if (error) {
      console.error("Error updating status:", error.message);
      alert("Failed to update payment status. Check your permissions or connection.");
    } else {
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "paid" } : r))
      );
    }
    setUpdatingId(null);
  };

  const analytics = useMemo(() => {
    const isAll = selectedMonth === "all";
    const filteredForStats = isAll ? records : records.filter(r => r.month === selectedMonth);
    const pendingRecords = records.filter(r => r.status === "pending");
    
    return {
      expected: filteredForStats.reduce((acc, r) => acc + Number(r.amount), 0),
      collected: filteredForStats.filter(r => r.status === "paid").reduce((acc, r) => acc + Number(r.amount), 0),
      pending: filteredForStats.filter(r => r.status === "pending").reduce((acc, r) => acc + Number(r.amount), 0),
      historicalPending: pendingRecords.reduce((acc, r) => acc + Number(r.amount), 0),
      isAllMonths: isAll
    };
  }, [records, selectedMonth]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch = r.students?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.students?.rooms?.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.month.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMonth = selectedMonth === "all" || r.month === selectedMonth;
      return matchSearch && matchMonth;
    });
  }, [records, searchTerm, selectedMonth]);

  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(records.map(r => r.month)));
    if (!months.includes(currentMonthLabel)) months.push(currentMonthLabel);
    return months.sort((a,b) => b.localeCompare(a)); 
  }, [records, currentMonthLabel]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Rent Management</h2>
          <p className="text-sm text-muted-foreground text-balance">Track monthly rent payments and student balances.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {!analytics.isAllMonths ? (
          <>
            <Card className="border-none shadow-premium bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Expected ({selectedMonth})</CardTitle>
                <ReceiptIndianRupee className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">₹{analytics.expected.toLocaleString()}</div>
                <p className="text-[10px] text-muted-foreground/60 mt-1 font-bold">Projected for selected month</p>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-premium bg-emerald-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Collected ({selectedMonth})</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-emerald-600">₹{analytics.collected.toLocaleString()}</div>
                <p className="text-[10px] text-emerald-600/60 mt-1 font-bold">Successfully received</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-premium bg-amber-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Pending ({selectedMonth})</CardTitle>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-amber-600">₹{analytics.pending.toLocaleString()}</div>
                <p className="text-[10px] text-amber-600/60 mt-1 font-bold">Awaiting payments</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-none shadow-premium bg-muted/20 col-span-1 md:col-span-2 lg:col-span-3">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Historical Summary</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
                <div className="text-2xl font-black">Viewing Full History</div>
                <p className="text-[10px] text-muted-foreground/60 mt-1 font-bold">Aggregated data across all active billing months</p>
             </CardContent>
          </Card>
        )}

        <Card className={cn(
          "border-none shadow-premium",
          analytics.historicalPending > 0 ? "bg-rose-50/30" : "bg-emerald-50/30"
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Total Historical Arrears</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-600">₹{analytics.historicalPending.toLocaleString()}</div>
            <p className="text-[10px] text-rose-600/60 mt-1 font-bold">Lifetime unpaid balance</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white">
        <CardHeader className="border-b bg-muted/30 px-6 py-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4 max-w-sm flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, room or month..."
                className="pl-9 h-9 bg-background focus:ring-1 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Select onValueChange={(val) => setSelectedMonth(val || "all")} value={selectedMonth}>
              <SelectTrigger className="w-[160px] h-9 bg-background border-muted-foreground/10 text-xs font-bold">
                <SelectValue placeholder="Filter Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-bold">All Months</SelectItem>
                {availableMonths.map(m => (
                  <SelectItem key={m} value={m} className="text-xs font-bold">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted font-bold text-foreground">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6 w-[220px]">Student Name</TableHead>
                <TableHead className="w-[120px]">Room</TableHead>
                <TableHead className="w-[150px]">Month</TableHead>
                <TableHead className="w-[150px]">Amount</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
                <TableHead className="text-right px-6 w-[130px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground animate-pulse">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <span className="text-sm font-medium">Syncing rent ledger...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="px-6 py-4 font-semibold whitespace-nowrap text-foreground">
                      {record.students?.name || "Deleted Student"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="px-2 py-1 rounded-md bg-accent text-accent-foreground text-[11px] font-extrabold uppercase tracking-tight">
                        {record.students?.rooms?.room_number || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-sm font-medium">
                      {record.month}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-bold text-base">
                      ₹{record.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className={cn(
                        "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 w-fit rounded-full",
                        record.status === "paid" 
                          ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-700/20" 
                          : "bg-amber-100 text-amber-700 ring-1 ring-amber-700/20"
                      )}>
                        {record.status === "paid" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {record.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6 py-4 whitespace-nowrap">
                      {record.status === "pending" ? (
                        <Button
                          size="sm"
                          disabled={updatingId === record.id}
                          className="h-8 px-4 bg-primary hover:bg-primary/90 text-white font-bold text-[10px] uppercase tracking-wider transition-all min-w-[90px]"
                          onClick={() => markAsPaid(record.id)}
                        >
                          {updatingId === record.id ? (
                             <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          {updatingId === record.id ? "Syncing..." : "Mark Paid"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled
                          className="h-8 px-4 bg-muted text-muted-foreground font-bold text-[10px] uppercase tracking-wider cursor-not-allowed border-none min-w-[90px]"
                        >
                          Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
                       <ReceiptIndianRupee className="h-16 w-16 opacity-10 mb-2" />
                       <p className="font-bold text-lg">No records matched.</p>
                       <p className="text-sm">Try adjusting your search terms.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
