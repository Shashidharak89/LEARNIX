"use client";
import TopicEditPage from "./TopicEditPage";
import { Navbar } from "@/app/components/Navbar";

export default function Page({ params }) {
  return (
    <>
      <Navbar />
      <TopicEditPage params={params} />
    </>
  );
}
