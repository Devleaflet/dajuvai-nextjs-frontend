import Wishlist from '@/components/Pages/Wishlist';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Wishlist - Daju Vai',
  description: 'Your wishlist items',
};

export default function Page() {
  return <Wishlist />;
}
