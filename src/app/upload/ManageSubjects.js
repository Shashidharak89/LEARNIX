"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "@/context/ThemeContext";
import { 
  FiPlus, 
  FiBook, 
  FiFolder
} from "react-icons/fi";
import AddSubjectForm from "./AddSubjectForm";
import SubjectsGrid from "./SubjectsGrid";
import MessageDisplay from "./MessageDisplay";
import "./styles/ManageSubjects.css";
import LoginRequired from "../components/LoginRequired";
import ManageSubjectsSkeleton from './ManageSubjectsSkeleton';

export default function ManageSubjects() {
  const [usn, setUsn] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  const { theme } = useTheme();

  useEffect(() => {
    const storedUsn = localStorage.getItem("usn");
    if (storedUsn) setUsn(storedUsn);
    fetchSubjects(storedUsn);
    fetchAllUsers();
  }, []);

  const showMessage = (text, type = "", duration = 3000) => {
    setMessage(text);
    setTimeout(() => setMessage(""), duration);
  };

  const fetchSubjects = async (usn) => {
    setIsLoading(true);
    try {
      const res = await axios.get("/api/work/get", { params: { usn } });
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error(err);
      showMessage("Failed to fetch subjects", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get("/api/work/getall");
      setAllUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch all users data:", err);
    }
  };

  const handleSubjectDelete = (updatedSubjects) => {
    setSubjects(updatedSubjects);
    showMessage("Subject deleted successfully!", "success");
  };

  const handleTopicDelete = (updatedSubjects) => {
    setSubjects(updatedSubjects);
    showMessage("Topic deleted successfully!", "success");
  };

  // Add Subject with public option
  const handleAddSubject = async (subjectName, isPublic) => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/subject", { 
        usn, 
        subject: subjectName,
        public: isPublic
      });
      setSubjects(res.data.subjects);
      showMessage("Subject added successfully!", "success");
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.error || "Error adding subject", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTopic = async (subject, topicName, isPublic) => {
    if (!subject || !topicName.trim()) return;
    setIsLoading(true);
    try {
      const res = await axios.post("/api/topic", {
        usn,
        subject,
        topic: topicName,
        images: [],
        public: isPublic
      });
      setSubjects(res.data.subjects);
      showMessage("Topic added successfully!", "success");
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.error || "Error adding topic", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubjects = () => {
    fetchSubjects(usn);
  };

  const usnl = typeof window !== "undefined" ? localStorage.getItem("usn") : null;
  if (!usnl) {
    return <LoginRequired />;
  }

  if (isLoading && subjects.length === 0) {
    return <ManageSubjectsSkeleton />;
  }

  return (
    <div className={`mse-container ${theme}`}>
      <MessageDisplay message={message} />

      {/* Add Subject Section */}
      <div className="mse-section">
        <div className="mse-section-header">
          <FiPlus className="mse-section-icon" />
          <h2>Add New Subject</h2>
        </div>
        <AddSubjectForm
          allUsers={allUsers}
          isLoading={isLoading}
          onAddSubject={handleAddSubject}
        />
      </div>

      {/* Subjects List */}
      <div className="mse-section">
        <div className="mse-section-header">
          <FiFolder className="mse-section-icon" />
          <h2>Subjects & Topics</h2>
        </div>

        {isLoading && subjects.length === 0 && (
          <div className="mse-loading">
            <div className="mse-spinner"></div>
            <span>Loading...</span>
          </div>
        )}

        {subjects.length === 0 && !isLoading && (
          <div className="mse-empty-state">
            <p>No subjects added yet. Create your first subject above!</p>
          </div>
        )}

        <SubjectsGrid
          subjects={subjects}
          allUsers={allUsers}
          usn={usn}
          isLoading={isLoading}
          onAddTopic={handleAddTopic}
          onSubjectDelete={handleSubjectDelete}
          onTopicDelete={handleTopicDelete}
          onRefreshSubjects={refreshSubjects}
          showMessage={showMessage}
        />
      </div>
    </div>
  );
}
