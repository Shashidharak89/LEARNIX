import { FileIcon, FileTextIcon, LinkIcon } from "@animateicons/react/lucide";

export const kinds = {
  text: { label: "Note", action: "Write a note", filter: "Notes", icon: FileTextIcon },
  link: { label: "Link", action: "Save a link", filter: "Links", icon: LinkIcon },
  file: { label: "File", action: "Upload a file", filter: "Files", icon: FileIcon },
};
