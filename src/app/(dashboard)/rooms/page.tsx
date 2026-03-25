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
    return rooms.filter((r) => r.room_number.toLowerCase().includes(searchTerm.toLowerCase()));
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Room Management</h2>
          <p className="text-sm text-muted-foreground">Modify room configurations and bed capacity.</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2 shadow-sm font-bold">
          <Plus className="h-4 w-4" />
          Add Room
        </Button>
      </div>

      <Card className="border-none shadow-premium overflow-hidden bg-white">
        <CardHeader className="pt-6 px-6 pb-4 border-b bg-muted/10">
          <div className="flex items-center gap-4 max-w-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Find room..."
                className="pl-9 h-9 bg-background shadow-xs focus:ring-1 border-muted-foreground/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted font-bold text-foreground">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6 py-4 font-bold text-[11px] uppercase tracking-widest">Details</TableHead>
                <TableHead className="py-4 font-bold text-[11px] uppercase tracking-widest">Capacity</TableHead>
                <TableHead className="py-4 font-bold text-[11px] uppercase tracking-widest">Occupancy</TableHead>
                <TableHead className="text-right px-6 font-bold text-[11px] uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-2" />
                    <span className="text-sm font-medium text-muted-foreground">Syncing rooms...</span>
                  </TableCell>
                </TableRow>
              ) : filteredRooms.length > 0 ? (
                filteredRooms.map((room) => (
                  <TableRow key={room.id} className="hover:bg-muted/30 transition-all duration-200">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                          <DoorOpen className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">Room {room.room_number}</span>
                          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">ID: {room.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-foreground">{room.occupancy} / {room.total_beds} filled</span>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          {room.total_beds - (room.occupancy || 0)} vacant beds
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {room.occupancy === 0 ? (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest border border-slate-200">
                          Empty
                        </span>
                      ) : room.occupancy! < room.total_beds ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest border border-emerald-200">
                          Available
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-widest border border-rose-200">
                          Full
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
                          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
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
