import { LogoMark } from './LogoMark';

interface BrandPanelProps {
  title?: string | React.ReactNode;
  subtitle?: string;
}

export function BrandPanel({
  title = (
    <>
      Обучайте
      <br />
      сотрудников
      <br />
      быстрее с Adapt
    </>
  ),
  subtitle = 'ИИ-курсы на основе базы знаний вашей компании',
}: BrandPanelProps) {
  return (
    <div className="hidden lg:flex lg:w-[48%] bg-[#0B0B0F] relative overflow-hidden noise-overlay">
      <div className="relative z-10 flex flex-col justify-center items-start h-full px-12 py-16">
        {/* Logo at top - absolute positioned */}
        <div className="absolute top-8 left-12">
          <LogoMark />
        </div>

        {/* Text block - vertically centered */}
        <div className="space-y-6 max-w-xl">
          <h1 className="font-display text-[56px] xl:text-[64px] font-extrabold text-white leading-[1.05] tracking-[-0.02em]">
            {title}
          </h1>
          <p className="text-gray-400 text-lg xl:text-xl leading-relaxed max-w-[520px] opacity-80">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-lime/35 via-green-500/20 to-transparent animate-float blur-[80px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-emerald-400/18 via-lime/12 to-transparent animate-float-slow blur-[60px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-lime/5 blur-[100px]" />
      </div>
    </div>
  );
}
