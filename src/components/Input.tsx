import React, { forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  isPassword?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, isPassword, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full mb-4">
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={`w-full px-4 py-3 bg-[#EAE3D2] border border-transparent rounded-md outline-none focus:border-[#1F2544] focus:ring-1 focus:ring-[#1F2544] transition-all placeholder:text-gray-500 text-[#1F2544] ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#1F2544]"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        {error && <p className="text-red-500 text-sm mt-1 text-left">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
