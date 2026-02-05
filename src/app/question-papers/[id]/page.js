"use client";

import { useParams } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import Footer from "../../components/Footer";
import QuestionPaperDetail from "./QuestionPaperDetail";
import questionPapersData from "../questionPapersData";

// Helper function to find question paper by ID
const findQuestionPaperById = (id) => {
  for (const semester of questionPapersData) {
    for (const batch of semester.batches) {
      if (batch.mse1 && batch.mse1.id === id) {
        return {
          examType: 'MSE 1',
          semester: semester.semister,
          batch: batch.batchname,
          data: batch.mse1
        };
      }
      if (batch.mse2 && batch.mse2.id === id) {
        return {
          examType: 'MSE 2',
          semester: semester.semister,
          batch: batch.batchname,
          data: batch.mse2
        };
      }
      if (batch.final && batch.final.id === id) {
        return {
          examType: 'Final Exam',
          semester: semester.semister,
          batch: batch.batchname,
          data: batch.final
        };
      }
    }
  }
  return null;
};

export default function QuestionPaperPage() {
  const params = useParams();
  const id = params?.id;

  const paperInfo = findQuestionPaperById(id);

  return (
    <div>
      <Navbar />
      <QuestionPaperDetail 
        id={id}
        paperInfo={paperInfo}
      />
    </div>
  );
}
