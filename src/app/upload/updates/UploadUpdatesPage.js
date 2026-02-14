"use client";
import Link from "next/link";
import { Navbar } from '../../components/Navbar';
import AddUpdateForm from './AddUpdateForm';
import UpdatesList from './UpdatesList';

export default function UploadUpdatesPage() {
  return (
    <>
      <div style={{ maxWidth: 900, margin: '28px auto', padding: '0 16px' }}>
        <main style={{ background: '#fff', padding: 18, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Create a new Update</h3>
          <AddUpdateForm />

          <UpdatesList />
        </main>
      </div>
    </>
  );
}
