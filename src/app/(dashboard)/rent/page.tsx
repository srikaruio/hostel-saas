"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, IndianRupee, Users, CheckCircle2, Clock, Search, ReceiptIndianRupee, AlertTriangle, CalendarDays, Calendar, Plus, TrendingUp, CheckCircle } from "lucide-react";
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
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col sm:items-center sm:flex-row justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Rent Ledger</h2>
          <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">Financial Records & billing</p>
        </div>
        <Button className="w-full sm:w-auto gap-2 shadow-none font-bold h-9 px-4 text-xs bg-foreground text-background hover:bg-foreground/90 transition-all rounded-lg">
          <Plus className="h-3.5 w-3.5" />
          Add Entry
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {selectedMonth !== "all" ? (
          <>
            <Card className="bg-card border border-border shadow-none transition-colors hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-1">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Expected</CardTitle>
                <div className="p-1 bg-muted/10 rounded-md"><ReceiptIndianRupee className="h-3 w-3 text-muted-foreground/50" /></div>
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                <div className="text-lg md:text-xl font-black text-foreground">₹{analytics.expected.toLocaleString()}</div>
                <p className="text-[9px] text-muted-foreground/40 font-bold">{selectedMonth}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-emerald-500/5 border border-emerald-500/20 shadow-none transition-colors hover:border-emerald-500/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-1">
                <CardTitle className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Collected</CardTitle>
                <div className="p-1 bg-emerald-500/10 rounded-md"><CheckCircle2 className="h-3 w-3 text-emerald-500" /></div>
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                <div className="text-lg md:text-xl font-black text-foreground">₹{analytics.collected.toLocaleString()}</div>
                <p className="text-[9px] text-emerald-500/40 font-bold uppercase tracking-tight">Paid</p>
              </CardContent>
            </Card>

            <Card className="bg-amber-500/5 border border-amber-500/20 shadow-none transition-colors hover:border-amber-500/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-1">
                <CardTitle className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Pending</CardTitle>
                <div className="p-1 bg-amber-500/10 rounded-md"><Clock className="h-3 w-3 text-amber-500" /></div>
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                <div className="text-lg md:text-xl font-black text-foreground">₹{analytics.pending.toLocaleString()}</div>
                <p className="text-[9px] text-amber-500/40 font-bold uppercase tracking-tight">Unpaid</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="bg-card border border-border shadow-none col-span-1 sm:col-span-2 lg:col-span-3 transition-colors hover:border-primary/20">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-1">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Historical Summary</CardTitle>
                <div className="p-1 bg-muted/10 rounded-md"><IndianRupee className="h-3 w-3 text-muted-foreground/30" /></div>
             </CardHeader>
             <CardContent className="p-3 md:p-4 pt-0">
                <div className="text-lg md:text-xl font-black text-foreground">All Time Revenue</div>
                <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-tight">Aggregated Totals</p>
             </CardContent>
          </Card>
        )}

        <Card className={cn(
          "border shadow-none transition-colors",
          analytics.historicalPending > 0 
           ? "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40" 
           : "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-1">
            <CardTitle className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              analytics.historicalPending > 0 ? "text-rose-400" : "text-emerald-400"
            )}>Arrears</CardTitle>
            <div className={cn(
              "p-1 rounded-md",
              analytics.historicalPending > 0 ? "bg-rose-500/10" : "bg-emerald-500/10"
            )}>
              <AlertTriangle className={cn("h-3 w-3", analytics.historicalPending > 0 ? "text-rose-500" : "text-emerald-500")} />
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className={cn(
              "text-lg md:text-xl font-black",
              analytics.historicalPending > 0 ? "text-rose-400" : "text-foreground"
            )}>₹{analytics.historicalPending.toLocaleString()}</div>
            <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-tight">Total Dues</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border border-border shadow-none overflow-hidden hover:border-primary/20 transition-colors">
        <CardHeader className="py-2.5 px-4 md:py-3 md:px-6 relative border-b border-border bg-muted/5 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1 flex flex-col sm:flex-row gap-2 max-w-full md:max-w-xl">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Find entries..."
                className="pl-9 h-9 bg-muted/20 border-border shadow-none focus:ring-1 focus:ring-primary/20 rounded-lg text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={selectedMonth} onValueChange={(val) => setSelectedMonth(val || "all")}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 bg-muted/20 border-border font-bold text-[11px] rounded-lg focus:ring-1 focus:ring-primary/20">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <SelectValue placeholder="Period" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-lg border-border bg-card shadow-2xl">
                <SelectItem value="all" className="font-bold cursor-pointer text-xs">Full History</SelectItem>
                {availableMonths.map(m => (
                  <SelectItem key={m} value={m} className="font-bold cursor-pointer text-xs">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px] lg:min-w-full">
            <TableHeader className="bg-muted/10 font-bold border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6 py-3 font-bold text-[10px] text-foreground uppercase tracking-widest w-[220px]">Student Identifier</TableHead>
                <TableHead className="py-3 font-bold text-[10px] text-foreground uppercase tracking-widest w-[120px]">Room</TableHead>
                <TableHead className="py-3 font-bold text-[10px] text-foreground uppercase tracking-widest w-[150px]">Billing Period</TableHead>
                <TableHead className="py-3 font-bold text-[10px] text-foreground uppercase tracking-widest w-[150px]">Entry Amount</TableHead>
                <TableHead className="py-3 font-bold text-[10px] text-foreground uppercase tracking-widest w-[150px]">Payment Status</TableHead>
                <TableHead className="text-right px-6 py-3 font-bold text-[10px] text-foreground uppercase tracking-widest w-[130px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-transparent border-none">
                   <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground/60 animate-in fade-in zoom-in-95">
                        <Loader2 className="h-10 w-10 animate-spin text-neutral-700" />
                        <span className="text-xs font-bold uppercase tracking-widest">Fetching Ledger...</span>
                      </div>
                   </TableCell>
                </TableRow>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((record: RentRecord) => (
                  <TableRow key={record.id} className="hover:bg-muted/5 border-border transition-colors group">
                    <TableCell className="px-6 py-3.5 font-bold whitespace-nowrap text-foreground text-sm">
                      {record.students?.name || "Deleted Student"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-muted border border-border text-foreground text-[10px] font-black uppercase tracking-tight">
                        {record.students?.rooms?.room_number || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-[11px] font-bold uppercase tracking-tight">
                      {record.month}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-black text-sm text-foreground">
                      ₹{record.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className={cn(
                        "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight px-2 py-0.5 w-fit rounded-md border",
                        record.status === "paid" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        <div className={cn("h-1 w-1 rounded-full animate-pulse", record.status === "paid" ? "bg-emerald-400" : "bg-amber-400")} />
                        {record.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6 py-3.5 whitespace-nowrap">
                      {record.status === "pending" ? (
                        <Button
                          size="sm"
                          disabled={updatingId === record.id}
                          className="h-8 px-4 bg-foreground hover:bg-foreground/90 text-background font-bold text-[10px] uppercase tracking-wider transition-all min-w-[90px] rounded-lg"
                          onClick={() => markAsPaid(record.id)}
                        >
                          {updatingId === record.id ? (
                             <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          {updatingId === record.id ? "Syncing..." : "Mark Paid"}
                        </Button>
                      ) : (
                        <div className="flex justify-end pr-2 text-emerald-500/40">
                           <CheckCircle2 className="h-5 w-5" />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/30">
                       <ReceiptIndianRupee className="h-16 w-16 opacity-5 mb-2" />
                       <p className="font-black text-lg uppercase tracking-widest">No matching records</p>
                       <p className="text-xs font-bold">Try adjusting your filters or search terms.</p>
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
