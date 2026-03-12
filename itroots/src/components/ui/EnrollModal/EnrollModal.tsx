'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CheckCircle } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect/CustomSelect';
import { courses } from '@/data/courses';
import { ENDPOINTS } from '@/config/api';
import styles from './EnrollModal.module.css';

const courseOptions = courses.map((course) => ({
    value: course.slug,
    label: course.shortTitle,
}));

interface EnrollModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function EnrollModal({ isOpen, onClose }: EnrollModalProps) {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            course: formData.get('course'),
            message: formData.get('message'),
        };

        try {
            const response = await fetch(ENDPOINTS.PUBLIC.ENROLL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                setIsSubmitted(true);
                setTimeout(() => {
                    setIsSubmitted(false);
                    onClose();
                }, 3000);
            } else {
                alert('Enrollment failed. Please try again.');
            }
        } catch (error) {
            console.error('Enrollment error:', error);
            alert('An error occurred. Check if the server is running.');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={styles.overlay} onClick={onClose}>
                    <motion.div
                        className={styles.modal}
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className={styles.header}>
                            <h2>Enroll Now</h2>
                            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.content}>
                            {isSubmitted ? (
                                <div className={styles.successWrapper} style={{ textAlign: 'center', padding: '2rem' }}>
                                    <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Application Sent!</h3>
                                    <p style={{ color: '#64748b' }}>Our team will call you within 24 hours to complete your enrollment.</p>
                                </div>
                            ) : (
                                <form className={styles.form} onSubmit={handleSubmit}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="modal-name">Full Name *</label>
                                        <input type="text" id="modal-name" name="name" required placeholder="Enter full name" autoFocus />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="modal-email">Email Address *</label>
                                        <input type="email" id="modal-email" name="email" required placeholder="Enter email" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="modal-phone">Phone Number *</label>
                                        <input type="tel" id="modal-phone" name="phone" required placeholder="Enter phone number" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Select Course *</label>
                                        <CustomSelect
                                            options={courseOptions}
                                            placeholder="Select a course"
                                            name="course"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="modal-message">Any Questions?</label>
                                        <textarea id="modal-message" name="message" rows={3} placeholder="Optional..."></textarea>
                                    </div>
                                    <button type="submit" className={styles.submitBtn}>
                                        Submit Application
                                        <ArrowRight size={18} />
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
