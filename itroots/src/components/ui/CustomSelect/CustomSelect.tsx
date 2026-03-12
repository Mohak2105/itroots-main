'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CustomSelect.module.css';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    name?: string;
    required?: boolean;
    disabled?: boolean;
}

export default function CustomSelect({
    options,
    placeholder = 'Select an option',
    value,
    onChange,
    name,
    required,
    disabled = false,
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || '');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSelectedValue(value || '');
    }, [value]);

    const selectedOption = options.find(opt => opt.value === selectedValue);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        setSelectedValue(optionValue);
        onChange?.(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={styles.selectWrapper} ref={dropdownRef}>
            <button
                type="button"
                className={`${styles.selectButton} ${isOpen ? styles.open : ''} ${selectedValue ? styles.hasValue : ''} ${disabled ? styles.disabled : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                disabled={disabled}
            >
                <span className={selectedValue ? styles.selectedText : styles.placeholderText}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown 
                    size={18} 
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} 
                />
            </button>

            {/* Hidden input for form submission */}
            <input 
                type="hidden" 
                name={name} 
                value={selectedValue} 
                required={required}
            />

            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.ul
                        className={styles.optionsList}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        role="listbox"
                    >
                        {options.map((option) => (
                            <li
                                key={option.value}
                                className={`${styles.option} ${selectedValue === option.value ? styles.selected : ''}`}
                                onClick={() => handleSelect(option.value)}
                                role="option"
                                aria-selected={selectedValue === option.value}
                            >
                                {option.label}
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}
