import { Navbar } from "../components/Navbar";
import KeepClient from "./KeepClient";

export const metadata = {
  title: "Keep | Learnix",
  description: "Save your notes, links, and files in your private Learnix Keep.",
};

export default function KeepPage() {
  return <><Navbar /><KeepClient /></>;
}
