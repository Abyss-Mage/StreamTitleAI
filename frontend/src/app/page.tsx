import { redirect } from 'next/navigation';

export default function RootPage() {
  // Instantly redirect root traffic to the dashboard home
  // The DashboardLayout will handle kicking you to /login if needed
  redirect('/home');
}