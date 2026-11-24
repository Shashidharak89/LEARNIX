import { redirect } from "next/navigation";
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
    const resolvedParams = await params;
    if (resolvedParams?.id) {
        redirect(`/qp/subject/${resolvedParams.id}`);
    }
    return <QPSubjectClient />;
}

