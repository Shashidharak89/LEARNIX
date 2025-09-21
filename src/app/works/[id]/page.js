"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const WorkTopicPage = () => {
  const params = useParams();
  const id = params?.id; // get id safely
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return; // wait until id is available

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/work/getbytopicid/${id}`);
        if (!res.ok) throw new Error("Failed to fetch data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!data) return <p>No data found</p>;

  const { user, subject, topic } = data;

  return (
    <div>
      {/* User Info */}
      <section>
        <h2>User Info</h2>
        <img src={user.profileimg} alt={user.name} width={100} height={100} />
        <p>Name: {user.name}</p>
        <p>USN: {user.usn}</p>
      </section>

      {/* Subject Info */}
      <section>
        <h2>Subject</h2>
        <p>{subject.subject}</p>
      </section>

      {/* Topic Info */}
      <section>
        <h2>Topic: {topic.topic}</h2>
        {topic.content && <p>{topic.content}</p>}

        {/* Topic Images */}
        {topic.images && topic.images.length > 0 && (
          <div>
            <h3>Images:</h3>
            {topic.images.map((img, index) => (
              <img key={index} src={img} alt={`Topic image ${index + 1}`} width={300} />
            ))}
          </div>
        )}

        <p>Posted on: {new Date(topic.timestamp).toLocaleString()}</p>
      </section>
    </div>
  );
};

export default WorkTopicPage;
