'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
    Target,
    Users,
    Award,
    Building,
    CheckCircle,
    ArrowRight,
    TrendingUp,
    BookOpen,
    Briefcase,
    Star,
    Zap,
    Shield,
    Heart,
    Globe
} from 'lucide-react';
import styles from './page.module.css';

const stats = [
    { value: '5000+', label: 'Students Placed', icon: <Users size={24} /> },
    { value: '10+', label: 'Years of Excellence', icon: <Award size={24} /> },
    { value: '100+', label: 'Hiring Partners', icon: <Building size={24} /> },
    { value: '95%', label: 'Placement Rate', icon: <TrendingUp size={24} /> },
];

const milestones = [
    { year: '2015', title: 'Founded', description: 'ITROOTS was established with a vision to bridge the IT skills gap in India.' },
    { year: '2017', title: 'First 1000 Students', description: 'Reached the milestone of training 1000+ students from diverse backgrounds.' },
    { year: '2019', title: '50+ Hiring Partners', description: 'Built strong industry partnerships with top tech companies for placements.' },
    { year: '2021', title: 'Online Expansion', description: 'Launched hybrid learning programs to serve students across India.' },
    { year: '2023', title: '5000+ Placements', description: 'Achieved 5000+ successful career transformations across India.' },
    { year: '2024', title: 'AI Integration', description: 'Introduced cutting-edge AI, GenAI programs aligned with future-ready careers.' }
];

const values = [
    {
        icon: <Target size={28} />,
        title: 'Excellence',
        description: 'We strive for excellence in every aspect of our training — from curriculum design to placement support.',
        color: '#0c2d4c',
        bg: 'rgba(12, 45, 76, 0.08)'
    },
    {
        icon: <Heart size={28} />,
        title: 'Student-Centric',
        description: 'Our students\' success is our primary measure of achievement. Every decision is made with learners in mind.',
        color: '#ee9602',
        bg: 'rgba(238, 150, 2, 0.08)'
    },
    {
        icon: <Globe size={28} />,
        title: 'Industry-Aligned',
        description: 'Curriculum designed with direct input from industry experts, keeping pace with the latest technology trends.',
        color: '#0881ec',
        bg: 'rgba(8, 129, 236, 0.08)'
    },
    {
        icon: <Shield size={28} />,
        title: 'Integrity',
        description: 'We maintain transparency and honesty in all our operations, fostering trust with students and partners.',
        color: '#3b9995',
        bg: 'rgba(59, 153, 149, 0.08)'
    },
    {
        icon: <Zap size={28} />,
        title: 'Innovation',
        description: 'Continuously evolving our programs to integrate the latest tools, AI platforms, and learning methodologies.',
        color: '#f5a623',
        bg: 'rgba(245, 166, 35, 0.08)'
    },
    {
        icon: <Briefcase size={28} />,
        title: 'Career Focus',
        description: 'Every module is designed with job-readiness in mind — practical skills that employers actually look for.',
        color: '#5b21b6',
        bg: 'rgba(91, 33, 182, 0.08)'
    },
];

const whyChooseUs = [
    { stat: '100%', label: 'Job Guarantee', desc: 'We guarantee placement or refund — no ifs, no buts.' },
    { stat: '10+', label: 'Years Experience', desc: 'Over a decade of transforming IT careers in India.' },
    { stat: '5-6h', label: 'Daily Practice', desc: 'Intensive hands-on training every day, not just theory.' },
    { stat: 'Real', label: 'Projects', desc: 'Industry-grade projects that make your resume stand out.' },
];

const team = [
    {
        name: 'Rahul Naik',
        role: 'Founder & CEO',
        description: '20+ years in IT education and consulting. Visionary behind ITROOTS\' placement-first approach.',
        initials: 'RN',
        gradient: 'linear-gradient(135deg, #0c2d4c 0%, #1a5f96 100%)'
    },
    {
        name: 'Priya Naik',
        role: 'Director of Training',
        description: 'Former Google engineer and AI specialist. Leads curriculum design and academic excellence.',
        initials: 'PN',
        gradient: 'linear-gradient(135deg, #ee9602 0%, #f5a623 100%)'
    },
    {
        name: 'Vaibhav Patil',
        role: 'Head of Placements',
        description: 'Extensive network in Fortune 500 companies. Has placed 2000+ students at top tech firms.',
        initials: 'VP',
        gradient: 'linear-gradient(135deg, #054151 0%, #3b9995 100%)'
    },
    {
        name: 'Dhiraj Patil',
        role: 'Academic Director',
        description: 'PhD in Computer Science from IIT Hyderabad. Ensures every program meets global standards.',
        initials: 'DP',
        gradient: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)'
    }
];

export default function AboutPage() {
    return (
        <>
            {/* Hero / Banner Section — UNCHANGED */}
            <section className={styles.hero}>
                <div className={styles.container}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1>About ITROOTS</h1>
                        <p>Empowering careers through quality IT education since 2015</p>
                    </motion.div>
                </div>
            </section>

            {/* Stats Strip */}
            <section className={styles.statsStrip}>
                <div className={styles.container}>
<<<<<<< HEAD
                    <div className={styles.missionGrid}>
                        <div className={styles.missionContent}>
                            <div className={styles.missionBox}>
                                <div className={styles.missionTitleRow}>
                                    <div className={styles.missionIcon}>
                                        <Target size={24} />
                                    </div>
                                    <h2>Our Mission</h2>
                                </div>
                                <p>
                                    To transform aspiring professionals into industry-ready tech talent through comprehensive training, hands-on experience, and dedicated placement support. We believe everyone deserves access to quality IT education that leads to meaningful career opportunities.
                                </p>
                            </div>

                            <div className={styles.missionBox}>
                                <div className={styles.missionTitleRow}>
                                    <div className={styles.missionIcon}>
                                        <Eye size={24} />
                                    </div>
                                    <h2>Our Vision</h2>
                                </div>
                                <p>
                                    To be the most trusted IT training institute in India, known for producing job-ready professionals who excel in their careers. We aim to bridge the gap between academic knowledge and industry requirements, creating a skilled workforce for the digital future.
                                </p>
                            </div>
                        </div>

                        <div className={styles.missionImageWrapper}>
                            <img
                                src="/images/mission_vision (2).png"
                                alt="Our Mission and Vision"
                                className={styles.missionImage}
                            />
                        </div>
=======
                    <div className={styles.statsGrid}>
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                className={styles.statItem}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                            >
                                <div className={styles.statIcon}>{stat.icon}</div>
                                <div className={styles.statValue}>{stat.value}</div>
                                <div className={styles.statLabel}>{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Who Are We */}
            <section className={styles.whoWeAreSection}>
                <div className={styles.container}>
                    <div className={styles.whoWeAreGrid}>
                        <motion.div
                            className={styles.whoWeAreImage}
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className={styles.imageFrame}>
                                <img
                                    src="/images/about/who_are_we.png"
                                    alt="ITROOTS Team"
                                    className={styles.illustration}
                                />
                                <div className={styles.imageBadge}>
                                    <Star size={16} fill="#ee9602" color="#ee9602" />
                                    <span>Trusted by 5000+ Students</span>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            className={styles.whoWeAreText}
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <span className={styles.eyebrow}>Who Are We</span>
                            <h2>We Are Passionate About Quality IT Education</h2>
                            <p>
                                ITROOTS was established in 2015 with a bold vision — to bridge the IT skills gap and create industry-ready professionals. We believe everyone deserves access to quality IT education that leads to meaningful, high-paying career opportunities.
                            </p>
                            <ul className={styles.checkList}>
                                <li>
                                    <CheckCircle size={20} className={styles.checkIcon} fill="#0c2d4c" color="white" />
                                    <span>Transform aspiring professionals into industry-ready tech talent through comprehensive training.</span>
                                </li>
                                <li>
                                    <CheckCircle size={20} className={styles.checkIcon} fill="#0c2d4c" color="white" />
                                    <span>Provide hands-on experience and dedicated 360° placement support from day one.</span>
                                </li>
                                <li>
                                    <CheckCircle size={20} className={styles.checkIcon} fill="#0c2d4c" color="white" />
                                    <span>Creating a highly skilled workforce ready for the AI-driven digital economy.</span>
                                </li>
                                <li>
                                    <CheckCircle size={20} className={styles.checkIcon} fill="#0c2d4c" color="white" />
                                    <span>India's most trusted IT training institute — bridging academics and industry since 2015.</span>
                                </li>
                            </ul>
                            <Link href="/courses" className={styles.exploreBtn}>
                                Explore Our Courses
                                <ArrowRight size={18} />
                            </Link>
                        </motion.div>
>>>>>>> b8275b344df0c43dcb4d2fcd30dcfe4534e0583c
                    </div>
                </div>
            </section>

            {/* Why Choose Us — Dark Blue Ribbon */}
            <section className={styles.whySection}>
                <div className={styles.container}>
                    <motion.div
                        className={styles.whyHeader}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className={styles.eyebrowLight}>Why Choose ITROOTS</span>
                        <h2>The ITROOTS Difference</h2>
                        <p>We don't just train — we transform. Here's what sets us apart from every other IT institute.</p>
                    </motion.div>
                    <div className={styles.whyGrid}>
                        {whyChooseUs.map((item, i) => (
                            <motion.div
                                key={i}
                                className={styles.whyCard}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                            >
                                <div className={styles.whyStat}>{item.stat}</div>
                                <div className={styles.whyLabel}>{item.label}</div>
                                <p className={styles.whyDesc}>{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className={styles.valuesSection}>
                <div className={styles.container}>
                    <motion.div
                        className={styles.sectionHeader}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className={styles.eyebrow}>What Drives Us</span>
                        <h2>Our Core Values</h2>
                        <p>The principles that guide every decision, every program, and every interaction at ITROOTS.</p>
                    </motion.div>
                    <div className={styles.valuesGrid}>
                        {values.map((value, i) => (
                            <motion.div
                                key={i}
                                className={styles.valueCard}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                            >
                                <div className={styles.valueIconWrap} style={{ background: value.bg, color: value.color }}>
                                    {value.icon}
                                </div>
                                <h3>{value.title}</h3>
                                <p>{value.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Journey — Timeline */}
            <section className={styles.timelineSection}>
                <div className={styles.container}>
                    <motion.div
                        className={styles.sectionHeader}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className={styles.eyebrow}>Our Story</span>
                        <h2>Our Journey So Far</h2>
                        <p>A decade of growth, milestones, and thousands of career transformations.</p>
                    </motion.div>
                    <div className={styles.timeline}>
                        {milestones.map((m, i) => (
                            <motion.div
                                key={i}
                                className={styles.timelineItem}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                            >
                                <div className={styles.timelineYear}>{m.year}</div>
                                <div className={styles.timelineDot} />
                                <div className={styles.timelineCard}>
                                    <h3>{m.title}</h3>
                                    <p>{m.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Leadership Team */}
            <section className={styles.teamSection}>
                <div className={styles.container}>
                    <motion.div
                        className={styles.sectionHeader}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className={styles.eyebrow}>Meet the Team</span>
                        <h2>The Leadership Behind ITROOTS</h2>
                        <p>Experienced educators and industry veterans driving our mission every day.</p>
                    </motion.div>
                    <div className={styles.teamGrid}>
                        {team.map((member, i) => (
                            <motion.div
                                key={i}
                                className={styles.teamCard}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                            >
                                <div className={styles.teamAvatar} style={{ background: member.gradient }}>
                                    {member.initials}
                                </div>
                                <h3>{member.name}</h3>
                                <span className={styles.teamRole}>{member.role}</span>
                                <p>{member.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.ctaSection}>
                <div className={styles.container}>
                    <div className={styles.ctaBox}>
                        <motion.div
                            className={styles.ctaContent}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className={styles.eyebrowLight}>Ready to Begin?</span>
                            <h2>Transform Your Career with ITROOTS</h2>
                            <p>Join thousands of successful IT professionals who started their journey with us. Your dream career is just one step away.</p>
                            <div className={styles.ctaButtons}>
                                <Link href="/courses" className={styles.ctaPrimary}>
                                    Explore Courses
                                    <ArrowRight size={18} />
                                </Link>
                                <Link href="/contact" className={styles.ctaSecondary}>
                                    Talk to Us
                                </Link>
                            </div>
                        </motion.div>
                        <div className={styles.ctaImageWrap}>
                            <Image
                                src="/images/projects/data-science-with-ai/jounery2.png"
                                alt="Career Journey"
                                width={420}
                                height={420}
                                className={styles.ctaImage}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
