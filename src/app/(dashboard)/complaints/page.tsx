"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Loader2, Inbox, Clock } from "lucide-react";

type Complaint = {
  id: string;
  student: string;
  issue: string;
  status: string;
  priority: string;
  date: string;
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  async function fetchComplaints() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setLoading(false);
        return;
    }

    const { data, error } = await supabase
      .from("complaints")
      .select("*, students(name)")
      .or(`user_id.eq.${user.id},user_id.is.null`);

    if (error) {
      console.error("Error fetching complaints:", error.message);
    } else if (data) {
      const formatted = data.map(c => ({
          ...c,
          student: c.students?.name || "Deleted Student",
          date: new Date(c.created_at).toLocaleDateString()
      }));
      setComplaints(formatted);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <h2 className="text-2xl font-bold mb-6 flex justify-between">Complaints Center</h2>
      <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted font-bold text-foreground">
              <TableRow>
                <TableHead className="px-6 font-bold text-foreground">Student</TableHead>
                <TableHead className="font-bold text-foreground">Issue</TableHead>
                <TableHead className="font-bold text-foreground">Priority</TableHead>
                <TableHead className="font-bold text-foreground">Status</TableHead>
                <TableHead className="text-right px-6 font-bold text-foreground">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Fetching complaints...</p>
                  </TableCell>
                </TableRow>
              ) : complaints.length > 0 ? (
                complaints.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="px-6 py-4 font-medium">{c.student}</TableCell>
                    <TableCell>{c.issue}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${c.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                        {c.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${c.status === 'Open' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right px-6 text-muted-foreground text-xs">{c.date}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                      <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center">
                        <Inbox className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                      <p className="font-bold text-muted-foreground">No complaints submitted yet.</p>
                      <p className="text-sm text-muted-foreground/50">When students report issues, they will appear here for management.</p>
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
