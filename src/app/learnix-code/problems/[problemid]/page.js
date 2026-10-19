import LeetCodeIDE from "@/app/test/LeetCodeIDE";

export async function generateMetadata({ params }) {
  const { problemid } = await params;
  const title = (problemid || "Problem")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${title} | Learnix Code`,
    description: `Solve and test the ${title} problem in the Learnix in-browser code editor.`,
  };
}

export default async function ProblemPage({ params }) {
  const { problemid } = await params;

  return (
    <LeetCodeIDE
      initialProblemId={problemid}
      baseUrl="/learnix-code/problems"
    />
  );
}
