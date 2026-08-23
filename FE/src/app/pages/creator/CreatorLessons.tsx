import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { ChevronDown, ChevronUp, Link2, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { creatorCourses, creatorLessons } from "../../../features/creator/data/creator.mock";

export function CreatorLessons() {
  const { courseId } = useParams();
  const course = creatorCourses.find((item) => item.id === courseId) ?? creatorCourses[0];
  const initialLessons = useMemo(() => creatorLessons.filter((lesson) => lesson.courseId === course.id), [course.id]);
  const [lessons, setLessons] = useState(initialLessons);
  const { t } = useLanguage();

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
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-warm-accent)]">{t("creator.lessons.title")}</p>
        <h1 className="text-3xl font-bold text-[var(--color-warm-text)]">{course.name}</h1>
        <p className="text-muted-foreground">{t("creator.lessons.subtitle")}</p>
      </div>

      <div className="rounded-3xl border border-[var(--color-warm-border)] bg-card p-4 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("creator.lessons.tableHeaders.order")}</TableHead>
              <TableHead>{t("creator.lessons.tableHeaders.lessonName")}</TableHead>
              <TableHead>{t("creator.lessons.tableHeaders.duration")}</TableHead>
              <TableHead>{t("creator.lessons.tableHeaders.linkedProducts")}</TableHead>
              <TableHead>{t("creator.lessons.tableHeaders.views")}</TableHead>
              <TableHead className="text-right">{t("creator.lessons.tableHeaders.actions")}</TableHead>
            </TableRow>
          </TableHeader>
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
                <TableCell className="font-semibold text-[var(--color-warm-text)]">{lesson.name}</TableCell>
                <TableCell>{lesson.duration}</TableCell>
                <TableCell>{lesson.linkedProducts}</TableCell>
                <TableCell>{lesson.views.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" />{t("creator.lessons.editContent")}</Button>
                    <Button variant="ghost" size="sm"><Link2 className="h-4 w-4" />{t("creator.lessons.linkProducts")}</Button>
                    <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" />{t("creator.lessons.delete")}</Button>
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
