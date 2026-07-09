import { useState } from "react";
import { Link } from "react-router";
import { CreditCard as Edit, Eye, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { creatorCourses } from "../../../features/creator/data/creator.mock";

export function CreatorCourses() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-warm-text)]">Course Management</h1>
          <p className="text-muted-foreground">Build skill paths and publish lessons with linked material combos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-[var(--color-warm-accent)] hover:bg-[var(--color-warm-accent-hover)]"><Plus className="mr-2 h-4 w-4" />Create new course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create new course</DialogTitle>
              <DialogDescription>Mock form for a new Len&amp;Em tutorial course.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2"><Label htmlFor="course-name">Course name</Label><Input id="course-name" placeholder="Cozy flower bouquet" /></div>
              <div className="grid gap-2"><Label htmlFor="course-level">Level</Label><Input id="course-level" placeholder="Beginner / Intermediate / Advanced" /></div>
            </div>
            <DialogFooter><Button onClick={() => setOpen(false)} className="bg-[var(--color-warm-accent)] hover:bg-[var(--color-warm-accent-hover)]">Save draft</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-3xl border border-[var(--color-warm-border)] bg-card p-4 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course name</TableHead><TableHead>Level</TableHead><TableHead>Lessons</TableHead><TableHead>Students</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creatorCourses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-semibold text-[var(--color-warm-text)]"><Link className="hover:text-[var(--color-warm-accent)]" to={`/creator/lessons/${course.id}`}>{course.name}</Link></TableCell>
                <TableCell>{course.level}</TableCell>
                <TableCell>{course.lessonCount}</TableCell>
                <TableCell>{course.enrolledStudents.toLocaleString()}</TableCell>
                <TableCell><span className={`rounded-full px-3 py-1 text-xs font-semibold ${course.status === "Published" ? "bg-[var(--color-success)]/15 text-[var(--color-success)]" : "bg-[var(--color-warm-surface)] text-[var(--color-warm-text-secondary)]"}`}>{course.status}</span></TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm"><Edit className="h-4 w-4" />Edit</Button>
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" />Preview</Button>
                    <Button variant="ghost" size="sm"><Upload className="h-4 w-4" />{course.status === "Published" ? "Unpublish" : "Publish"}</Button>
                    <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" />Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
