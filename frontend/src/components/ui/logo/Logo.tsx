import React from 'react';

interface LogoProps {
  variant?: 'default' | 'small' | 'large';
  className?: string;
}

/**
 * Компонент логотипа UGC Market
 */
const Logo: React.FC<LogoProps> = ({ variant = 'default', className = '' }) => {
  // Определяем размеры в зависимости от варианта
  let width: string;
  let height: string;
  
  switch (variant) {
    case 'small':
      width = 'w-8';
      height = 'h-8';
      break;
    case 'large':
      width = 'w-40';
      height = 'h-12';
      break;
    default:
      width = 'w-32';
      height = 'h-10';
      break;
  }
  
  return (
    <img 
      src="/images/ugc logo2.svg" 
      alt="UGC Market Logo" 
      className={`${width} ${height} ${className}`}
    />
  );
};

export default Logo;
