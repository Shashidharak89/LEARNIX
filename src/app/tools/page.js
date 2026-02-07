"use client";

import { Navbar } from "../components/Navbar";

import FileUploadDownload from "./WordToPdf";
import TextShareTool from "./TextShareTool";
import FileUploadInfo from "./FileUploadInfo";

export default function Tools() {
  return (
    <div>
      <Navbar />
      <FileUploadDownload />
      <TextShareTool />
      <FileUploadInfo/>
    </div>
  );
}
