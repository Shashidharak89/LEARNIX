"use client";

import { Navbar } from "../components/Navbar";

import FileUploadDownload from "./WordToPdf";
import TextShareTool from "./TextShareTool";
import ToolsInfo from "./ToolsInfo";

export default function Tools() {
  return (
    <div>
      <Navbar />
      <FileUploadDownload />
      <TextShareTool />
      <ToolsInfo />
    </div>
  );
}
