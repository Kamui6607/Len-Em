import { Routes, Route } from "react-router";
import { CreatorLayout } from "../../components/creator/CreatorLayout";
import { CreatorOverview } from "./CreatorOverview";
import { CreatorCourses } from "./CreatorCourses";
import { CreatorLessons } from "./CreatorLessons";
import { CreatorProducts } from "./CreatorProducts";
import { CreatorDIY } from "./CreatorDIY";

export function CreatorPage() {
  return (
    <CreatorLayout>
      <Routes>
        <Route index element={<CreatorOverview />} />
        <Route path="courses" element={<CreatorCourses />} />
        <Route path="lessons/:courseId" element={<CreatorLessons />} />
        <Route path="products" element={<CreatorProducts />} />
        <Route path="diy" element={<CreatorDIY />} />
        <Route path="settings" element={<CreatorOverview />} />
      </Routes>
    </CreatorLayout>
  );
}
