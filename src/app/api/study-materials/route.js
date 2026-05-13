import { NextResponse } from "next/server";
import materialsData from "@/app/materials/materialsData";

function displayName(file) {
  const explicit = file.name != null ? String(file.name).trim() : "";
  if (explicit) return explicit;
  const raw = file.url.split("/").pop().split("?")[0] || "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function withDecodedFileNames(data) {
  return data.map((semester) => ({
    ...semester,
    subjects: semester.subjects.map((subject) => ({
      ...subject,
      files: subject.files.map((file) => ({
        url: file.url,
        name: displayName(file),
      })),
    })),
  }));
}

export async function GET() {
  const body = withDecodedFileNames(materialsData);
  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
