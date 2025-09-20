// src/data/materialsData.js

const materialsData = [
  {
    semester: "1st Sem - MCA",
    subjects: [
      {
        subject: "Computer Organization",
        files: [
          { name: "Introduction Notes", url: "/files/comp-org-intro.pdf" },
          { name: "CPU Architecture", url: "/files/cpu-architecture.pdf" },
        ],
      },
      {
        subject: "Programming in C",
        files: [
          { name: "C Basics", url: "/files/c-basics.pdf" },
          {url: "/files/pointers.pdf" },
        ],
      },
    ],
  },
  {
    semester: "2nd Sem - MCA",
    subjects: [
      {
        subject: "Data Structures",
        files: [
          { name: "Stacks & Queues", url: "/files/stacks-queues.pdf" },
          { name: "Trees", url: "/files/trees.pdf" },
        ],
      },
    ],
  },
  {
    semester: "3rd Sem - MCA",
    subjects: [
      {
        subject: "Database Systems",
        files: [
          { name: "SQL Basics", url: "/files/sql-basics.pdf" },
          { name: "Normalization", url: "/files/normalization.pdf" },
        ],
      },
    ],
  },
];

export default materialsData;
