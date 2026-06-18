"use client";

import { useEffect } from "react";
import { markNotificationsReadAction } from "@/app/actions";

export default function MarkRead() {
  useEffect(() => {
    markNotificationsReadAction();
  }, []);
  return null;
}
