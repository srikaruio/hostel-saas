"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DoorClosed, IndianRupee, MessageSquareWarning, Loader2, Clock } from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    {
      title: "Total Students",
      value: "0",
      description: "Syncing...",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Pending Rent",
      value: "₹0",
      description: "Refining totals...",
      icon: IndianRupee,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Vacant Beds",
      value: "0",
      description: "Across rooms",
      icon: DoorClosed,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ]);

  const [occupancy, setOccupancy] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Active Students Count
    const { count: studentCount } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .or(`user_id.eq.${user.id},user_id.is.null`);
    
    // 2. Pending Rent Metrics (Count and Sum)
    const { data: rentData } = await supabase
      .from("rent_records")
      .select("amount")
      .eq("status", "pending")
      .or(`user_id.eq.${user.id},user_id.is.null`);
      
    const pendingCount = rentData?.length || 0;
    const totalPendingAmount = rentData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
    
    // 3. Active Rooms / Vacant Beds
    const { data: roomsData } = await supabase
      .from("rooms")
      .select("total_beds")
      .eq("is_active", true)
      .or(`user_id.eq.${user.id},user_id.is.null`);

    const totalActiveRooms = roomsData?.length || 0;
    const totalBeds = roomsData?.reduce((acc, curr) => acc + curr.total_beds, 0) || 0;
    const vacantBeds = Math.max(0, totalBeds - (studentCount || 0));

    setStats([
      {
        title: "Active Students",
        value: (studentCount || 0).toString(),
        description: "Residents enrolled",
        icon: Users,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
      },
      {
        title: "Active Rooms",
        value: totalActiveRooms.toString(),
        description: "Configured units",
        icon: DoorClosed,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
      },
      {
        title: "Vacant Beds",
        value: vacantBeds.toString(),
        description: `Out of ${totalBeds} total`,
        icon: DoorClosed,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
      },
      {
        title: "Pending Rent",
        value: `₹${totalPendingAmount.toLocaleString()}`,
        description: `${pendingCount} Students Pending`,
        icon: IndianRupee,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
      },
    ]);

    if (totalBeds > 0) {
      setOccupancy(Math.round(((studentCount || 0) / totalBeds) * 100));
    }

    setLoading(false);
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${stat.color.replace('text-', 'bg-')}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{stat.title}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-lg transition-transform group-hover:scale-110`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2">
                   <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
                   <div className="h-7 w-12 bg-muted rounded animate-pulse" />
                </div>
              ) : (
                <div className="text-2xl font-black">{stat.value}</div>
              )}
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-premium bg-white overflow-hidden">
          <CardHeader className="border-b bg-muted/10">
            <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-5 py-8 items-center justify-center text-center">
               <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-2">
                  <Clock className="h-6 w-6 text-muted-foreground/40" />
               </div>
               <p className="text-sm font-bold text-muted-foreground">No recent activity</p>
               <p className="text-xs text-muted-foreground/60 max-w-[200px]">Real-time logs for student updates and payments will appear here.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-none shadow-premium bg-white overflow-hidden">
          <CardHeader className="border-b bg-muted/10">
            <CardTitle className="text-lg font-bold">Hostel Statistics</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Global Occupancy</span>
                  <span className="text-2xl font-black text-primary">{occupancy}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden ring-1 ring-black/5">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out" 
                    style={{ width: `${occupancy}%` }} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Health Status</p>
                   <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Optimal</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">System Sync</p>
                   <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Live</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
