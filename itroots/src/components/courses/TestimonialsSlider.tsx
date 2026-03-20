'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './TestimonialsSlider.module.css';

interface Testimonial {
    id: number;
    name: string;
    testimonial: string;
    role: string;
    company: string;
    rating: number;
    salary?: string;
    course: string;
}

interface TestimonialsSliderProps {
    testimonials: Testimonial[];
    gradient: string;
    isLight?: boolean;
}

export const TestimonialsSlider: React.FC<TestimonialsSliderProps> = ({ testimonials, gradient, isLight }) => {
    // --- Manual Carousel Logic ---
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    // --- Desktop Marquee Logic ---
    // Duplicate array for seamless infinite scroll
    const marqueeTestimonials = [...testimonials, ...testimonials];

    return (
        <div className={styles.container}>
            {/* --- Desktop View: Auto-Scroll Marquee --- */}
            <div className={styles.desktopView}>
                <div className={styles.marqueeTrack}>
                    {marqueeTestimonials.map((testimonial, index) => (
                        <div key={`desk-${index}`} className={`${styles.testimonialCard}${isLight ? ` ${styles.lightCard}` : ''}`} style={isLight ? {} : { background: gradient }}>
                            <div className={styles.testimonialHeader}>
                                <div className={styles.testimonialProfile}>
                                    <div className={styles.testimonialAvatar}>
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div className={styles.testimonialInfo}>
                                        <strong>{testimonial.name}</strong>
                                    </div>
                                </div>
                                <Image
                                    src="/images/google-icon.svg"
                                    alt="Google Reviews"
                                    width={18}
                                    height={18}
                                    unoptimized
                                    className={styles.testimonialGoogle}
                                />
                            </div>
                            <div className={styles.testimonialRating}>
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} size={14} fill="#ee9602" color="#ee9602" />
                                ))}
                            </div>
                            <p className={styles.testimonialText}>{testimonial.testimonial}</p>
                            <p className={styles.testimonialRole}>{testimonial.role} at {testimonial.company}</p>
                            {testimonial.salary && (
                                <div className={styles.testimonialSalary}>
                                    Package: {testimonial.salary}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- Mobile View: Manual Carousel --- */}
            <div className={styles.mobileView}>
                <div className={styles.mobileCarousel}>
                    <div className={`${styles.testimonialCard}${isLight ? ` ${styles.lightCard}` : ''}`} style={isLight ? {} : { background: gradient }}>
                        {/* Display Current Testimonial */}
                        <div className={styles.testimonialHeader}>
                            <div className={styles.testimonialProfile}>
                                <div className={styles.testimonialAvatar}>
                                    {testimonials[currentIndex].name.charAt(0)}
                                </div>
                                <div className={styles.testimonialInfo}>
                                    <strong>{testimonials[currentIndex].name}</strong>
                                </div>
                            </div>
                            <Image
                                src="/images/google-icon.svg"
                                alt="Google Reviews"
                                width={18}
                                height={18}
                                unoptimized
                                className={styles.testimonialGoogle}
                            />
                        </div>
                        <div className={styles.testimonialRating}>
                            {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                                <Star key={i} size={14} fill="#ee9602" color="#ee9602" />
                            ))}
                        </div>
                        <p className={styles.testimonialText}>{testimonials[currentIndex].testimonial}</p>
                        <p className={styles.testimonialRole}>{testimonials[currentIndex].role} at {testimonials[currentIndex].company}</p>
                        {testimonials[currentIndex].salary && (
                            <div className={styles.testimonialSalary}>
                                Package: {testimonials[currentIndex].salary}
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Arrows */}
                <div className={styles.carouselControls}>
                    <button onClick={handlePrev} className={styles.navButton} aria-label="Previous Testimonial">
                        <ChevronLeft size={24} />
                    </button>
                    {/* Optional: Indicator dots or counter could go here */}
                    {/* <span>{currentIndex + 1} / {testimonials.length}</span> */}
                    <button onClick={handleNext} className={styles.navButton} aria-label="Next Testimonial">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};
