import { Navbar } from "@/app/components/Navbar";
import Quiz from "../Quiz";
import '../styles/Quiz.module.css';

export const metadata = {
    title: 'QuizDeck | LEARNIX',
    description: 'Play the QuizDeck with a plain white background.',
};

export default function QuizDeckPage() {
    return (
        <main>
            <Navbar />
            <Quiz plainBg />
        </main>
    );
}
