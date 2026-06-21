"use client";

import { useState } from "react";
import StudentsList from "./StudentsList";

// Below lg, the right rail collapses to a floating handle that opens the
// "students online" panel as a right slide-over. Nav itself stays in BottomNav.
export default function StudentsDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="See students online"
        className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full transition active:scale-90 lg:hidden"
        style={{ background: "var(--surface)", border: "1.5px solid var(--border)", boxShadow: "var(--shadow)" }}
      >
        <span className="text-xl">👥</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setOpen(false)}
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
        >
          <div
            className="absolute right-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto p-4 slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--surface)", borderLeft: "1.5px solid var(--border)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 font-bold">👥 Students online</h3>
              <button onClick={() => setOpen(false)} className="btn btn-ghost px-3 py-1 text-sm">
                Close
              </button>
            </div>
            <StudentsList />
          </div>
        </div>
      )}
    </>
  );
}
