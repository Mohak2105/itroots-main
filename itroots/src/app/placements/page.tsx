'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
    Users,
    Building2,
    TrendingUp,
    Award,
    ArrowRight,
    Star,
    Briefcase
} from 'lucide-react';
import { testimonials, stats } from '@/data/testimonials';
import styles from './page.module.css';

const companyLogos = Array.from({ length: 22 }, (_, index) => `${index + 1}.png`);

export default function PlacementsPage() {
    return (
        <>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.container}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1>Our Placements</h1>
                        <p>Transforming careers and creating success stories since 2015</p>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className={styles.statsSection}>
                <div className={styles.container}>
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIconBox}>
                                <Users size={28} />
                            </div>
                            <div className={styles.statValue}>{stats.studentsPlaced.toLocaleString('en-IN')}+</div>
                            <div className={styles.statLabel}>Students Placed</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIconBox}>
                                <Building2 size={28} />
                            </div>
                            <div className={styles.statValue}>{stats.hiringPartners}+</div>
                            <div className={styles.statLabel}>Hiring Partners</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIconBox}>
                                <Award size={28} />
                            </div>
                            <div className={styles.statValue}>{stats.placementRate}%</div>
                            <div className={styles.statLabel}>Placement Rate</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIconBox}>
                                <TrendingUp size={28} />
                            </div>
                            <div className={styles.statValue}>{stats.averageSalaryHike}%</div>
                            <div className={styles.statLabel}>Avg. Salary Hike</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Success Stories */}
            <section className={styles.storiesSection}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <h2>Success Stories</h2>
                        <p>Hear from our graduates who transformed their careers with ITROOTS</p>
                    </div>
                    <div className={styles.storiesGrid}>
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={testimonial.id}
                                className={styles.storyCard}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                            >
                                <div className={styles.storyHeader}>
                                    <div className={styles.avatar}>
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div className={styles.authorInfo}>
                                        <strong>{testimonial.name}</strong>
                                        <span>{testimonial.course}</span>
                                    </div>
                                </div>
                                <div className={styles.rating}>
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} size={14} fill="#ee9602" color="#ee9602" />
                                    ))}
                                </div>
                                <p>&ldquo;{testimonial.testimonial}&rdquo;</p>
                                <div className={styles.placement}>
                                    <Briefcase size={16} />
                                    <span>{testimonial.role} at <strong>{testimonial.company}</strong></span>
                                </div>
                                {testimonial.salary && (
                                    <div className={styles.salary}>
                                        Package: <strong>{testimonial.salary}</strong>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Hiring Partners */}
            <section className={styles.partnersSection}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <h2>Our Hiring Partners</h2>
                        <p>Industry leaders who trust our talent pool</p>
                    </div>
                    <div className={styles.partnersGrid}>
                        {companyLogos.map((logo, index) => (
                            <motion.div
                                key={logo}
                                className={styles.partnerCard}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <Image
                                    src={`/company%20logos/${logo}`}
                                    alt={`Company logo ${index + 1}`}
                                    width={210}
                                    height={80}
                                    sizes="210px"
                                    quality={100}
                                    unoptimized
                                    className={styles.partnerLogoImage}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.ctaSection}>
                <div className={styles.container}>
                    <div className={`${styles.ctaBox} ${styles.ctaBoxDS}`} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #172554 50%, #1e3a8a 100%)' }}>
                        <div className={styles.ctaContent}>
                            <h2>Ready to Start Your Journey?</h2>
                            <p>Join our next batch and take the first step towards your dream career</p>
                            <div className={styles.ctaButtons}>
                                <Link href="/contact" className={styles.ctaBtnPrimary}>
                                    Enroll Now
                                    <ArrowRight size={18} />
                                </Link>
                                <Link href="/contact" className={styles.ctaBtnOutline}>
                                    Request Callback
                                </Link>
                            </div>
                        </div>

                        <div className={styles.ctaImageWrapper}>
                            <Image
                                src="/images/projects/data-science-with-ai/jounery2.png"
                                alt="Your Learning Journey"
                                width={500}
                                height={500}
                                className={styles.ctaImage}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
