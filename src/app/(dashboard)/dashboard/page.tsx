"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DoorClosed, IndianRupee, Loader2, Clock } from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    {
      title: "Active Students",
      value: "0",
      description: "Residents enrolled",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Active Rooms",
      value: "0",
      description: "Configured units",
      icon: DoorClosed,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      title: "Vacant Beds",
      value: "0",
      description: "Available slots",
      icon: DoorClosed,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Pending Rent",
      value: "₹0",
      description: "Total outstanding",
      icon: IndianRupee,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
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
    
    // 2. Pending Rent Metrics
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
    <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-500 lg:px-4">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border border-border shadow-none hover:border-primary/30 transition-colors overflow-hidden relative group">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${stat.color.replace('text-', 'bg-')}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-4 md:pb-1.5">
              <CardTitle className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">{stat.title}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-1 rounded-md`}>
                <stat.icon className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
              {loading ? (
                <div className="h-7 w-16 bg-muted/20 rounded animate-pulse" />
              ) : (
                <div className="text-xl md:text-2xl font-black text-foreground">{stat.value}</div>
              )}
              <p className="text-[10px] font-bold text-muted-foreground/50 truncate">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 bg-card border border-border shadow-none overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/5 py-3 px-4 md:py-4 md:px-6">
            <CardTitle className="text-sm md:text-base font-black uppercase tracking-tight text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-3 py-8 md:py-12 items-center justify-center text-center">
               <div className="h-10 w-10 rounded-full bg-muted/10 flex items-center justify-center mb-1">
                  <Clock className="h-5 w-5 text-muted-foreground/30" />
               </div>
               <p className="text-sm font-bold text-muted-foreground">No recent activity</p>
               <p className="text-xs text-muted-foreground/40 max-w-[200px]">Logs for student updates and payments will appear here.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-card border border-border shadow-none overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/5 py-3 px-4 md:py-4 md:px-6">
            <CardTitle className="text-sm md:text-base font-black uppercase tracking-tight text-foreground">Hostel Statistics</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Global Occupancy</span>
                  <span className="text-xl font-black text-foreground">{occupancy}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
                    style={{ width: `${occupancy}%` }} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <div className="p-3 md:p-4 rounded-xl bg-muted/20 border border-border">
                   <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Health</p>
                   <p className="text-xs md:text-sm font-bold text-foreground">Optimal</p>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-muted/20 border border-border">
                   <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Status</p>
                   <p className="text-xs md:text-sm font-bold text-foreground">Synced</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
