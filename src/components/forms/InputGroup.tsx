
import React from 'react';

interface InputGroupProps {
    label: string;
    id: string;
    type?: 'text' | 'number' | 'password' | 'email' | 'date' | 'datetime-local';
    value: string | number | boolean | string[];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    placeholder?: string;
    required?: boolean;
    as?: 'input' | 'select' | 'textarea' | 'checkbox' | 'multi-select';
    options?: string[];
    rows?: number; // textareaの行数
    description?: string; // フィールドの説明
    multiple?: boolean; // multi-selectで複数選択可能
    min?: string; // numberインプットの最小値
    max?: string; // numberインプットの最大値
    step?: string; // numberインプットのステップ
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
    rows = 3,
    description,
    multiple = false,
    min,
    max,
    step,
}) => {
    const baseClasses = "w-full px-4 py-3 backdrop-blur-sm bg-white/60 border border-white/30 rounded-xl shadow-lg focus:ring-4 focus:ring-purple-200/50 focus:border-purple-300 focus:bg-white/80 hover:bg-white/70 transition-all duration-300 ease-in-out placeholder-gray-400 text-gray-700";
    
    const selectClasses = "w-full px-4 py-3 backdrop-blur-sm bg-white/60 border border-white/30 rounded-xl shadow-lg focus:ring-4 focus:ring-purple-200/50 focus:border-purple-300 focus:bg-white/80 hover:bg-white/70 transition-all duration-300 ease-in-out text-gray-700 cursor-pointer";

    const checkboxClasses = "w-5 h-5 text-purple-600 bg-white/60 border-white/30 rounded focus:ring-purple-200/50 focus:ring-2";

    const renderInput = () => {
        switch (as) {
            case 'input':
                return (
                    <input
                        type={type}
                        id={id}
                        name={id}
                        value={value as string | number}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        min={min}
                        max={max}
                        step={step}
                        className={baseClasses}
                    />
                );
            
            case 'textarea':
                return (
                    <textarea
                        id={id}
                        name={id}
                        value={value as string}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        rows={rows}
                        className={baseClasses}
                    />
                );
            
            case 'checkbox':
                return (
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id={id}
                            name={id}
                            checked={value as boolean}
                            onChange={onChange}
                            required={required}
                            className={checkboxClasses}
                        />
                        <label htmlFor={id} className="text-sm text-gray-700 cursor-pointer">
                            {placeholder || '有効にする'}
                        </label>
                    </div>
                );
            
            case 'multi-select':
                return (
                    <div className="space-y-2">
                        {(options || []).map((option) => (
                            <div key={option} className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id={`${id}-${option}`}
                                    name={id}
                                    value={option}
                                    checked={(value as string[]).includes(option)}
                                    onChange={(e) => {
                                        const currentValues = value as string[];
                                        const newValues = e.target.checked 
                                            ? [...currentValues, option]
                                            : currentValues.filter(v => v !== option);
                                        
                                        // Create a synthetic event for onChange
                                        const syntheticEvent = {
                                            target: {
                                                name: id,
                                                value: newValues
                                            }
                                        } as unknown as React.ChangeEvent<HTMLInputElement>;
                                        onChange(syntheticEvent);
                                    }}
                                    className={checkboxClasses}
                                />
                                <label htmlFor={`${id}-${option}`} className="text-sm text-gray-700 cursor-pointer">
                                    {option}
                                </label>
                            </div>
                        ))}
                    </div>
                );
            
            case 'select':
            default:
                return (
                    <select
                        id={id}
                        name={id}
                        value={value as string}
                        onChange={onChange}
                        required={required}
                        multiple={multiple}
                        className={selectClasses}
                    >
                        {!multiple && (
                            <option value="" disabled>
                                選択してください
                            </option>
                        )}
                        {(options || []).map((option) => (
                            <option key={option} value={option} className="bg-white text-gray-700">
                                {option}
                            </option>
                        ))}
                    </select>
                );
        }
    };

    return (
        <div className="group">
            <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-3 group-hover:text-purple-600 transition-colors duration-200">
                {label} {required && <span className="text-pink-500">*</span>}
            </label>
            {description && (
                <p className="text-xs text-gray-500 mb-2 italic">
                    {description}
                </p>
            )}
            {renderInput()}
        </div>
    );
};

export default InputGroup;
