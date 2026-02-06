/**
 * Logo component for Adapt
 * Uses lime square with black letter "A"
 */

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'lime' | 'black';
  className?: string;
}

export function Logo({ size = 'md', variant = 'lime', className = '' }: LogoProps) {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 56,
  };

  const dimension = sizeMap[size];
  const fontSize = dimension * 0.6;

  const colors = {
    lime: {
      bg: '#C8F65D',
      text: '#0A0A0A',
    },
    black: {
      bg: '#0A0A0A',
      text: '#C8F65D',
    },
  };

  const { bg, text } = colors[variant];

  return (
    <div
      className={`inline-flex items-center justify-center rounded-lg ${className}`}
      style={{
        width: dimension,
        height: dimension,
        backgroundColor: bg,
      }}
    >
      <span
        style={{
          fontSize,
          color: text,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        A
      </span>
    </div>
  );
}
