import { Suspense } from 'react';
import { Navbar } from '../../components/Navbar';
import SingleUpdateView from './SingleUpdateView';

export default async function SingleUpdatePage({ params }) {
  const resolvedParams = await params;
  const updateId = resolvedParams?.id;

  return (
    <>
      <Navbar />
      <Suspense fallback={null}>
        <SingleUpdateView updateId={updateId} />
      </Suspense>
    </>
  );
}
