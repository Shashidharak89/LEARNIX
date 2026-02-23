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
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  const { theme } = useTheme();

  useEffect(() => {
    const storedUsn = localStorage.getItem("usn");
    if (storedUsn) setUsn(storedUsn);
    fetchSubjects(storedUsn, 1);
    fetchAllUsers();
  }, []);

  const showMessage = (text, type = "", duration = 3000) => {
    setMessage(text);
    setTimeout(() => setMessage(""), duration);
  };

  const fetchSubjects = async (usn, pageNum = 1, append = false) => {
    if (pageNum === 1) setIsLoading(true);
    else setLoadingMore(true);
    try {
      const res = await axios.get("/api/work/get", { params: { usn, page: pageNum, limit } });
      const fetched = res.data.subjects || [];
      const total = res.data.paging?.total || 0;
      if (append) setSubjects((prev) => [...prev, ...fetched]);
      else setSubjects(fetched);
      setPage(pageNum);
      setHasMore(pageNum * limit < total);
    } catch (err) {
      console.error(err);
      showMessage("Failed to fetch subjects", "error");
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
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
    // Refresh first page after deletion to keep paging consistent
    fetchSubjects(usn, 1);
    showMessage("Subject deleted successfully!", "success");
  };

  const handleTopicDelete = (updatedSubjects) => {
    // Refresh first page after topic deletion to keep ordering consistent
    fetchSubjects(usn, 1);
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
      // Refresh first page after adding
      fetchSubjects(usn, 1);
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
      // Refresh first page to include updated topic ordering
      fetchSubjects(usn, 1);
      showMessage("Topic added successfully!", "success");
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.error || "Error adding topic", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubjects = () => {
    fetchSubjects(usn, 1);
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
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button
              onClick={() => fetchSubjects(usn, page + 1, true)}
              disabled={loadingMore}
              className="mse-view-more-btn"
            >
              {loadingMore ? 'Loading...' : 'View more subjects'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
