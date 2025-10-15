
import React from 'react';

interface InputGroupProps {
    label: string;
    id: string;
    type?: 'text' | 'number' | 'password';
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    placeholder?: string;
    required?: boolean;
    as?: 'input' | 'select';
    options?: string[];
}

const InputGroup: React.FC<InputGroupProps> = ({
    label,
    id,
    type = 'text',
    value,
    onChange,
    placeholder = '',
    required = false,
    as = 'input',
    options = [],
}) => {
    const baseClasses = "w-full px-4 py-3 backdrop-blur-sm bg-white/60 border border-white/30 rounded-xl shadow-lg focus:ring-4 focus:ring-purple-200/50 focus:border-purple-300 focus:bg-white/80 hover:bg-white/70 transition-all duration-300 ease-in-out placeholder-gray-400 text-gray-700";
    
    const selectClasses = "w-full px-4 py-3 backdrop-blur-sm bg-white/60 border border-white/30 rounded-xl shadow-lg focus:ring-4 focus:ring-purple-200/50 focus:border-purple-300 focus:bg-white/80 hover:bg-white/70 transition-all duration-300 ease-in-out text-gray-700 cursor-pointer";

    return (
        <div className="group">
            <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-3 group-hover:text-purple-600 transition-colors duration-200">
                {label} {required && <span className="text-pink-500">*</span>}
            </label>
            {as === 'input' ? (
                <input
                    type={type}
                    id={id}
                    name={id}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    className={baseClasses}
                />
            ) : (
                <select
                    id={id}
                    name={id}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className={selectClasses}
                >
                    {options.map((option) => (
                        <option key={option} value={option} className="bg-white text-gray-700">
                            {option}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
};

export default InputGroup;
