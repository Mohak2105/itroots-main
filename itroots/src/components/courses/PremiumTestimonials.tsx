'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';
import styles from './PremiumTestimonials.module.css';

interface Testimonial {
    id: number;
    name: string;
    testimonial: string;
    role: string;
    company: string;
    rating: number;
    salary?: string;
    course: string;
    date?: string;
}

interface PremiumTestimonialsProps {
    testimonials: Testimonial[];
}

export const PremiumTestimonials: React.FC<PremiumTestimonialsProps> = ({ testimonials }) => {
    // We'll use the first 3 testimonials for the staggered right side
    const displayTestimonials = testimonials.slice(0, 3);

    // Colors for avatars to match the varied look in the image
    const avatarColors = ['#008080', '#0a4223', '#4a2c2a', '#1e3a8a'];

    return (
        <section className={styles.premiumSection}>
            <div className={styles.container}>
                <div className={styles.contentGrid}>
                    {/* Left Side: Content & stats */}
                    <div className={styles.leftContent}>
                        <div className={styles.tag}>Success Stories</div>
                        <h2 className={styles.title}>
                            Independently <span className={styles.highlight}>ITROOTS</span>.<br />
                            Refreshingly <span className={styles.highlight}>Personal</span>.
                        </h2>
                        <p className={styles.description}>
                            Join 10,000+ graduates who have transformed their careers with our
                            industry-leading curriculum and personal mentorship approach.
                            We don't just teach; we build careers.
                        </p>

                    </div>

                    {/* Right Side: Vertical Scrolling List */}
                    <div className={styles.rightContent}>
                        <div className={styles.scrollWrapper}>
                            <div className={styles.scrollTrack}>
                                {[...testimonials, ...testimonials].map((t, index) => {
                                    // Simulated relative date
                                    const daysAgo = (index % 15) + 3;
                                    const avatarColor = avatarColors[index % avatarColors.length];

                                    return (
                                        <div
                                            key={`${t.id}-${index}`}
                                            className={styles.testimonialCard}
                                        >
                                            <div className={styles.cardHeader}>
                                                <div className={styles.author}>
                                                    <div
                                                        className={styles.avatar}
                                                        style={{ backgroundColor: avatarColor }}
                                                    >
                                                        {t.name.charAt(0)}
                                                    </div>
                                                    <div className={styles.authorInfo}>
                                                        <span className={styles.name}>{t.name}</span>
                                                    </div>
                                                </div>
                                                <div className={styles.ratingBox}>
                                                    <div className={styles.stars}>
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={14}
                                                                fill="#facc15"
                                                                stroke="#facc15"
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className={styles.date}>{daysAgo} days ago</span>
                                                </div>
                                            </div>
                                            <div className={styles.cardBody}>
                                                <p className={styles.text}>{t.testimonial}</p>
                                                <button className={styles.readMore}>Read more</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
