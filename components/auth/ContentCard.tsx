import { LogoMark } from './LogoMark';

interface ContentCardProps {
  children: React.ReactNode;
  maxWidth?: 'md' | 'lg';
  padding?: 'default' | 'large';
}

export function ContentCard({
  children,
  maxWidth = 'md',
  padding = 'default',
}: ContentCardProps) {
  const widthClass = maxWidth === 'lg' ? 'max-w-xl' : 'max-w-[460px]';
  const paddingClass = padding === 'large' ? 'px-8 py-10' : 'px-8 py-7';

  return (
    <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#F6F7F9]">
      <div className={`w-full ${widthClass}`}>
        <div className={`glass-card rounded-2xl shadow-xl ${paddingClass} space-y-6`}>
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center">
            <LogoMark />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
