import { Navbar } from "../components/Navbar";
import QuestionPapers from "./QuestionPapers";

export const metadata = {
    title: "Question Papers | Learnix",
    description:
        "Access previous year question papers organized by semester and subject. Prepare effectively with exam patterns and past papers.",
    keywords: [
        "question papers",
        "previous year papers",
        "exam papers",
        "MCA",
        "university exams",
        "study resources",
    ],
};

export default function QuestionPapersPage() {
    return (
        <div>
            <Navbar/>
            <QuestionPapers />
        </div>
    );
}
