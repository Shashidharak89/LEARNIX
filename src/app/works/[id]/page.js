import WorkTopicClient from "./WorkTopicClient";

export async function generateMetadata({ params }, parent) {
  // In Next.js 15+, params is a Promise
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://learnix.dev';
    const res = await fetch(`${baseUrl}/api/work/getbytopicid/${id}`, { next: { revalidate: 60 } });
    
    if (res.ok) {
      const data = await res.json();
      const topicTitle = data?.topic?.topic || "Work Topic";
      const subjectTitle = data?.subject?.subject || "Learnix";
      const description = data?.topic?.content?.substring(0, 150) || `Check out "${topicTitle}" uploaded by ${data?.user?.name || "a user"} on Learnix.`;
      const imageUrl = (data?.topic?.images && data.topic.images.length > 0) ? data.topic.images[0] : `${baseUrl}/favicon.ico`;
      
      return {
        title: `${topicTitle} - ${subjectTitle} | Learnix`,
        description: description,
        openGraph: {
          title: `${topicTitle} - ${subjectTitle} | Learnix`,
          description: description,
          images: [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: topicTitle,
            },
          ],
        },
      };
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  return {
    title: "Work Topic | Learnix",
    description: "Check out this work topic on Learnix",
  };
}

export default async function Page({ params }) {
  // In Next.js 15+, wait for params if needed, but since we are just passing it or not even using it
  // in WorkTopicClient (it uses useParams internally), we can just render the client component.
  return <WorkTopicClient />;
}
