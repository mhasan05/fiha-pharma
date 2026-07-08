"use client";

import dynamic from "next/dynamic";

// Render client-side only. UserContent pulls in jsPDF/autotable and other
// browser-only deps, so prerendering it on the server breaks `next build`.
const UserContent = dynamic(() => import("@/components/user/user-content"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
    </div>
  ),
});

export default function User() {
  return <UserContent />;
}
