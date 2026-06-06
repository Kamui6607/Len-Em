import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { ChevronDown, ChevronUp, Link2, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { creatorCourses, creatorLessons } from "../../../features/creator/data/creator.mock";

export function CreatorLessons() {
  const { courseId } = useParams();
  const course = creatorCourses.find((item) => item.id === courseId) ?? creatorCourses[0];
  const initialLessons = useMemo(() => creatorLessons.filter((lesson) => lesson.courseId === course.id), [course.id]);
  const [lessons, setLessons] = useState(initialLessons);

  const moveLesson = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= lessons.length) return;
    const copy = [...lessons];
    [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
    setLessons(copy);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b7664e]">Lesson Management</p>
        <h1 className="text-3xl font-bold text-[#3f342c]">{course.name}</h1>
        <p className="text-muted-foreground">Reorder lessons with arrows, edit content, and link shop products directly inside videos.</p>
      </div>

      <div className="rounded-3xl border border-[#eadcc7] bg-card p-4 shadow-sm">
        <Table>
          <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Lesson name</TableHead><TableHead>Duration</TableHead><TableHead>Linked products</TableHead><TableHead>Views</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {lessons.map((lesson, index) => (
              <TableRow key={lesson.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="mr-2 font-semibold">{index + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => moveLesson(index, -1)} disabled={index === 0}><ChevronUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => moveLesson(index, 1)} disabled={index === lessons.length - 1}><ChevronDown className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-[#3f342c]">{lesson.name}</TableCell>
                <TableCell>{lesson.duration}</TableCell>
                <TableCell>{lesson.linkedProducts}</TableCell>
                <TableCell>{lesson.views.toLocaleString()}</TableCell>
                <TableCell><div className="flex justify-end gap-2"><Button variant="ghost" size="sm"><Pencil className="h-4 w-4" />Edit content</Button><Button variant="ghost" size="sm"><Link2 className="h-4 w-4" />Link products</Button><Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" />Delete</Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
