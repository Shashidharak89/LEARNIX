"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, BookOpen, FileText, Download, Eye, FolderOpen, BookMarked, Share2, Search, X } from "lucide-react";
import materialsData from "./materialsData";
import SMSearchResults from "./SMSearchResults";
import "./styles/StudyMaterials.css";

function FilesList({
  files,
  cssClass = "sm-files-list",
  semIndex,
  subjIndex,
  source,
  highlightedFileKey,
  onShareFile,
}) {
  return (
    <div className={cssClass}>
      {files.map((file, fIndex) => {
        const rawFileName = file.name || file.url.split("/").pop().split("?")[0];
        const fileName = decodeURIComponent(rawFileName);
        const encodedUrl = encodeURIComponent(file.url);
        const viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodedUrl}`;
        const fileKey = `${semIndex}-${subjIndex}-${source}-${fIndex}`;
        const isHighlighted = highlightedFileKey === fileKey;

        return (
          <div key={fIndex} className={`sm-file-card ${isHighlighted ? "sm-file-card-highlighted" : ""}`}>
            <a
              href={viewUrl}
              target="_blank"
              rel="noreferrer"
              className="sm-file-link"
              title="Click to view file"
              aria-label={`View ${fileName}`}
            >
              <div className="sm-file-info">
                <div className="sm-file-icon">📄</div>
                <span className="sm-file-name">{fileName}</span>
              </div>
            </a>
            <div className="sm-file-actions">
              <button
                type="button"
                className="sm-action-btn sm-share-btn"
                title="Share file link"
                aria-label={`Share ${fileName}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onShareFile(fileKey, fileName);
                }}
              >
                <Share2 size={16} />
              </button>
              <a
                href={viewUrl}
                target="_blank"
                rel="noreferrer"
                className="sm-action-btn sm-view-btn"
                title="View file"
                aria-label={`View ${fileName}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Eye size={16} />
              </a>
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="sm-action-btn sm-download-btn"
                title="Download file"
                aria-label={`Download ${fileName}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={16} />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StudyMaterials() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamKey = "keyword";
  const searchParamValue = searchParams.get(searchParamKey) || "";
  const [searchTerm, setSearchTerm] = useState(searchParamValue);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    if (searchParamValue !== searchTerm) {
      setSearchTerm(searchParamValue);
    }
  }, [searchParamValue]);

  useEffect(() => {
    if (searchTerm === searchParamValue) return;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (searchTerm.trim()) {
        nextParams.set(searchParamKey, searchTerm);
      } else {
        nextParams.delete(searchParamKey);
      }
      const nextQuery = nextParams.toString();
      const nextPath = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextPath);
    }, 250);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchTerm, searchParamValue, pathname, router, searchParams, searchParamKey]);

  const filteredMaterials = useMemo(() => {
    if (!searchTerm.trim()) return materialsData;

    const term = searchTerm.toLowerCase();

    return materialsData.map(sem => {
      // Check if semester name matches
      const semMatches = sem.semester.toLowerCase().includes(term);

      // Filter subjects
      const filteredSubjects = sem.subjects.map(subj => {
        const subjMatches = subj.subject.toLowerCase().includes(term);

        // Filter files
        const filteredFiles = (subj.files || []).filter(file => {
          const rawFileName = file.name || file.url.split("/").pop().split("?")[0];
          const fileName = decodeURIComponent(rawFileName);
          return fileName.toLowerCase().includes(term);
        });

        const filteredExternalFiles = (subj.externalfiles || []).filter(file => {
          const rawFileName = file.name || file.url.split("/").pop().split("?")[0];
          const fileName = decodeURIComponent(rawFileName);
          return fileName.toLowerCase().includes(term);
        });

        if (subjMatches || semMatches) {
          return subj;
        }

        if (filteredFiles.length > 0 || filteredExternalFiles.length > 0) {
          return {
            ...subj,
            files: filteredFiles,
            externalfiles: filteredExternalFiles,
          };
        }

        return null; // Subject doesn't match and has no matching files
      }).filter(Boolean); // Remove nulls

      if (semMatches || filteredSubjects.length > 0) {
        return {
          ...sem,
          subjects: filteredSubjects.length > 0 ? filteredSubjects : (semMatches ? sem.subjects : [])
        };
      }

      return null;
    }).filter(Boolean);
  }, [searchTerm]);

  const parseIndex = (value) => {
    if (value === null) return null;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
  };

  const openSemesterIndex = parseIndex(searchParams.get("sem"));
  const openSubjectIndex = parseIndex(searchParams.get("subj"));
  const openUnofficialKey = searchParams.get("ext");
  const highlightedFileKey = searchParams.get("file");

  const buildQueryString = (updates) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    const mergedParams = { ...currentParams, ...updates };

    Object.keys(mergedParams).forEach((key) => {
      const value = mergedParams[key];
      if (value === null || value === undefined || value === "") {
        delete mergedParams[key];
      }
    });

    return Object.entries(mergedParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join("&");
  };

  const pushWithUpdates = (updates) => {
    const queryString = buildQueryString(updates);
    const nextPath = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(nextPath);
    return nextPath;
  };

  const buildShareUrl = (updates) => {
    const queryString = buildQueryString(updates);
    const relativePath = queryString ? `${pathname}?${queryString}` : pathname;
    return `${window.location.origin}${relativePath}`;
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    const nextParams = new URLSearchParams(searchParams.toString());

    if (trimmed) {
      nextParams.set(searchParamKey, trimmed);
    } else {
      nextParams.delete(searchParamKey);
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(searchParamKey);
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  // Update URL when semester changes
  const toggleSemester = (index) => {
    const newSemIndex = openSemesterIndex === index ? null : index;

    if (newSemIndex === null) {
      // Close semester - remove sem, subj, ext and shared file from URL
      pushWithUpdates({ sem: null, subj: null, ext: null, file: null });
    } else {
      // Open semester
      pushWithUpdates({ sem: newSemIndex, subj: null, ext: null, file: null });
    }
  };

  // Update URL when subject changes
  const toggleSubject = (index) => {
    const newSubjIndex = openSubjectIndex === index ? null : index;

    if (newSubjIndex === null) {
      // Close subject - remove subj, ext and shared file from URL
      pushWithUpdates({ subj: null, ext: null, file: null });
    } else {
      // Open subject
      pushWithUpdates({ subj: newSubjIndex, ext: null, file: null });
    }
  };

  // Update URL when external files toggle changes
  const toggleUnofficial = (key) => {
    const newUnofficialKey = openUnofficialKey === key ? null : key;

    if (newUnofficialKey === null) {
      // Close external files - remove ext and shared file from URL
      pushWithUpdates({ ext: null, file: null });
    } else {
      // Open external files
      pushWithUpdates({ ext: newUnofficialKey, file: null });
    }
  };

  const handleShareFile = (fileKey, fileName) => {
    const shareUrl = buildShareUrl({ file: fileKey });
    pushWithUpdates({ file: fileKey });

    if (navigator.share) {
      navigator
        .share({
          title: fileName,
          text: `Check out this study material on Learnix: ${fileName}`,
          url: shareUrl,
        })
        .catch(() => { });
    } else {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => alert("Link copied to clipboard!"))
        .catch(() => alert("Failed to copy link"));
    }
  };

  return (
    <div className="sm-wrapper">
      <div className="sm-container">
        {/* Header */}
        <div className="sm-header">
          <div className="sm-header-content">
            <div className="sm-header-icon">
              <BookOpen size={28} />
            </div>
            <div className="sm-header-text">
              <h1 className="sm-title">Study Materials</h1>
              <p className="sm-subtitle">Access your course materials by semester and subject</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="sm-search-container">
          <form className="sm-search-form" onSubmit={handleSearchSubmit}>
            <div className="sm-search-wrapper">
              <Search className="sm-search-icon" size={20} />
              <input
                type="text"
                className="sm-search-input"
                placeholder="Search semesters, subjects, or files..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label="Search study materials"
              />
            </div>
            <button type="submit" className="sm-search-btn" disabled={!searchTerm.trim()}>
              Search
            </button>
            {searchTerm && (
              <button type="button" className="sm-search-clear-btn" onClick={handleClearSearch}>
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Materials List */}
        <div className="sm-materials-list">
          {searchTerm.trim() ? (
            <SMSearchResults
              searchQuery={searchTerm}
              onClearSearch={handleClearSearch}
              onShareFile={handleShareFile}
              highlightedFileKey={highlightedFileKey}
            />
          ) : (
            filteredMaterials.map((sem, semIndex) => (
              <div key={semIndex} className="sm-semester-block">
                {/* Semester Header */}
                <button
                  className={`sm-semester-btn ${searchTerm || openSemesterIndex === semIndex ? "sm-semester-open" : ""}`}
                  onClick={() => toggleSemester(semIndex)}
                >
                  <div className="sm-semester-left">
                    <FolderOpen size={20} />
                    <span className="sm-semester-name">{sem.semester}</span>
                    <span className="sm-subject-count">{sem.subjects.length} subjects</span>
                  </div>
                  <div className="sm-semester-icon">
                    {searchTerm || openSemesterIndex === semIndex ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </div>
                </button>

                {/* Subjects Container */}
                {(searchTerm || openSemesterIndex === semIndex) && (
                  <div className="sm-subjects-wrapper">
                    {sem.subjects.map((subj, subjIndex) => {
                      const unofficialKey = `${semIndex}-${subjIndex}`;
                      const hasExternalFiles = subj.externalfiles && subj.externalfiles.length > 0;
                      const isSubjOpen = searchTerm ? true : openSubjectIndex === subjIndex;
                      const isUnofficialOpen = searchTerm ? true : openUnofficialKey === unofficialKey;

                      return (
                        <div key={subjIndex} className="sm-subject-block">
                          {/* Subject Header */}
                          <button
                            className={`sm-subject-btn ${isSubjOpen ? "sm-subject-open" : ""}`}
                            onClick={() => toggleSubject(subjIndex)}
                          >
                            <div className="sm-subject-left">
                              <FileText size={18} />
                              <span className="sm-subject-name">{subj.subject}</span>
                              <span className="sm-file-count">{subj.files.length} files</span>
                            </div>
                            <div className="sm-subject-icon">
                              {isSubjOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </div>
                          </button>

                          {/* Expanded subject content */}
                          {isSubjOpen && (
                            <div className="sm-subject-content">

                              {/* ── Unofficial Resources (only if externalfiles exist) ── */}
                              {hasExternalFiles && (
                                <div className="sm-unofficial-block">
                                  <button
                                    className={`sm-unofficial-btn ${isUnofficialOpen ? "sm-unofficial-open" : ""}`}
                                    onClick={() => toggleUnofficial(unofficialKey)}
                                  >
                                    <div className="sm-unofficial-left">
                                      <BookMarked size={16} />
                                      <span className="sm-unofficial-label">External Resources</span>
                                      <span className="sm-unofficial-badge">{subj.externalfiles.length} files</span>
                                    </div>
                                    <div className="sm-unofficial-chevron">
                                      {isUnofficialOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </div>
                                  </button>

                                  {isUnofficialOpen && (
                                    <FilesList
                                      files={subj.externalfiles}
                                      cssClass="sm-unofficial-files-list"
                                      semIndex={semIndex}
                                      subjIndex={subjIndex}
                                      source="external"
                                      highlightedFileKey={highlightedFileKey}
                                      onShareFile={handleShareFile}
                                    />
                                  )}
                                </div>
                              )}

                              {/* ── Official Files ── */}
                              <FilesList
                                files={subj.files}
                                semIndex={semIndex}
                                subjIndex={subjIndex}
                                source="official"
                                highlightedFileKey={highlightedFileKey}
                                onShareFile={handleShareFile}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}