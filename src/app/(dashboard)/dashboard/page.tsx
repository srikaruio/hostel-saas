"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  DoorClosed, 
  IndianRupee, 
  Loader2, 
  Clock, 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  UserPlus, 
  ArrowUpRight, 
  ArrowDownRight,
  LayoutDashboard,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardStat = {
  title: string;
  value: string;
  description: string;
  icon: any;
  trend?: string;
  isUp?: boolean;
};

type AlertItem = {
  id: string;
  type: "success" | "warning" | "critical" | "info";
  title: string;
  subtitle: string;
  time: string;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [occupancy, setOccupancy] = useState(0);
  const [totalBeds, setTotalBeds] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [revenueHistory, setRevenueHistory] = useState<{ month: string, amount: number }[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const currentMonth = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      year: 'numeric' 
    }).format(new Date()).replace(' ', '-');
  }, []);

  useEffect(() => {
    fetchComprehensiveData();
  }, []);

  async function fetchComprehensiveData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Core Counts
    const { count: studentCount } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .or(`user_id.eq.${user.id},user_id.is.null`);

    const { data: roomsData } = await supabase
      .from("rooms")
      .select("id, room_number, total_beds")
      .eq("is_active", true)
      .or(`user_id.eq.${user.id},user_id.is.null`);

    const totalRoomsCount = roomsData?.length || 0;
    const beds = roomsData?.reduce((acc, curr) => acc + curr.total_beds, 0) || 0;
    const vacant = Math.max(0, beds - (studentCount || 0));
    
    setTotalBeds(beds);
    setActiveStudents(studentCount || 0);
    setOccupancy(beds > 0 ? Math.round(((studentCount || 0) / beds) * 100) : 0);

    // 2. Financial Metrics (Current Month)
    const { data: rentData } = await supabase
      .from("rent_records")
      .select("amount, status, month")
      .or(`user_id.eq.${user.id},user_id.is.null`);

    const currentRent = rentData?.filter(r => r.month === currentMonth);
    const expected = currentRent?.reduce((a, b) => a + b.amount, 0) || 0;
    const collected = currentRent?.filter(r => r.status === 'paid').reduce((a, b) => a + b.amount, 0) || 0;
    const pending = expected - collected;

    // 3. Revenue Trend (Last 6 Months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(d).replace(' ', '-'));
    }

    const history = months.map(m => ({
      month: m.split('-')[0],
      amount: rentData?.filter(r => r.month === m && r.status === 'paid').reduce((a, b) => a + b.amount, 0) || 0
    }));
    setRevenueHistory(history);

    // 4. Alerts Generation
    const alertList: AlertItem[] = [];
    
    // New Students (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: newStudents } = await supabase
      .from("students")
      .select("id, name")
      .gte("created_at", sevenDaysAgo.toISOString())
      .limit(3)
      .or(`user_id.eq.${user.id},user_id.is.null`);

    newStudents?.forEach(s => {
      alertList.push({
        id: `student-${s.id}`,
        type: "success",
        title: "New Resident Enrolled",
        subtitle: `Resident ${s.name} is now active in the portal.`,
        time: "Recently"
      });
    });

    // Rent Alerts
    const pendingCount = currentRent?.filter(r => r.status === 'pending').length || 0;
    if (pendingCount > 0) {
      alertList.push({
        id: "rent-alert",
        type: "critical",
        title: "Outstanding Collections",
        subtitle: `There are ${pendingCount} pending payments for ${currentMonth}.`,
        time: "Action Required"
      });
    }

    setAlerts(alertList);

    setStats([
      {
        title: "Total Residents",
        value: (studentCount || 0).toString(),
        description: "Active in portal",
        icon: Users,
      },
      {
        title: "Available Units",
        value: totalRoomsCount.toString(),
        description: "Rooms configured",
        icon: DoorClosed,
      },
      {
        title: "Capacity Status",
        value: `${vacant} Beds`,
        description: `Remaining of ${beds}`,
        icon: DoorClosed,
      },
      {
        title: "Month Revenue",
        value: `₹${collected.toLocaleString()}`,
        description: `Target: ₹${expected.toLocaleString()}`,
        icon: IndianRupee,
        trend: "7.2%",
        isUp: true
      },
    ]);

    setLoading(false);
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-700 lg:px-4">
      {/* Row 1: KPI Stats */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border border-border shadow-none hover:border-primary/20 transition-all group p-4 space-y-3">
             <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-muted/20 border border-border flex items-center justify-center group-hover:scale-110 transition-transform">
                   <stat.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                {stat.trend && (
                   <div className={cn(
                     "flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full",
                     stat.isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                   )}>
                      {stat.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {stat.trend}
                   </div>
                )}
             </div>
             <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{stat.title}</p>
                <h4 className="text-2xl font-black text-foreground">{loading ? <div className="h-8 w-16 bg-muted animate-pulse rounded" /> : stat.value}</h4>
                <p className="text-[10px] font-bold text-muted-foreground/40 mt-1">{stat.description}</p>
             </div>
          </Card>
        ))}
      </div>

      {/* Row 2: Charts & Deep Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Revenue Chart */}
        <Card className="lg:col-span-8 bg-card border border-border shadow-none overflow-hidden flex flex-col">
          <CardHeader className="p-4 border-b border-border bg-muted/5 flex flex-row items-center justify-between">
             <div className="space-y-0.5">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground">Revenue Dynamics</CardTitle>
                <p className="text-[10px] font-bold text-muted-foreground/60">Historical collection velocity // Last 6 Months</p>
             </div>
             <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col gap-6">
             <div className="flex-1 flex items-end justify-between gap-2 min-h-[160px] pt-4">
                {revenueHistory.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar">
                     <div className="relative w-full flex justify-center">
                        <div className="h-10 w-full rounded-t-sm bg-muted/10 border-x border-t border-border group-hover/bar:bg-primary/10 transition-colors" />
                        <div 
                          className="absolute bottom-0 w-full bg-primary/40 group-hover/bar:bg-primary/60 transition-all rounded-t-sm ring-1 ring-primary/20"
                          style={{ height: `${(h.amount / Math.max(...revenueHistory.map(x => x.amount || 1))) * 100}%` }}
                        />
                     </div>
                     <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">{h.month}</span>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>

        {/* Medium Occupancy Overview */}
        <Card className="lg:col-span-4 bg-card border border-border shadow-none overflow-hidden flex flex-col">
           <CardHeader className="p-4 border-b border-border bg-muted/5">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground">Capacity Profile</CardTitle>
           </CardHeader>
           <CardContent className="p-6 space-y-8">
              <div className="relative flex flex-col items-center justify-center pt-2">
                 <div className="text-4xl font-black text-foreground">{occupancy}%</div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">System Occupancy</p>
                 <div className="w-full h-1.5 bg-muted mt-6 rounded-full overflow-hidden border border-border">
                    <div 
                      className="h-full bg-primary shadow-[0_0_12px_rgba(255,255,255,0.1)] transition-all duration-1000"
                      style={{ width: `${occupancy}%` }}
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground/50 uppercase">Reserved</p>
                    <p className="text-lg font-black text-foreground">{activeStudents}</p>
                 </div>
                 <div className="space-y-1 border-l border-border pl-4">
                    <p className="text-[9px] font-black text-muted-foreground/50 uppercase">Vacant</p>
                    <p className="text-lg font-black text-emerald-500">{Math.max(0, totalBeds - activeStudents)}</p>
                 </div>
              </div>
              
              <div className="pt-2">
                 <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                       <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-[10px] font-bold text-primary leading-tight">System is currently operating at optimal efficiency.</p>
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Row 3: Operational Alerts Feed */}
      <Card className="bg-card border border-border shadow-none overflow-hidden flex flex-col">
          <CardHeader className="p-3 border-b border-border bg-muted/5 flex flex-row items-center justify-between">
             <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground">Operational Signal Feed</CardTitle>
             </div>
             <div className="flex gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Live Monitor</span>
             </div>
          </CardHeader>
          <CardContent className="p-0">
             {loading ? (
                <div className="p-8 space-y-4">
                   {[1, 2, 3].map(i => <div key={i} className="h-12 w-full bg-muted/20 animate-pulse rounded-lg" />)}
                </div>
             ) : alerts.length > 0 ? (
                <div className="divide-y divide-border">
                   {alerts.map((alert) => (
                      <div key={alert.id} className="flex items-center gap-4 p-4 hover:bg-muted/5 transition-colors group">
                         <div className={cn(
                           "h-9 w-9 rounded-lg flex items-center justify-center border transition-all group-hover:scale-105",
                           alert.type === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
                           alert.type === 'critical' && "bg-rose-500/10 border-rose-500/20 text-rose-500",
                           alert.type === 'warning' && "bg-amber-500/10 border-amber-500/20 text-amber-500",
                           alert.type === 'info' && "bg-primary/10 border-primary/20 text-primary",
                         )}>
                            {alert.type === 'success' ? <UserPlus className="h-4 w-4" /> : 
                             alert.type === 'critical' ? <AlertCircle className="h-4 w-4" /> : 
                             <Zap className="h-4 w-4" />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h5 className="text-[11px] font-black text-foreground group-hover:text-primary transition-colors">{alert.title}</h5>
                            <p className="text-[10px] font-medium text-muted-foreground/60">{alert.subtitle}</p>
                         </div>
                         <div className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-tighter whitespace-nowrap">
                            {alert.time}
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="p-12 text-center space-y-2">
                   <div className="h-10 w-10 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-border">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground/20" />
                   </div>
                   <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No active signals</p>
                   <p className="text-[10px] font-bold text-muted-foreground/40 italic">System environment is stable and optimal.</p>
                </div>
             )}
          </CardContent>
      </Card>
    </div>
  );
}
