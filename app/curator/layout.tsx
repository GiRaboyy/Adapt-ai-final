import { CuratorLayout } from '@/components/curator/CuratorLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CuratorLayout>{children}</CuratorLayout>;
}
