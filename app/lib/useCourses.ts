"use client";

import { useEffect, useState } from "react";
import { courses as seed } from "../data/demo";
import { DEMO_MODE, fetchCourses, type UiCourse } from "./api";

export function useCourses() {
  const [courses, setCourses] = useState<UiCourse[]>(DEMO_MODE ? [...seed] : []);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (DEMO_MODE) return;
    let alive = true;
    fetchCourses().then(list => { if (alive) setCourses(list); })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [attempt]);
  const retry = () => { setError(false); setLoading(true); setAttempt(value => value + 1); };
  return { courses, loading, error, retry };
}
