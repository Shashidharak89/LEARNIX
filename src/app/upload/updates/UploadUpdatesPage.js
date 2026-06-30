"use client";
import { useState } from "react";
import Link from "next/link";
import { Navbar } from '../../components/Navbar';
import AddUpdateForm from './AddUpdateForm';
import UpdatesList from './UpdatesList';

export default function UploadUpdatesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpdateAdded = () => {
    setRefreshKey(k => k + 1);
  };
  return (
    <>
      <div className="upload-updates-page" style={{ width: '94%', maxWidth: '1400px', margin: '28px auto', boxSizing: 'border-box' }}>
        <main>
          <AddUpdateForm onUpdateAdded={handleUpdateAdded} />

          <UpdatesList refreshKey={refreshKey} />
        </main>
      </div>
    </>
  );
}
