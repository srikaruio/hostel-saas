"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Loader2, UserPlus, AlertTriangle } from "lucide-react";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Room = {
  id: string;
  room_number: string;
};

type Student = {
  id: string;
  name: string;
  phone: string;
  room_id: string;
  join_date: string;
  rooms: {
    room_number: string;
  } | null;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Form partial state (controlled parts)
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("*, rooms(room_number)")
      .eq("is_active", true)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("name");
    
    // Fetch rooms for dropdown (active only)
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("id, room_number")
      .eq("is_active", true)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("room_number");

    if (studentError) console.error("Error fetching students:", studentError.message);
    if (roomError) console.error("Error fetching rooms:", roomError.message);

    if (studentData) setStudents(studentData);
    if (roomData) setRooms(roomData);
    setLoading(false);
  }

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm) ||
    s.rooms?.room_number.includes(searchTerm)
  );

  const openAddModal = () => {
    setMode("add");
    setSelectedStudent(null);
    setSelectedRoomId("");
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setMode("edit");
    setSelectedStudent(student);
    setSelectedRoomId(student.room_id);
    setIsModalOpen(true);
  };

  const openDeleteModal = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRoomId) {
      alert("Please select a room assignment.");
      return;
    }

    setIsSyncing(true);
    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Session expired. Please login again.");
      return;
    }

    // Capacity Check Logic
    const isRoomChanging = mode === "add" || selectedRoomId !== selectedStudent?.room_id;
    
    if (isRoomChanging) {
      // 1. Get room capacity
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("total_beds, room_number")
        .eq("id", selectedRoomId)
        .single();
      
      if (roomError || !roomData) {
         alert("Invalid room selected. Please try again.");
         setIsSyncing(false);
         return;
      }

      // 2. Count active students in this room
      const { count, error: countError } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("room_id", selectedRoomId)
        .eq("is_active", true);

      if (countError) {
         console.error("Error checking capacity:", countError.message);
      } else if (count !== null && count >= roomData.total_beds) {
         alert(`Room ${roomData.room_number} is fully occupied (${roomData.total_beds}/${roomData.total_beds} beds used). Please select another room.`);
         setIsSyncing(false);
         return;
      }
    }

    const studentPayload = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      room_id: selectedRoomId,
      join_date: formData.get("joinDate") as string,
      is_active: true,
      user_id: user.id
    };

    if (mode === "add") {
      const { data, error } = await supabase
        .from("students")
        .insert([studentPayload])
        .select("*, rooms(room_number)");

      if (error) {
        console.error("Add failed:", error.message);
        alert("Could not register student. Check your connection.");
      } else if (data) {
        setStudents((prev) => [...prev, data[0]]);
        setIsModalOpen(false);
      }
    } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from("students")
          .update(studentPayload)
          .eq("id", selectedStudent!.id)
          .or(`user_id.eq.${user?.id},user_id.is.null`)
          .select("*, rooms(room_number)");

      if (error) {
        console.error("Update failed:", error.message);
        alert("Could not update student details.");
      } else if (data) {
        setStudents((prev) =>
          prev.map((s) => (s.id === selectedStudent!.id ? data[0] : s))
        );
        setIsModalOpen(false);
      }
    }
    setIsSyncing(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;

    setIsSyncing(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    const { data: rentRecords, error: rentError } = await supabase
      .from("rent_records")
      .select("status")
      .eq("student_id", selectedStudent.id)
      .eq("status", "pending")
      .or(`user_id.eq.${user?.id},user_id.is.null`);

    if (rentError) {
       console.error("Validation error:", rentError.message);
    } else if (rentRecords && rentRecords.length > 0) {
       alert(`Student "${selectedStudent.name}" has pending rent and cannot be archived.`);
       setIsSyncing(false);
       return;
    }

    // 2. Perform Soft Delete (Archive)
    const { error: archiveError } = await supabase
      .from("students")
      .update({ is_active: false }) // Soft delete logic
      .eq("id", selectedStudent.id)
      .or(`user_id.eq.${user?.id},user_id.is.null`);

    if (archiveError) {
      console.error("Archive failed:", archiveError.message);
      alert("Error archiving student record.");
    } else {
      // Remove from active UI state
      setStudents((prev) => prev.filter((s) => s.id !== selectedStudent.id));
      setIsDeleteModalOpen(false);
    }
    setIsSyncing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Student Directory</h2>
          <p className="text-sm text-muted-foreground">Manage student enrollments and room assignments.</p>
        </div>
        <Button onClick={openAddModal} className="gap-2 shadow-sm font-semibold h-10 px-5">
          <Plus className="h-4.5 w-4.5" />
          Add Student
        </Button>
      </div>

      <Card className="border-none shadow-premium overflow-hidden bg-white">
        <CardHeader className="pb-0 pt-6 px-6 relative border-b bg-muted/20 pb-4">
          <div className="flex items-center gap-4 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                className="pl-10 h-9 bg-background shadow-xs focus:ring-1 transition-all border-muted-foreground/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40 font-bold border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[200px] px-6 py-4 font-bold text-foreground uppercase tracking-wider text-[11px]">Name</TableHead>
                <TableHead className="w-[150px] font-bold text-foreground uppercase tracking-wider text-[11px]">Phone</TableHead>
                <TableHead className="w-[120px] font-bold text-foreground uppercase tracking-wider text-[11px]">Room</TableHead>
                <TableHead className="w-[150px] font-bold text-foreground uppercase tracking-wider text-[11px]">Join Date</TableHead>
                <TableHead className="text-right px-6 w-[120px] font-bold text-foreground uppercase tracking-wider text-[11px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                   <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground/60 animate-in fade-in zoom-in-95">
                         <Loader2 className="h-10 w-10 animate-spin text-primary" />
                         <span className="text-sm font-medium">Fetching directory...</span>
                      </div>
                   </TableCell>
                </TableRow>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="font-semibold px-6 py-4 whitespace-nowrap text-foreground">
                      {student.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground font-mono text-xs">
                      {student.phone}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-widest ring-1 ring-accent-foreground/10">
                        {student.rooms?.room_number || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-foreground/70 font-medium">
                      {new Date(student.join_date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right px-6 py-4 whitespace-nowrap opacity-100 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-end gap-1.5">
                        <Button 
                           variant="ghost" 
                           size="icon" 
                           onClick={() => openEditModal(student)}
                           className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                           variant="ghost" 
                           size="icon" 
                           onClick={() => openDeleteModal(student)}
                           className="h-8 w-8 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground/40">
                       <UserPlus className="h-16 w-16 opacity-10 mb-2" />
                       <p className="font-bold text-lg text-foreground/50">No students found.</p>
                       <p className="text-sm">Register a new student to populate the directory.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Persistence Modal (Add/Edit) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden flex flex-col shadow-premium border-none">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/10">
            <DialogTitle className="text-xl font-bold">
              {mode === "add" ? "Register New Student" : "Update Student Details"}
            </DialogTitle>
          </DialogHeader>
          <form 
            key={selectedStudent?.id || "new"} 
            onSubmit={handleSaveStudent} 
            className="flex flex-col flex-1"
          >
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/70 tracking-tight">Full Name</label>
                <Input 
                   id="name" 
                   name="name" 
                   defaultValue={selectedStudent?.name} 
                   placeholder="John Doe" 
                   className="h-11 bg-muted/20 focus:bg-background transition-all border-muted-foreground/20" 
                   required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/70 tracking-tight">Phone Number</label>
                <Input 
                   id="phone" 
                   name="phone" 
                   defaultValue={selectedStudent?.phone} 
                   placeholder="+91 0000000000" 
                   className="h-11 bg-muted/20 focus:bg-background transition-all border-muted-foreground/20" 
                   required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/70 tracking-tight">Assign Room</label>
                  <Select onValueChange={(val) => setSelectedRoomId(val || "")} value={selectedRoomId} required>
                    <SelectTrigger className="w-full h-11 bg-muted/20 border-muted-foreground/20">
                      <SelectValue placeholder="Select room">
                        {selectedRoomId 
                          ? `Room ${rooms.find(r => r.id === selectedRoomId)?.room_number}` 
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                         <SelectItem key={room.id} value={room.id}>
                            Room {room.room_number}
                         </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/70 tracking-tight">Join Date</label>
                  <Input 
                     id="joinDate" 
                     name="joinDate" 
                     type="date" 
                     defaultValue={selectedStudent?.join_date} 
                     className="h-11 bg-muted/20 focus:bg-background transition-all border-muted-foreground/20" 
                     required 
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="px-6 py-4 bg-muted/30 border-t flex items-center justify-end gap-3 mt-auto">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-11 px-6 font-semibold border-muted-foreground/20">Cancel</Button>
              <Button type="submit" disabled={isSyncing} className="h-11 px-10 font-bold shadow-md">
                {isSyncing ? (
                   <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                ) : (
                  mode === "add" ? "Enroll Student" : "Update Records"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none shadow-premium">
           <div className="p-6 pt-8 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 mb-4">
                 <AlertTriangle className="h-7 w-7 text-amber-600" />
              </div>
              <div className="space-y-1">
                 <h3 className="text-xl font-bold text-foreground">Archive Student Record?</h3>
                 <p className="text-sm text-muted-foreground px-4">
                    Moving <span className="text-foreground font-semibold">"{selectedStudent?.name}"</span> to archives will remove them from the active directory.
                 </p>
              </div>
           </div>
           <DialogFooter className="p-4 bg-muted/30 border-t flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="flex-1 h-11 font-semibold border-muted-foreground/20"
              >
                Keep Active
              </Button>
              <Button 
                onClick={handleDeleteConfirm} 
                disabled={isSyncing}
                className="flex-1 h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Archive Student"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
