import { Suspense } from 'react';
import { Navbar } from '../components/Navbar';
import UpdatesPage from './UpdatesPage';

export default function Updates() {
  return (
    <>
      <Navbar />
      <Suspense fallback={null}>
        <UpdatesPage />
      </Suspense>
    </>
  );
}
