import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Team Operations',
};

// Redirect to unified Team Hub - operations are now a tab there
export default async function TeamOperationsRoute() {
  redirect('/admin/team');
}

