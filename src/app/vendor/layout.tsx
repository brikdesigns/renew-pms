import { ToastProvider } from '@/components/ToastProvider';

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToastProvider>{children}</ToastProvider>;
}
