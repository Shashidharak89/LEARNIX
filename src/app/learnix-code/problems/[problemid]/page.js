import LeetCodeIDE from "@/app/test/LeetCodeIDE";

export async function generateMetadata({ params }) {
  const { problemid } = await params;
  const isNumber = !isNaN(parseInt(problemid, 10));
  const title = isNumber
    ? `Problem #${problemid}`
    : (problemid || "Problem")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

  return {
    title: `${title} | Learnix Code`,
    description: `Solve and test ${title} in the Learnix in-browser code editor.`,
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
