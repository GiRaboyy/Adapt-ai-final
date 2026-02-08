import { BrandPanel } from './BrandPanel';
import { ContentCard } from './ContentCard';

interface AuthLayoutProps {
  children: React.ReactNode;
  brandTitle?: string | React.ReactNode;
  brandSubtitle?: string;
  contentMaxWidth?: 'md' | 'lg';
  contentPadding?: 'default' | 'large';
}

export function AuthLayout({
  children,
  brandTitle,
  brandSubtitle,
  contentMaxWidth = 'md',
  contentPadding = 'default',
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <BrandPanel title={brandTitle} subtitle={brandSubtitle} />
      <ContentCard maxWidth={contentMaxWidth} padding={contentPadding}>
        {children}
      </ContentCard>
    </div>
  );
}
