"use client";

import { Navbar } from "../components/Navbar";

import FileUploadDownload from "./WordToPdf";
import TextShareTool from "./TextShareTool";

export default function Tools() {
  return (
    <div>
      <Navbar />
      <FileUploadDownload />
      <TextShareTool />
    </div>
  );
}
