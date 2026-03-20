import UserProfile from '@/components/Pages/UserProfile';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Profile - Daju Vai',
  description: 'Your profile',
};

export default function Page() {
  return <UserProfile />;
}
