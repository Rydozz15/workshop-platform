import { redirect } from 'next/navigation';

// Versions are now the "conditions" of each campaign step; the campaign editor replaces this page.
export default function VersionsRedirect() {
  redirect('/admin/campaigns');
}
