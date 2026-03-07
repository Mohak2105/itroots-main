'use client';

import React from 'react';
import Image from 'next/image';
import styles from './MentorsSlider.module.css';

interface Mentor {
    name: string;
    role: string;
    company: string;
    image?: string;
}

interface MentorsSliderProps {
    mentors: Mentor[];
}

export const MentorsSlider: React.FC<MentorsSliderProps> = ({ mentors }) => {
    // Duplicate the mentors array for seamless looping animation
    const displayedMentors = [...mentors, ...mentors];

    return (
        <div className={styles.mentorsContainer}>
            {/* Desktop Grid View */}
            <div className={styles.desktopGrid}>
                {mentors.map((mentor, index) => (
                    <div key={`desktop-${index}`} className={styles.mentorCard}>
                        {mentor.image ? (
                            <div className={styles.mentorImage} style={{ backgroundImage: `url(${mentor.image})` }}></div>
                        ) : (
                            <div className={styles.mentorImagePlaceholder}>
                                {mentor.name.split(' ').map(n => n[0]).join('')}
                            </div>
                        )}
                        <div className={styles.mentorInfo}>
                            <h3>{mentor.name}</h3>
                            <p className={styles.mentorRole}>{mentor.role}</p>
                            <p className={styles.mentorCompany}>{mentor.company}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile Auto-Sliding View */}
            <div className={styles.mobileSliderContainer}>
                <div className={styles.sliderTrack}>
                    {displayedMentors.map((mentor, index) => (
                        <div key={`mobile-${index}`} className={styles.mentorCard}>
                            {mentor.image ? (
                                <div className={styles.mentorImage} style={{ backgroundImage: `url(${mentor.image})` }}></div>
                            ) : (
                                <div className={styles.mentorImagePlaceholder}>
                                    {mentor.name.split(' ').map(n => n[0]).join('')}
                                </div>
                            )}
                            <div className={styles.mentorInfo}>
                                <h3>{mentor.name}</h3>
                                <p className={styles.mentorRole}>{mentor.role}</p>
                                <p className={styles.mentorCompany}>{mentor.company}</p>
                            </div>
                        </div>
                    ))}
                </div>
                {/* No smoke effect as requested */}
            </div>
            <style jsx global>{`
                /* Ensure animations work properly by targeting them specifically if needed */
                @keyframes scroll {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%); /* Half because we duplicated the array exactly once */
                    }
                }
            `}</style>
        </div>
    );
};
