"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox() {
  const [usn, setUsn] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    if (usn.trim() !== "") {
      router.push(`/search/${usn.trim().toUpperCase()}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Search User by USN</h2>
      <input
        type="text"
        value={usn}
        onChange={(e) => setUsn(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter USN"
        style={{
          width: "250px",
          padding: "8px",
          marginRight: "10px",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      />
      <button
        onClick={handleSearch}
        style={{
          padding: "8px 15px",
          border: "none",
          backgroundColor: "#0070f3",
          color: "white",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Search
      </button>
    </div>
  );
}
