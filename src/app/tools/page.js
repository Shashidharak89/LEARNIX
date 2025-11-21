"use client";

import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
import FileUploadDownload from "./WordToPdf";

export default function Tools() {
  return (
    <div>
      <Navbar />
      <FileUploadDownload />
      <Footer />
    </div>
  );
}
