'use client';

import React from 'react';
import { motion } from 'motion/react';
import styles from './TestimonialsColumns.module.css';

interface Testimonial {
    text: string;
    image: string;
    name: string;
    role: string;
}

interface TestimonialsColumnProps {
    className?: string;
    testimonials: Testimonial[];
    duration?: number;
}

export const TestimonialsColumn: React.FC<TestimonialsColumnProps> = ({
    className = '',
    testimonials,
    duration = 10,
}) => {
    return (
        <div className={`${styles.column} ${className}`}>
            <motion.div
                animate={{
                    translateY: '-50%',
                }}
                transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: 'linear',
                    repeatType: 'loop',
                }}
                className={styles.columnInner}
            >
                {[...new Array(2)].map((_, index) => (
                    <React.Fragment key={index}>
                        {testimonials.map((testimonial, i) => (
                            <div className={styles.card} key={`${index}-${i}`}>
                                <p className={styles.text}>&ldquo;{testimonial.text}&rdquo;</p>
                                <div className={styles.author}>
                                    <div className={styles.avatarPlaceholder}>
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div className={styles.authorInfo}>
                                        <span className={styles.name}>{testimonial.name}</span>
                                        <span className={styles.role}>{testimonial.role}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </motion.div>
        </div>
    );
};

export default TestimonialsColumn;
