import { Suspense } from 'react';
import { Navbar } from '../../components/Navbar';
import UpdatesPage from '../UpdatesPage';

export default async function SingleUpdatePage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  return (
    <>
      <Navbar />
      <Suspense fallback={null}>
        <UpdatesPage initialUpdateId={id} />
      </Suspense>
    </>
  );
}
