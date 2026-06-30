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
      <div style={{ maxWidth: 900, margin: '28px auto', padding: '0 16px' }}>
        <main style={{ background: '#fff', padding: 18, borderRadius: 8 }}>
          <AddUpdateForm onUpdateAdded={handleUpdateAdded} />

          <UpdatesList refreshKey={refreshKey} />
        </main>
      </div>
    </>
  );
}
