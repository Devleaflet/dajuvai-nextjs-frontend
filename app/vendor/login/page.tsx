import { redirect } from 'next/navigation';

export default function VendorLoginPage() {
  redirect('/?vendorLogin=1');
}
