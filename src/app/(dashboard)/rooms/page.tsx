"use client";
// test redeploy
import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Loader2, DoorOpen, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Room = {
  id: string;
  room_number: string;
  total_beds: number;
  is_active: boolean;
  occupancy?: number;
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Fetch rooms
    const { data: roomsData, error: roomsError } = await supabase
      .from("rooms")
      .select("*")
      .eq("is_active", true)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("room_number");

    if (roomsError) {
      console.error("Error fetching rooms:", roomsError.message);
      setLoading(false);
      return;
    }

    // 2. Fetch occupancy counts (active students only)
    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("room_id")
      .eq("is_active", true)
      .or(`user_id.eq.${user.id},user_id.is.null`);

    if (studentsError) {
      console.error("Error fetching occupancy:", studentsError.message);
    }

    const occupancyMap: Record<string, number> = {};
    studentsData?.forEach(s => {
      if (s.room_id) {
        occupancyMap[s.room_id] = (occupancyMap[s.room_id] || 0) + 1;
      }
    });

    const roomsWithOccupancy = roomsData.map(r => ({
      ...r,
      occupancy: occupancyMap[r.id] || 0
    }));

    setRooms(roomsWithOccupancy);
    setLoading(false);
  }

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const search = searchTerm.toLowerCase();
      const occ = r.occupancy || 0;
      const statusText = occ === 0 ? "empty" : occ < r.total_beds ? "available" : "full";
      
      return (
        r.room_number.toLowerCase().includes(search) ||
        statusText.includes(search)
      );
    });
  }, [rooms, searchTerm]);

  const handleOpenAdd = () => {
    setMode("add");
    setSelectedRoom(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room: Room) => {
    setMode("edit");
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleOpenArchive = (room: Room) => {
    setSelectedRoom(room);
    setIsArchiveModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSyncing(true);
    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please login again.");
      return;
    }

    const payload = {
      room_number: formData.get("room_number") as string,
      total_beds: parseInt(formData.get("total_beds") as string),
      is_active: true,
      user_id: user.id
    };

    if (mode === "add") {
      const { data, error } = await supabase
        .from("rooms")
        .insert([payload])
        .select();

      if (error) {
        console.error("Add failed:", error.message);
        alert("Failed to create room.");
      } else if (data) {
        fetchRooms();
        setIsModalOpen(false);
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("rooms")
        .update(payload)
        .eq("id", selectedRoom!.id)
        .or(`user_id.eq.${user?.id},user_id.is.null`)
        .select();

      if (error) {
        console.error("Update failed:", error.message);
        alert("Failed to update room.");
      } else if (data) {
        fetchRooms();
        setIsModalOpen(false);
      }
    }
    setIsSyncing(false);
  };

  const confirmArchive = async () => {
    if (!selectedRoom) return;
    setIsSyncing(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { count, error: countError } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("room_id", selectedRoom.id)
      .eq("is_active", true)
      .or(`user_id.eq.${user?.id},user_id.is.null`);

    if (countError) {
      console.error("Validation failed:", countError.message);
    } else if (count && count > 0) {
      alert("Room has active students assigned and cannot be archived.");
      setIsSyncing(false);
      return;
    }

    // Perform soft delete
    const { error: archiveError } = await supabase
      .from("rooms")
      .update({ is_active: false })
      .eq("id", selectedRoom.id)
      .or(`user_id.eq.${user?.id},user_id.is.null`);

    if (archiveError) {
      console.error("Archive failed:", archiveError.message);
      alert("Error archiving room.");
    } else {
      fetchRooms();
      setIsArchiveModalOpen(false);
    }
    setIsSyncing(false);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:items-center sm:flex-row justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Room Management</h2>
          <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">Capacity & Utility Intelligence</p>
        </div>
        <Button onClick={handleOpenAdd} className="w-full sm:w-auto gap-2 shadow-none font-bold h-9 px-4 text-xs bg-foreground text-background hover:bg-foreground/90 transition-all rounded-lg">
          <Plus className="h-3.5 w-3.5" />
          Add Room
        </Button>
      </div>

      <Card className="bg-card border border-border shadow-none overflow-hidden hover:border-primary/20 transition-colors">
        <CardHeader className="py-2.5 px-4 md:py-3 md:px-6 relative border-b border-border bg-muted/5">
          <div className="flex items-center gap-4 max-w-xs w-full">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Find inventory..."
                className="pl-9 h-9 bg-muted/20 border-border shadow-none focus:ring-1 focus:ring-primary/20 rounded-lg text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px] lg:min-w-full">
            <TableHeader className="bg-muted/10 font-bold border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6 py-3 font-bold text-[10px] text-foreground uppercase tracking-widest">General Information</TableHead>
                <TableHead className="py-3 font-bold text-[10px] text-foreground uppercase tracking-widest">Resource Allocation</TableHead>
                <TableHead className="py-3 font-bold text-[10px] text-foreground uppercase tracking-widest">Inventory Status</TableHead>
                <TableHead className="text-right px-6 font-bold text-[10px] text-foreground uppercase tracking-widest">Action Center</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center border-border">
                    <Loader2 className="h-10 w-10 animate-spin text-neutral-700 mx-auto mb-3" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Syncing inventory...</span>
                  </TableCell>
                </TableRow>
              ) : filteredRooms.length > 0 ? (
                filteredRooms.map((room) => (
                  <TableRow key={room.id} className="hover:bg-muted/5 border-border transition-all duration-200 group">
                    <TableCell className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-muted rounded-lg flex items-center justify-center text-foreground border border-border">
                          <DoorOpen className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">Unit {room.room_number}</span>
                          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter opacity-70">UID: {room.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-foreground">{room.occupancy} / {room.total_beds} filled</span>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                          {room.total_beds - (room.occupancy || 0)} available
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {room.occupancy === 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[9px] font-black uppercase tracking-tight border border-border">
                          Idle
                        </span>
                      ) : room.occupancy! < room.total_beds ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-tight border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase tracking-tight border border-rose-500/20">
                          Maximum
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(room)}
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenArchive(room)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center text-muted-foreground">
                    <DoorOpen className="h-16 w-16 opacity-10 mx-auto mb-4" />
                    <p className="font-bold text-foreground/50">No rooms configured.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden shadow-premium border-none">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/10">
            <DialogTitle className="text-xl font-bold">
              {mode === "add" ? "Configure New Room" : "Update Room Specs"}
            </DialogTitle>
          </DialogHeader>
          <form key={selectedRoom?.id || "new-room"} onSubmit={handleSaveRoom}>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Room Label</label>
                <Input
                  name="room_number"
                  defaultValue={selectedRoom?.room_number}
                  placeholder="e.g. 101, 202-A"
                  className="h-12 bg-muted/20 border-muted-foreground/20 text-lg font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Bed Capacity</label>
                <Input
                  name="total_beds"
                  type="number"
                  defaultValue={selectedRoom?.total_beds}
                  placeholder="Number of beds"
                  className="h-12 bg-muted/20 border-muted-foreground/20 text-lg font-bold"
                  required
                  min="1"
                />
              </div>
            </div>
            <DialogFooter className="p-4 bg-muted/30 border-t flex gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-11 font-bold">Abort</Button>
              <Button type="submit" disabled={isSyncing} className="flex-1 h-11 font-black shadow-lg">
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === "add" ? "Initialize" : "Save Changes")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive Modal */}
      <Dialog open={isArchiveModalOpen} onOpenChange={setIsArchiveModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-premium">
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 ring-4 ring-amber-50">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground tracking-tighter">Decommission Room?</h3>
              <p className="text-sm text-muted-foreground px-4 font-medium leading-relaxed">
                Moving <span className="font-bold text-foreground">Room {selectedRoom?.room_number}</span> to archive will remove it from the selection pool.
              </p>
            </div>
          </div>
          <DialogFooter className="p-4 bg-muted/30 border-t flex gap-3">
            <Button variant="outline" onClick={() => setIsArchiveModalOpen(false)} className="flex-1 h-11 font-bold">Cancel</Button>
            <Button
              onClick={confirmArchive}
              disabled={isSyncing}
              className="flex-1 h-11 bg-amber-600 hover:bg-amber-700 text-white font-black"
            >
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
