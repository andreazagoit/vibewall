"use client";

import dynamic from "next/dynamic";

const Vibewall = dynamic(() => import("@/components/Vibewall"), { ssr: false });

export default function Page() {
  return <Vibewall />;
}
