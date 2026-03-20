"use client";

import {
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import styles from "./CustomSelect.module.css";

interface Option {
    value: string;
    label: string;
    badgeCount?: number;
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

const MENU_OFFSET = 8;
const VIEWPORT_PADDING = 12;
const FALLBACK_MENU_HEIGHT = 240;

export default function CustomSelect({
    options,
    placeholder = "Select an option",
    value,
    onChange,
    name,
    required,
    disabled = false,
}: CustomSelectProps) {
    const menuId = useId();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);
    const isMounted = typeof document !== "undefined";
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(value ?? "");
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);

    const currentValue = value !== undefined ? value ?? "" : internalValue;
    const selectedOption = useMemo(
        () => options.find((option) => option.value === currentValue),
        [currentValue, options],
    );
    const selectedIndex = useMemo(
        () => options.findIndex((option) => option.value === currentValue),
        [currentValue, options],
    );

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node | null;
            if (!target) return;

            const clickedTrigger = wrapperRef.current?.contains(target);
            const clickedMenu = menuRef.current?.contains(target);
            if (!clickedTrigger && !clickedMenu) {
                setIsOpen(false);
            }
        };

        const handleWindowBlur = () => {
            setIsOpen(false);
        };

        document.addEventListener("pointerdown", handlePointerDown, true);
        window.addEventListener("blur", handleWindowBlur);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown, true);
            window.removeEventListener("blur", handleWindowBlur);
        };
    }, [isOpen]);

    useLayoutEffect(() => {
        if (!isOpen || !isMounted || !triggerRef.current) {
            return;
        }

        const updateMenuPosition = () => {
            if (!triggerRef.current) return;

            const rect = triggerRef.current.getBoundingClientRect();
            const measuredHeight = menuRef.current?.offsetHeight || FALLBACK_MENU_HEIGHT;
            const availableBottom = window.innerHeight - rect.bottom - VIEWPORT_PADDING;
            const availableTop = rect.top - VIEWPORT_PADDING;
            const opensUp = availableBottom < measuredHeight && availableTop > availableBottom;
            const maxHeight = Math.max(160, opensUp ? availableTop - MENU_OFFSET : availableBottom - MENU_OFFSET);
            const menuHeight = Math.min(measuredHeight, maxHeight || measuredHeight);
            const width = Math.min(rect.width, window.innerWidth - VIEWPORT_PADDING * 2);
            const left = Math.min(
                Math.max(rect.left, VIEWPORT_PADDING),
                window.innerWidth - width - VIEWPORT_PADDING,
            );

            setMenuStyle({
                position: "fixed",
                top: opensUp ? rect.top - menuHeight - MENU_OFFSET : rect.bottom + MENU_OFFSET,
                left,
                width,
                maxHeight,
                zIndex: 9999,
            });
        };

        updateMenuPosition();
        const rafId = window.requestAnimationFrame(updateMenuPosition);
        window.addEventListener("resize", updateMenuPosition);
        window.addEventListener("scroll", updateMenuPosition, true);

        return () => {
            window.cancelAnimationFrame(rafId);
            window.removeEventListener("resize", updateMenuPosition);
            window.removeEventListener("scroll", updateMenuPosition, true);
        };
    }, [isOpen, isMounted, options.length]);

    useEffect(() => {
        if (!isOpen || highlightedIndex < 0) return;
        const highlightedOption = menuRef.current?.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`);
        highlightedOption?.scrollIntoView({ block: "nearest" });
    }, [highlightedIndex, isOpen]);

    const selectOption = (nextValue: string) => {
        if (value === undefined) {
            setInternalValue(nextValue);
        }
        onChange?.(nextValue);
        setIsOpen(false);
        triggerRef.current?.focus();
    };

    const openMenu = () => {
        if (disabled || options.length === 0) return;
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : (options.length > 0 ? 0 : -1));
        setIsOpen(true);
    };

    const toggleMenu = () => {
        if (disabled || options.length === 0) return;
        setIsOpen((current) => {
            const nextIsOpen = !current;
            if (nextIsOpen) {
                setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : (options.length > 0 ? 0 : -1));
            }
            return nextIsOpen;
        });
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement | HTMLUListElement>) => {
        if (disabled) return;

        if (!isOpen && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
            event.preventDefault();
            openMenu();
            return;
        }

        if (!isOpen) return;

        if (event.key === "Escape") {
            event.preventDefault();
            setIsOpen(false);
            triggerRef.current?.focus();
            return;
        }

        if (event.key === "Tab") {
            setIsOpen(false);
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightedIndex((current) => {
                if (options.length === 0) return -1;
                return current < options.length - 1 ? current + 1 : 0;
            });
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightedIndex((current) => {
                if (options.length === 0) return -1;
                return current > 0 ? current - 1 : options.length - 1;
            });
            return;
        }

        if ((event.key === "Enter" || event.key === " ") && highlightedIndex >= 0) {
            event.preventDefault();
            selectOption(options[highlightedIndex].value);
        }
    };

    return (
        <div className={styles.selectWrapper} ref={wrapperRef}>
            <button
                ref={triggerRef}
                type="button"
                className={`${styles.selectButton} ${isOpen ? styles.open : ""} ${selectedOption ? styles.hasValue : ""} ${disabled ? styles.disabled : ""}`}
                onClick={toggleMenu}
                onKeyDown={handleKeyDown}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={menuId}
                disabled={disabled}
            >
                <span className={selectedOption ? styles.selectedText : styles.placeholderText}>
                    <span className={styles.optionContent}>
                        <span className={styles.optionLabelText}>{selectedOption?.label || placeholder}</span>
                        {selectedOption?.badgeCount !== undefined ? (
                            <span className={styles.selectCountBadge}>{selectedOption.badgeCount}</span>
                        ) : null}
                    </span>
                </span>
                <ChevronDown size={18} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`} aria-hidden="true" />
            </button>

            <input type="hidden" name={name} value={currentValue} required={required} />

            {isMounted && isOpen && !disabled
                ? createPortal(
                    <ul
                        id={menuId}
                        ref={menuRef}
                        className={styles.optionsList}
                        style={menuStyle || {
                            position: "fixed",
                            top: -9999,
                            left: -9999,
                            visibility: "hidden",
                        }}
                        role="listbox"
                        tabIndex={-1}
                        onKeyDown={handleKeyDown}
                    >
                        {options.map((option, index) => (
                            <li
                                key={`${option.value}-${option.label}`}
                                data-index={index}
                                className={`${styles.option} ${currentValue === option.value ? styles.selected : ""} ${highlightedIndex === index ? styles.highlighted : ""}`}
                                role="option"
                                aria-selected={currentValue === option.value}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                onMouseDown={(event) => {
                                    event.preventDefault();
                                    selectOption(option.value);
                                }}
                            >
                                <span className={styles.optionContent}>
                                    <span className={styles.optionLabelText}>{option.label}</span>
                                    {option.badgeCount !== undefined ? (
                                        <span className={styles.selectCountBadge}>{option.badgeCount}</span>
                                    ) : null}
                                </span>
                            </li>
                        ))}
                    </ul>,
                    document.body,
                )
                : null}
        </div>
    );
}
