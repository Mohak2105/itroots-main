'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CustomSelect from '@/components/ui/CustomSelect/CustomSelect';
import {
    GraduationCap,
    Target,
    CheckCircle,
    ArrowRight,
    Mail,
    Phone,
    MapPin,
    Award,
    Zap,
    MessageSquarePlus,
    Check,
    Clock3,
    UserCheck
} from 'lucide-react';
import { ENDPOINTS } from '@/config/api';
import styles from './page.module.css';

const benefits = [
    {
        icon: <GraduationCap size={28} />,
        title: 'Industry-Ready Talent',
        description: 'Our graduates are trained on latest technologies and real-world projects.'
    },
    {
        icon: <Target size={28} />,
        title: 'Pre-Screened Candidates',
        description: 'Save time with candidates who have been thoroughly assessed and trained.'
    },
    {
        icon: <Award size={28} />,
        title: 'Certified Professionals',
        description: 'All candidates come with recognized industry certifications.'
    },
    {
        icon: <Zap size={28} />,
        title: 'Quick Onboarding',
        description: 'Minimal training required - hit the ground running from day one.'
    }
];

const skills = [
    'Data Science', 'Machine Learning', 'Python', 'Java', 'Spring Boot',
    'Cyber Security', 'Cloud Computing', 'React', 'Angular', '.NET',
    'SQL', 'Power BI', 'Tableau', 'Selenium', 'API Testing'
];

const hiringProcess = [
    { step: 1, title: 'Share Requirements', description: 'Tell us about your hiring needs and job requirements' },
    { step: 2, title: 'Get Matched Profiles', description: 'We share pre-screened candidates matching your criteria' },
    { step: 3, title: 'Interview & Select', description: 'Conduct interviews and select the best fit candidates' },
    { step: 4, title: 'Onboard', description: 'Seamless onboarding support for selected candidates' }
];

const hiringVolumeOptions = [
    { value: '1-5 positions', label: '1-5 positions' },
    { value: '6-20 positions', label: '6-20 positions' },
    { value: '21-50 positions', label: '21-50 positions' },
    { value: '50+ positions', label: '50+ positions' }
];

const experienceLevelOptions = [
    { value: 'Entry level (0-2 years)', label: 'Entry level (0-2 years)' },
    { value: 'Mid level (2-5 years)', label: 'Mid level (2-5 years)' },
    { value: 'Mixed levels', label: 'Mixed levels' }
];

const roleTracks = [
    {
        title: 'Data & AI',
        roles: ['Data Analyst', 'Data Scientist', 'ML Engineer', 'Power BI Developer']
    },
    {
        title: 'Software Engineering',
        roles: ['Java Developer', '.NET Developer', 'Full Stack Developer', 'Backend Engineer']
    },
    {
        title: 'Quality & Security',
        roles: ['QA Engineer', 'Automation Tester', 'Cyber Security Analyst', 'SOC Analyst']
    }
];

const recruiterFaqs = [
    {
        question: 'How quickly can we receive candidate profiles?',
        answer: 'Most requirements receive the first shortlist within 48-72 business hours, depending on role complexity.'
    },
    {
        question: 'Do you support bulk hiring drives?',
        answer: 'Yes. We support both niche hiring and high-volume drives with dedicated SPOC support and interview scheduling.'
    },
    {
        question: 'Can we define our own screening criteria?',
        answer: 'Absolutely. We align with your hiring rubric for technical skills, communication, and role-fit before sharing profiles.'
    },
    {
        question: 'What locations are candidates available for?',
        answer: 'Candidates are available for on-site, hybrid, and remote opportunities across major Indian cities.'
    }
];

const viewPortOptions = { once: true, amount: 0.2 };

const sectionStagger = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.05
        }
    }
};

const fastStagger = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.02
        }
    }
};

const fadeUpItem = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: 'easeOut' as const }
    }
};

const fadeScaleItem = {
    hidden: { opacity: 0, scale: 0.94 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.35, ease: 'easeOut' as const }
    }
};

const slideInItem = {
    hidden: { opacity: 0, x: -24 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.45, ease: 'easeOut' as const }
    }
};

export default function HireFromUsPage() {
    const [openFaq, setOpenFaq] = useState(-1);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [hiringVolume, setHiringVolume] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('');

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);

        const data = {
            company: String(formData.get('company') ?? ''),
            name: String(formData.get('name') ?? ''),
            email: String(formData.get('email') ?? ''),
            phone: String(formData.get('phone') ?? ''),
            roles: String(formData.get('roles') ?? ''),
            hiringVolume: String(formData.get('hiringVolume') ?? ''),
            experienceLevel: String(formData.get('experienceLevel') ?? ''),
            message: String(formData.get('message') ?? ''),
        };

        try {
            const res = await fetch(ENDPOINTS.PUBLIC.HIRE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                form.reset();
                setHiringVolume('');
                setExperienceLevel('');
                setIsSubmitted(true);
            } else {
                alert("Failed to submit inquiry. Please try again later.");
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert("Connection error. Please check if the server is running.");
        }
    };

    return (
        <>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.container}>
                    <motion.div
                        className={styles.heroContent}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                    >
                        <h1>Hire From Us</h1>
                        <p>
                            Access a pool of 5000+ trained, certified, and job-ready tech professionals.
                            Transform your hiring with our industry-ready talent.
                        </p>
                        <motion.div
                            className={styles.heroStats}
                            variants={sectionStagger}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div className={styles.heroStat} variants={fadeUpItem}>
                                <strong>5000+</strong>
                                <span>Trained Professionals</span>
                            </motion.div>
                            <motion.div className={styles.heroStat} variants={fadeUpItem}>
                                <strong>95%</strong>
                                <span>Hire Success Rate</span>
                            </motion.div>
                            <motion.div className={styles.heroStat} variants={fadeUpItem}>
                                <strong>150+</strong>
                                <span>Partner Companies</span>
                            </motion.div>
                        </motion.div>
                        <Link href="#contact-form" className={styles.heroBtn}>
                            Partner With Us
                            <ArrowRight size={18} />
                        </Link>
                        <div className={styles.heroActions}>


                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className={styles.benefitsSection}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <h2>Why Hire From ITROOTS?</h2>
                        <p>Get access to talent that&apos;s trained on the skills you need</p>
                    </div>
                    <motion.div
                        className={styles.benefitsGrid}
                        variants={sectionStagger}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewPortOptions}
                    >
                        {benefits.map((benefit) => (
                            <motion.div
                                key={benefit.title}
                                className={styles.benefitCard}
                                variants={fadeUpItem}
                                whileHover={{ y: -6, scale: 1.01 }}
                                transition={{ duration: 0.22 }}
                            >
                                <div className={styles.benefitIcon}>{benefit.icon}</div>
                                <h3>{benefit.title}</h3>
                                <p>{benefit.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Skills Section */}
            <section className={styles.skillsSection}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <h2>Available Skills</h2>
                        <p>Our candidates are trained in the following technologies</p>
                    </div>
                    <motion.div
                        className={styles.skillsGrid}
                        variants={fastStagger}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewPortOptions}
                    >
                        {skills.map((skill) => (
                            <motion.div
                                key={skill}
                                className={styles.skillTag}
                                variants={fadeScaleItem}
                                whileHover={{ y: -2, scale: 1.04 }}
                                transition={{ duration: 0.18 }}
                            >
                                <CheckCircle size={16} />
                                {skill}
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Roles Section */}
            <section className={styles.rolesSection}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <h2>Roles We Supply</h2>
                        <p>Hire role-ready candidates across high-demand IT tracks</p>
                    </div>
                    <motion.div
                        className={styles.rolesGrid}
                        variants={sectionStagger}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewPortOptions}
                    >
                        {roleTracks.map((track) => (
                            <motion.div
                                key={track.title}
                                className={styles.roleCard}
                                variants={fadeUpItem}
                                whileHover={{ y: -4 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h3>{track.title}</h3>
                                <ul>
                                    {track.roles.map((role) => (
                                        <li key={role}>
                                            <Check size={15} />
                                            {role}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Hiring Process */}
            <section className={styles.processSection}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <h2>Simple Hiring Process</h2>
                        <p>Get the right talent in 4 easy steps</p>
                    </div>
                    <motion.div
                        className={styles.processGrid}
                        variants={sectionStagger}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewPortOptions}
                    >
                        {hiringProcess.map((step) => (
                            <motion.div
                                key={step.step}
                                className={styles.processCard}
                                variants={slideInItem}
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className={styles.stepNumber}>{step.step}</div>
                                <div className={styles.stepContent}>
                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Contact Form */}
            <section id="contact-form" className={styles.contactSection}>
                <div className={styles.container}>
                    <motion.div
                        className={styles.contactGrid}
                        variants={sectionStagger}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewPortOptions}
                    >
                        <motion.div className={styles.contactInfo} variants={fadeUpItem}>
                            <h2>Partner With Us</h2>
                            <p>
                                Fill out the form and our recruitment team will get in touch with you
                                within 24 hours to discuss your hiring needs.
                            </p>
                            <div className={styles.contactDetails}>
                                <div className={styles.contactItem}>
                                    <Phone size={20} />
                                    <span>+91 88772 02122</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <Mail size={20} />
                                    <span>info@itroots.co.in</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <MapPin size={20} />
                                    <span>Office No. 1319, 2nd floor, Rainbow Plaza, Jangali Maharaj Road, opposite Modern High School, Deccan, Shivajinagar, Pune 411005</span>
                                </div>
                            </div>

                        </motion.div>
                        <motion.form className={styles.form} onSubmit={handleSubmit} variants={fadeUpItem}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="company">Company Name *</label>
                                    <input type="text" id="company" name="company" required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="name">Your Name *</label>
                                    <input type="text" id="name" name="name" required />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="email">Email *</label>
                                    <input type="email" id="email" name="email" required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="phone">Phone *</label>
                                    <input type="tel" id="phone" name="phone" required />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="roles">Roles You&apos;re Hiring For</label>
                                <input type="text" id="roles" name="roles" />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Hiring Volume *</label>
                                    <CustomSelect
                                        name="hiringVolume"
                                        required
                                        placeholder="Select hiring volume"
                                        options={hiringVolumeOptions}
                                        value={hiringVolume}
                                        onChange={setHiringVolume}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Experience Level *</label>
                                    <CustomSelect
                                        name="experienceLevel"
                                        required
                                        placeholder="Select level"
                                        options={experienceLevelOptions}
                                        value={experienceLevel}
                                        onChange={setExperienceLevel}
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="message">Additional Details</label>
                                <textarea id="message" name="message" rows={4}></textarea>
                            </div>
                            <button type="submit" className={styles.submitBtn}>
                                Submit Inquiry
                                <ArrowRight size={18} />
                            </button>
                            {isSubmitted && (
                                <p className={styles.successMessage}>
                                    <CheckCircle size={16} />
                                    Your inquiry has been submitted successfully. Our team will contact you shortly!
                                </p>
                            )}
                        </motion.form>
                    </motion.div>
                </div>
            </section>


        </>
    );
}
