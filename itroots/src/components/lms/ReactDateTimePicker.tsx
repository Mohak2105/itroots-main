"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { CalendarDots, CaretDown, Clock } from "@/components/icons/lucide-phosphor";
import CustomSelect from "@/components/ui/CustomSelect/CustomSelect";
import styles from "./react-date-time-picker.module.css";

type CalendarValue = Date | null | [Date | null, Date | null];

type ReactDateTimePickerProps = {
    label?: string;
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    variant?: "default" | "soft";
    testId?: string;
    mode?: "date-time" | "date";
    minDate?: string;
    maxDate?: string;
};

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => {
    const hour = index + 1;
    return { value: String(hour), label: String(hour).padStart(2, "0") };
});

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => ({
    value: String(index),
    label: String(index).padStart(2, "0"),
}));

const PERIOD_OPTIONS = [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" },
];

const cloneDate = (date: Date) => new Date(date.getTime());

const parseDateValue = (value?: string) => {
    if (!value) return null;

    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) {
        return null;
    }

    const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseDateTimeValue = (value?: string) => {
    if (!value) return null;

    const [datePart, timePart = "10:00"] = value.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);

    if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) {
        return null;
    }

    const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateTimeValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatDateDisplayValue = (date?: Date | null) => {
    if (!date) return "";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDisplayValue = (date?: Date | null) => {
    if (!date) return "";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const getHour12 = (date: Date) => {
    const hours = date.getHours();
    if (hours === 0) return 12;
    if (hours > 12) return hours - 12;
    return hours;
};

const getPeriod = (date: Date) => (date.getHours() >= 12 ? "PM" : "AM");

export default function ReactDateTimePicker({
    label,
    value,
    onChange,
    placeholder = "Select date and time",
    required = false,
    disabled = false,
    variant = "default",
    testId,
    mode = "date-time",
    minDate,
    maxDate,
}: ReactDateTimePickerProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const parsedValue = useMemo(
        () => (mode === "date" ? parseDateValue(value) : parseDateTimeValue(value)),
        [mode, value],
    );
    const minCalendarDate = useMemo(() => parseDateValue(minDate), [minDate]);
    const maxCalendarDate = useMemo(() => parseDateValue(maxDate), [maxDate]);
    const [isOpen, setIsOpen] = useState(false);
    const [draftDate, setDraftDate] = useState<Date>(() => parsedValue ? cloneDate(parsedValue) : new Date());

    useEffect(() => {
        if (parsedValue) {
            setDraftDate(cloneDate(parsedValue));
        }
    }, [parsedValue]);

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node | null;
            if (target && !wrapperRef.current?.contains(target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown, true);
        return () => document.removeEventListener("pointerdown", handlePointerDown, true);
    }, [isOpen]);

    const activeDate = parsedValue || draftDate;
    const displayValue = parsedValue
        ? (mode === "date" ? formatDateDisplayValue(parsedValue) : formatDisplayValue(parsedValue))
        : "";
    const triggerClassName = [
        styles.trigger,
        variant === "soft" ? styles.triggerSoft : "",
        disabled ? styles.triggerDisabled : "",
    ].filter(Boolean).join(" ");
    const panelClassName = [
        styles.panel,
        mode === "date" ? styles.panelDateOnly : "",
    ].filter(Boolean).join(" ");

    const applyChange = (nextDate: Date) => {
        const normalized = cloneDate(nextDate);
        normalized.setSeconds(0, 0);
        setDraftDate(normalized);
        onChange(mode === "date" ? formatDateValue(normalized) : formatDateTimeValue(normalized));
    };

    const handleDateChange = (nextValue: CalendarValue) => {
        const nextDate = Array.isArray(nextValue) ? nextValue[0] : nextValue;
        if (!nextDate) return;
        if (minCalendarDate && nextDate < minCalendarDate) return;
        if (maxCalendarDate && nextDate > maxCalendarDate) return;

        const mergedDate = cloneDate(activeDate);
        mergedDate.setFullYear(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
        applyChange(mergedDate);
    };

    const updateTime = (changes: { hour12?: number; minute?: number; period?: "AM" | "PM" }) => {
        const nextDate = cloneDate(activeDate);
        const minute = changes.minute ?? nextDate.getMinutes();
        const hour12 = changes.hour12 ?? getHour12(nextDate);
        const period = changes.period ?? getPeriod(nextDate);

        let hour24 = hour12 % 12;
        if (period === "PM") {
            hour24 += 12;
        }

        nextDate.setHours(hour24, minute, 0, 0);
        applyChange(nextDate);
    };

    const useCurrentTime = () => {
        applyChange(new Date());
    };

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            {label ? <label className={styles.label}>{label}</label> : null}

            <button
                type="button"
                className={triggerClassName}
                onClick={() => !disabled && setIsOpen((current) => !current)}
                disabled={disabled}
                data-testid={testId ? `${testId}-trigger` : undefined}
            >
                <span className={styles.triggerValue}>
                    <CalendarDots size={18} />
                    {displayValue ? (
                        <span>{displayValue}</span>
                    ) : (
                        <span className={styles.placeholder}>{placeholder}</span>
                    )}
                </span>
                <CaretDown size={16} weight="bold" className={isOpen ? styles.chevronOpen : ""} />
            </button>

            {required ? (
                <input
                    type="text"
                    readOnly
                    required
                    value={value || ""}
                    tabIndex={-1}
                    aria-hidden="true"
                    className={styles.hiddenInput}
                />
            ) : null}

            {isOpen ? (
                <div className={panelClassName} data-testid={testId ? `${testId}-panel` : undefined}>
                    <div className={styles.calendarSection}>
                        {mode === "date-time" ? (
                            <div className={styles.selectionSummary}>
                                <span className={styles.selectionEyebrow}>Selected schedule</span>
                                <strong>{formatDisplayValue(activeDate)}</strong>
                            </div>
                        ) : null}

                        <div className={styles.calendarWrap}>
                            <Calendar
                                calendarType={mode === "date" ? "iso8601" : "gregory"}
                                next2Label={mode === "date" ? ">>" : null}
                                prev2Label={mode === "date" ? "<<" : null}
                                nextLabel={mode === "date" ? ">" : undefined}
                                prevLabel={mode === "date" ? "<" : undefined}
                                onChange={handleDateChange}
                                value={activeDate}
                                minDate={minCalendarDate || undefined}
                                maxDate={maxCalendarDate || undefined}
                            />
                        </div>
                    </div>

                    {mode === "date-time" ? (
                        <div className={styles.timePanel}>
                            <div className={styles.timeHeader}>
                                <Clock size={16} />
                                <span>Time</span>
                            </div>

                            <div className={styles.timeGrid}>
                                <div className={styles.timeField}>
                                    <span className={styles.timeLabel}>Hour</span>
                                    <CustomSelect
                                        value={String(getHour12(activeDate))}
                                        onChange={(next) => updateTime({ hour12: Number(next) })}
                                        options={HOUR_OPTIONS}
                                        testId={testId ? `${testId}-hour` : undefined}
                                    />
                                </div>

                                <div className={styles.timeField}>
                                    <span className={styles.timeLabel}>Minute</span>
                                    <CustomSelect
                                        value={String(activeDate.getMinutes())}
                                        onChange={(next) => updateTime({ minute: Number(next) })}
                                        options={MINUTE_OPTIONS}
                                        testId={testId ? `${testId}-minute` : undefined}
                                    />
                                </div>

                                <div className={styles.timeField}>
                                    <span className={styles.timeLabel}>Period</span>
                                    <CustomSelect
                                        value={getPeriod(activeDate)}
                                        onChange={(next) => updateTime({ period: next as "AM" | "PM" })}
                                        options={PERIOD_OPTIONS}
                                        testId={testId ? `${testId}-period` : undefined}
                                    />
                                </div>
                            </div>

                            <div className={styles.footer}>
                                <button
                                    type="button"
                                    className={styles.secondaryBtn}
                                    onClick={useCurrentTime}
                                    data-testid={testId ? `${testId}-use-current-time` : undefined}
                                >
                                    Use current time
                                </button>
                                <button
                                    type="button"
                                    className={styles.primaryBtn}
                                    onClick={() => setIsOpen(false)}
                                    data-testid={testId ? `${testId}-done` : undefined}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.dateOnlyFooter}>
                            <button
                                type="button"
                                className={styles.primaryBtn}
                                onClick={() => setIsOpen(false)}
                                data-testid={testId ? `${testId}-done` : undefined}
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
