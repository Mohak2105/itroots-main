'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
    CheckCircle2,
    ArrowRight,
    Award,
    PlayCircle,
    Target,
    Zap,
    Users,
    Briefcase,
    ShieldCheck,
    Globe
} from 'lucide-react';
import styles from './page.module.css';

const stats = [
    { value: '5K+', label: 'Students Placed', color: 'orange' },
    { value: '10+', label: 'Years Experience', color: 'blue' },
    { value: '100+', label: 'Hiring Partners', color: 'teal' },
    { value: '95%', label: 'Placement Rate', color: 'purple' }
];

const features = [
    'Industry-aligned Curriculum designed by experts',
    '100% Placement Assistance & Dedicated Support',
    'Real-world Projects & Hands-on Training',
    'Modern Infrastructure & High-tech Labs'
];

const values = [
    {
        title: 'Innovation First',
        desc: 'We stay ahead of the curve, constantly updating our curriculum to match the latest tech trends like AI & Cloud.',
        icon: <Zap size={32} />,
        color: 'var(--accent-orange)',
        bg: 'rgba(238, 150, 2, 0.1)'
    },
    {
        title: 'Career Focus',
        desc: 'Every module is designed with one goal: making our students highly employable in top-tier tech companies.',
        icon: <Target size={32} />,
        color: 'var(--primary-blue)',
        bg: 'rgba(12, 45, 76, 0.1)'
    },
    {
        title: 'Global Standards',
        desc: 'Our teaching methodologies meet international standards, ensuring our students can compete on a global scale.',
        icon: <Globe size={32} />,
        color: 'var(--teal-accent)',
        bg: 'rgba(5, 65, 81, 0.1)'
    },
    {
        title: 'Integrity',
        desc: 'We believe in transparent commitments. When we promise support, we deliver it unconditionally.',
        icon: <ShieldCheck size={32} />,
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.1)'
    }
];

const team = [
    { name: 'Rahul Naik', role: 'Founder & CEO', img: '/images/about/team-placeholder-1.jpg' },
    { name: 'Priya Naik', role: 'Director of Training', img: '/images/about/team-placeholder-2.jpg' },
    { name: 'Vaibhav Patil', role: 'Head of Placements', img: '/images/about/team-placeholder-3.jpg' },
    { name: 'Dhiraj Patil', role: 'Academic Director', img: '/images/about/team-placeholder-4.jpg' }
];

export default function AboutNewPage() {
    return (
        <main className={styles.main}>
            {/* 1. Hero Section */}
            <section className={styles.heroSection}>
                <div className={styles.heroShape1}></div>
                <div className={styles.heroShape2}></div>
                <div className={styles.container}>
                    <div className={styles.heroContent}>
                        <motion.span
                            className={styles.heroBadge}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            Get To Know Us Better
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            We build the next generation of <span>Tech Innovators</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            ITROOTS is India's premium tech education institute, bridging the gap between academic learning and industry demands since 2015.
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* 2. Overlapping Stats */}
            <section className={styles.statsSection}>
                <div className={styles.container}>
                    <div className={styles.statsWrapper}>
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                className={`${styles.statCard} ${styles[stat.color]}`}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                            >
                                <h2>{stat.value}</h2>
                                <p>{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. About Us Split Section */}
            <section className={styles.aboutSplitSection}>
                <div className={styles.container}>
                    <div className={styles.splitGrid}>
                        <motion.div
                            className={styles.splitImages}
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className={styles.imageMain}>
                                <Image src="/images/Offfice.jpg" alt="Office" width={500} height={600} className={styles.coverImg} />
                                <div className={styles.playButton}>
                                    <PlayCircle size={48} />
                                </div>
                            </div>
                            <div className={styles.imageFloat}>
                                <div className={styles.floatCard}>
                                    <Award size={40} color="var(--accent-orange)" />
                                    <div className={styles.floatText}>
                                        <h4>Award Winning</h4>
                                        <p>Education Institute</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className={styles.splitContent}
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <span className={styles.sectionEyebrow}>About ITROOTS</span>
                            <h2>Transforming Lives Through <span>Expert Training</span></h2>
                            <p className={styles.leadText}>
                                We don't just teach code. We engineer careers. Our philosophy is rooted in hands-on, practical learning that prepares you for real-world challenges.
                            </p>
                            <p className={styles.subText}>
                                Over the last decade, we have partnered with hundreds of tech companies to understand their exact hiring needs. This allows us to craft a curriculum that makes our students instantly employable.
                            </p>

                            <ul className={styles.featuresList}>
                                {features.map((feature, i) => (
                                    <li key={i}>
                                        <div className={styles.checkIcon}>
                                            <CheckCircle2 size={18} />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Link href="/courses" className={styles.primaryBtn}>
                                Discover Our Programs <ArrowRight size={18} />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 4. Core Values Grid */}
            <section className={styles.valuesSection}>
                <div className={styles.container}>
                    <div className={styles.sectionHeaderCenter}>
                        <span className={styles.sectionEyebrow}>What Drives Us</span>
                        <h2>Our Core Philosophy</h2>
                        <p>The foundational principles that guide our teaching and operations.</p>
                    </div>

                    <div className={styles.valuesGrid}>
                        {values.map((v, i) => (
                            <motion.div
                                key={i}
                                className={styles.valueCard}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                            >
                                <div className={styles.valueIcon} style={{ background: v.bg, color: v.color }}>
                                    {v.icon}
                                </div>
                                <h3>{v.title}</h3>
                                <p>{v.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. Leadership / Team Section */}
            <section className={styles.teamSection}>
                <div className={styles.container}>
                    <div className={styles.teamHeaderRow}>
                        <div className={styles.teamTitleArea}>
                            <span className={styles.sectionEyebrow}>The Brains</span>
                            <h2>Meet Our Leaders</h2>
                        </div>
                        <p className={styles.teamDesc}>
                            Our seasoned leadership team brings decades of combined experience from academia and the tech industry.
                        </p>
                    </div>

                    <div className={styles.teamGrid}>
                        {team.map((t, i) => (
                            <motion.div
                                key={i}
                                className={styles.teamMemberCard}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                            >
                                {/* Using initials placeholder since actual photos aren't confirmed */}
                                <div className={styles.memberAvatarDrop}>
                                    <div className={styles.initialsAvatar}>
                                        {t.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                </div>
                                <div className={styles.memberInfo}>
                                    <h3>{t.name}</h3>
                                    <span>{t.role}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. CTA / Bottom Banner */}
            <section className={styles.ctaBanner}>
                <div className={styles.ctaBackdrop}>
                    <div className={styles.ctaPattern}></div>
                </div>
                <div className={styles.container}>
                    <motion.div
                        className={styles.ctaContentWrapper}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2>Ready to launch your IT career?</h2>
                        <p>Join the 5000+ graduates who transformed their lives at ITROOTS.</p>
                        <div className={styles.ctaButtons}>
                            <Link href="/courses" className={styles.btnSolid}>
                                View Courses
                            </Link>
                            <Link href="/contact" className={styles.btnOutline}>
                                Contact Advisor
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
