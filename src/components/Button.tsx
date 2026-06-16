import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-4 py-3 rounded-md font-semibold transition-colors duration-200 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-[#1F2544] text-white hover:bg-[#161A30]",
    secondary: "bg-[#EAE3D2] text-[#1F2544] hover:bg-[#DED7C6]",
    outline: "border-2 border-[#1F2544] text-[#1F2544] hover:bg-[#1F2544] hover:text-white",
    ghost: "text-[#1F2544] hover:bg-black/5"
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
