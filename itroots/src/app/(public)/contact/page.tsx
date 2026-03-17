'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    CalendarClock,
    CheckCircle2,
    ChevronDown,
    Clock3,
    Headset,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    Send,
    ShieldCheck,
    Star,
    UserRoundCheck,
} from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect/CustomSelect';
import { courses } from '@/data/courses';
import { ENDPOINTS } from '@/config/api';
import styles from './page.module.css';

const courseOptions = courses.map((course) => ({
    value: course.slug,
    label: course.shortTitle,
}));

const contactCards = [
    {
        icon: <MapPin size={22} />,
        label: 'Visit Campus',
        value: 'Office No. 205 and 206, Rainbow Plaza, Jangali Maharaj Road, Deccan, Pune 411005',
        accent: '#0c2d4c',
        tone: 'rgba(12, 45, 76, 0.12)',
        action: null,
    },
    {
        icon: <Phone size={22} />,
        label: 'Call Admissions',
        value: '+91 40 1234 5678',
        sub: '+91 98765 43210',
        accent: '#ee9602',
        tone: 'rgba(238, 150, 2, 0.14)',
        action: 'tel:+914012345678',
    },
    {
        icon: <Mail size={22} />,
        label: 'Write To Us',
        value: 'admissions@itroots.in',
        sub: 'career@itroots.in',
        accent: '#0881ec',
        tone: 'rgba(8, 129, 236, 0.14)',
        action: 'mailto:admissions@itroots.in',
    },
    {
        icon: <Clock3 size={22} />,
        label: 'Working Hours',
        value: 'Mon - Sat: 10:00 AM - 7:00 PM',
        sub: 'Sunday: Closed',
        accent: '#3b9995',
        tone: 'rgba(59, 153, 149, 0.14)',
        action: null,
    },
];

const processSteps = [
    {
        title: 'Share your goals',
        desc: 'Tell us your background and what role you want to target.',
    },
    {
        title: 'Get expert roadmap',
        desc: 'Our counselors recommend the best-fit course and learning path.',
    },
    {
        title: 'Book your demo',
        desc: 'Attend a free session and decide with clarity and confidence.',
    },
];

const faqs = [
    {
        q: 'How quickly will someone respond after I submit this form?',
        a: 'Our admissions team usually replies within 2 to 4 business hours from Monday to Saturday.',
    },
    {
        q: 'Is career counseling really free?',
        a: 'Yes. Your first 1-on-1 counseling session is completely free and focused on guidance, not pressure.',
    },
    {
        q: 'Can I take counseling online if I am outside Pune?',
        a: 'Yes. We provide phone and video counseling so you can discuss options from anywhere in India.',
    },
    {
        q: 'Can I visit the office without an appointment?',
        a: 'Walk-ins are welcome during working hours, but booking a slot helps us assign a dedicated counselor.',
    },
];

export default function ContactNewPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            course: formData.get('course'),
            subject: formData.get('subject'),
            message: formData.get('message'),
        };

        try {
            const response = await fetch(ENDPOINTS.PUBLIC.CONTACT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                setIsSubmitted(true);
                e.currentTarget.reset();
            } else {
                alert('Submission failed. Please try again.');
            }
        } catch {
            alert('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroGlowOne} />
                <div className={styles.heroGlowTwo} />
                <div className={styles.heroGridPattern} />

                <div className={styles.container}>
                    <motion.nav
                        className={styles.breadcrumb}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
                        <span>/</span>
                        <span className={styles.breadcrumbCurrent}>Contact Us New</span>
                    </motion.nav>

                    <div className={styles.heroGrid}>
                        <motion.div
                            className={styles.heroCopy}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.1 }}
                        >
                            <span className={styles.heroBadge}>
                                <Headset size={15} />
                                Premium Career Support
                            </span>
                            <h1>
                                Start your tech journey with a team that actually listens.
                            </h1>
                            <p>
                                Talk to ITROOTS counselors for course advice, admission support, and realistic
                                placement planning tailored to your goals.
                            </p>
                            <div className={styles.heroActions}>
                                <a href="tel:+914012345678" className={styles.primaryBtn}>
                                    <Phone size={17} />
                                    Call Admissions
                                </a>
                                <a href="#contact-form" className={styles.secondaryBtn}>
                                    <Send size={16} />
                                    Send Message
                                </a>
                                <Link href="/contact" className={styles.ghostBtn}>
                                    View Old Contact Page
                                </Link>
                            </div>
                            <div className={styles.heroStatRow}>
                                <div className={styles.heroStatCard}>
                                    <UserRoundCheck size={17} />
                                    <div>
                                        <strong>5,000+</strong>
                                        <span>Students Counseled</span>
                                    </div>
                                </div>
                                <div className={styles.heroStatCard}>
                                    <Star size={17} />
                                    <div>
                                        <strong>4.9 / 5</strong>
                                        <span>Support Experience</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.aside
                            className={styles.heroPanel}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.55, delay: 0.2 }}
                        >
                            <span className={styles.panelTag}>Admissions Desk</span>
                            <h2>Fast response, clear guidance, no pressure.</h2>
                            <ul className={styles.panelList}>
                                <li>
                                    <CalendarClock size={16} />
                                    Monday to Saturday availability
                                </li>
                                <li>
                                    <ShieldCheck size={16} />
                                    100% confidential discussion
                                </li>
                                <li>
                                    <CheckCircle2 size={16} />
                                    Free counseling before enrollment
                                </li>
                            </ul>
                            <a href="#contact-form" className={styles.panelBtn}>
                                Get Personalized Guidance
                                <ArrowRight size={16} />
                            </a>
                        </motion.aside>
                    </div>
                </div>
            </section>

            <section className={styles.cardsSection}>
                <div className={styles.container}>
                    <div className={styles.cardsGrid}>
                        {contactCards.map((card, index) => (
                            <motion.div
                                key={card.label}
                                className={styles.contactCard}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.35, delay: index * 0.08 }}
                            >
                                <div className={styles.contactCardIcon} style={{ background: card.tone, color: card.accent }}>
                                    {card.icon}
                                </div>
                                <span className={styles.contactCardLabel}>{card.label}</span>
                                {card.action ? (
                                    <a href={card.action} className={styles.contactCardValue} style={{ color: card.accent }}>
                                        {card.value}
                                    </a>
                                ) : (
                                    <p className={styles.contactCardValue}>{card.value}</p>
                                )}
                                {card.sub ? <p className={styles.contactCardSub}>{card.sub}</p> : null}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.mainSection} id="contact-form">
                <div className={styles.container}>
                    <div className={styles.mainGrid}>
                        <motion.div
                            className={styles.formCard}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45 }}
                        >
                            <AnimatePresence mode="wait">
                                {isSubmitted ? (
                                    <motion.div
                                        key="success"
                                        className={styles.successState}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                    >
                                        <div className={styles.successIcon}>
                                            <CheckCircle2 size={48} />
                                        </div>
                                        <h3>Message sent successfully.</h3>
                                        <p>Our team will contact you within 2 to 4 business hours.</p>
                                        <button
                                            type="button"
                                            className={styles.successBtn}
                                            onClick={() => setIsSubmitted(false)}
                                        >
                                            Send Another Message
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        key="form"
                                        className={styles.form}
                                        onSubmit={handleSubmit}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <div className={styles.formHead}>
                                            <div className={styles.formHeadIcon}>
                                                <MessageSquare size={20} />
                                            </div>
                                            <div>
                                                <h3>Tell us what you need</h3>
                                                <p>Fill the form and get expert guidance quickly.</p>
                                            </div>
                                        </div>

                                        <div className={styles.formRow}>
                                            <div className={styles.formGroup}>
                                                <label htmlFor="name">Full Name *</label>
                                                <input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    placeholder="e.g. Rahul Sharma"
                                                    required
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label htmlFor="email">Email Address *</label>
                                                <input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    placeholder="you@email.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className={styles.formRow}>
                                            <div className={styles.formGroup}>
                                                <label htmlFor="phone">Phone Number *</label>
                                                <input
                                                    id="phone"
                                                    name="phone"
                                                    type="tel"
                                                    placeholder="+91 XXXXX XXXXX"
                                                    required
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Course Interested In</label>
                                                <CustomSelect options={courseOptions} name="course" />
                                            </div>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label htmlFor="subject">Subject</label>
                                            <input
                                                id="subject"
                                                name="subject"
                                                type="text"
                                                placeholder="How can we help you?"
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label htmlFor="message">Message *</label>
                                            <textarea
                                                id="message"
                                                name="message"
                                                rows={5}
                                                placeholder="Tell us your current profile and your career goal..."
                                                required
                                            />
                                        </div>

                                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                                            {isLoading ? (
                                                <span className={styles.loadingDots}>Sending<span>.</span><span>.</span><span>.</span></span>
                                            ) : (
                                                <>
                                                    Submit Inquiry
                                                    <Send size={16} />
                                                </>
                                            )}
                                        </button>
                                        <p className={styles.formHint}>
                                            By submitting, you agree to our <Link href="/privacy-policy">Privacy Policy</Link>.
                                        </p>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        <motion.aside
                            className={styles.sidePanel}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45, delay: 0.08 }}
                        >
                            <div className={styles.sideCard}>
                                <span className={styles.sideEyebrow}>How it works</span>
                                <h3>Your admission flow in 3 easy steps</h3>
                                <div className={styles.stepList}>
                                    {processSteps.map((step, index) => (
                                        <div key={step.title} className={styles.stepItem}>
                                            <span className={styles.stepNo}>{index + 1}</span>
                                            <div>
                                                <h4>{step.title}</h4>
                                                <p>{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.sideCard}>
                                <span className={styles.sideEyebrow}>Need instant help?</span>
                                <a href="tel:+914012345678" className={styles.quickLink}>
                                    <Phone size={17} />
                                    +91 40 1234 5678
                                </a>
                                <a href="mailto:admissions@itroots.in" className={styles.quickLink}>
                                    <Mail size={17} />
                                    admissions@itroots.in
                                </a>
                                <a
                                    href="https://wa.me/919876543210"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.quickLink}
                                >
                                    <MessageSquare size={17} />
                                    WhatsApp Chat
                                </a>
                                <div className={styles.socialRow}>
                                    <span>Follow us</span>
                                    <div>
                                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
                                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
                                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">YouTube</a>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    </div>
                </div>
            </section>

            <section className={styles.visitSection}>
                <div className={styles.container}>
                    <motion.div
                        className={styles.sectionHeader}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                    >
                        <span>Campus and location</span>
                        <h2>Visit our learning space in Pune</h2>
                        <p>Modern classrooms, practical labs, and a team ready to guide your career transition.</p>
                    </motion.div>

                    <div className={styles.visitGrid}>
                        <div className={styles.galleryGrid}>
                            <div className={`${styles.galleryItem} ${styles.galleryItemLarge}`}>
                                <Image
                                    src="/images/Entrance.jpg"
                                    alt="ITROOTS Entrance"
                                    fill
                                    sizes="(max-width: 900px) 100vw, 55vw"
                                    className={styles.galleryImage}
                                />
                                <span>Entrance</span>
                            </div>
                            <div className={styles.galleryItem}>
                                <Image
                                    src="/images/Lobby.jpg"
                                    alt="ITROOTS Lobby"
                                    fill
                                    sizes="(max-width: 900px) 100vw, 25vw"
                                    className={styles.galleryImage}
                                />
                                <span>Lobby</span>
                            </div>
                            <div className={styles.galleryItem}>
                                <Image
                                    src="/images/Offfice.jpg"
                                    alt="ITROOTS Office Floor"
                                    fill
                                    sizes="(max-width: 900px) 100vw, 25vw"
                                    className={styles.galleryImage}
                                />
                                <span>Training Floor</span>
                            </div>
                        </div>

                        <div className={styles.mapCard}>
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3783.102129968592!2d73.84688947489279!3d18.52428636906136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c19315a199fd%3A0xfe80d210c7470a99!2sITROOTS%20PVT%20LTD!5e0!3m2!1sen!2sin!4v1772691842505!5m2!1sen!2sin"
                                width="100%"
                                height="320"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="ITROOTS Location"
                            />
                            <div className={styles.mapInfo}>
                                <h3>ITROOTS Pvt Ltd</h3>
                                <p>
                                    Office No. 205 and 206, Rainbow Plaza, Jangali Maharaj Road,
                                    Deccan, Shivajinagar, Pune 411005
                                </p>
                                <a
                                    href="https://maps.google.com/?q=ITROOTS+PVT+LTD+Pune"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open in Google Maps
                                    <ArrowRight size={15} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.faqSection}>
                <div className={styles.container}>
                    <div className={styles.faqGrid}>
                        <div className={styles.faqIntro}>
                            <span>FAQs</span>
                            <h2>Frequently asked questions</h2>
                            <p>If you need anything specific, use the contact form and our team will guide you.</p>
                            <a href="#contact-form">
                                Ask your question
                                <ArrowRight size={16} />
                            </a>
                        </div>
                        <div className={styles.faqList}>
                            {faqs.map((faq, index) => {
                                const isOpen = openFaq === index;
                                return (
                                    <div key={faq.q} className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}>
                                        <button
                                            type="button"
                                            className={styles.faqButton}
                                            onClick={() => setOpenFaq(isOpen ? null : index)}
                                        >
                                            <span>{faq.q}</span>
                                            <ChevronDown size={19} />
                                        </button>
                                        <AnimatePresence initial={false}>
                                            {isOpen ? (
                                                <motion.div
                                                    className={styles.faqAnswer}
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                >
                                                    <p>{faq.a}</p>
                                                </motion.div>
                                            ) : null}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.ctaSection}>
                <div className={styles.ctaGlow} />
                <div className={styles.container}>
                    <motion.div
                        className={styles.ctaInner}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                    >
                        <span>Ready to start?</span>
                        <h2>Get the roadmap to your next tech role.</h2>
                        <p>Connect with ITROOTS advisors and choose the right course with complete clarity.</p>
                        <div className={styles.ctaActions}>
                            <Link href="/courses" className={styles.ctaPrimary}>
                                Explore Courses
                                <ArrowRight size={17} />
                            </Link>
                            <a href="tel:+914012345678" className={styles.ctaSecondary}>
                                <Phone size={17} />
                                Call Now
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
