import QPSubjectClient from "./QPSubjectClient";

export async function generateMetadata({ params }, parent) {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    return {
        title: `Question Papers | Learnix`,
        description: `View all question papers for subject`
    };
}

export default async function Page({ params }) {
    return <QPSubjectClient />;
}
