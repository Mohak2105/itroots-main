'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
    Phone,
    Mail,
    MapPin,
    Clock,
    ArrowRight,
<<<<<<< HEAD
    CheckCircle
=======
    CheckCircle,
    MessageSquare,
    Send
>>>>>>> b8275b344df0c43dcb4d2fcd30dcfe4534e0583c
} from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect/CustomSelect';
import { courses } from '@/data/courses';
import styles from './page.module.css';

const courseOptions = courses.map((course) => ({
    value: course.slug,
    label: course.shortTitle,
}));
const CONTACT_SUBMISSIONS_KEY = 'itroots_contact_submissions';

const contactInfo = [
    {
        icon: <MapPin size={22} />,
        title: 'Visit Us',
        lines: [
            'ITROOTS Pvt Ltd, Office No. 205 & 206,',
            '2nd floor, Rainbow Plaza, Jangali Maharaj Road,',
            'opposite Modern High School, Deccan,',
            'Shivajinagar, Pune, Mh. 411005',
        ],
        color: '#0c2d4c',
        bg: 'rgba(12, 45, 76, 0.08)',
    },
    {
        icon: <Phone size={22} />,
        title: 'Call Us',
        lines: ['+91 40 1234 5678', '+91 98765 43210'],
        color: '#ee9602',
        bg: 'rgba(238, 150, 2, 0.08)',
    },
    {
        icon: <Mail size={22} />,
        title: 'Email Us',
        lines: ['admissions@itroots.in', 'career@itroots.in'],
        color: '#0881ec',
        bg: 'rgba(8, 129, 236, 0.08)',
    },
    {
        icon: <Clock size={22} />,
        title: 'Working Hours',
        lines: ['Mon – Sat: 10:00 AM – 7:00 PM', 'Sunday: Closed'],
        color: '#3b9995',
        bg: 'rgba(59, 153, 149, 0.08)',
    },
];

export default function ContactPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = {
            name: String(formData.get('name') || ''),
            email: String(formData.get('email') || ''),
            phone: String(formData.get('phone') || ''),
            course: String(formData.get('course') || ''),
            subject: String(formData.get('subject') || ''),
            message: String(formData.get('message') || ''),
        };

        try {
            const existing = JSON.parse(localStorage.getItem(CONTACT_SUBMISSIONS_KEY) || '[]');
            const submissions = Array.isArray(existing) ? existing : [];
            submissions.push({ ...data, submittedAt: new Date().toISOString() });
            localStorage.setItem(CONTACT_SUBMISSIONS_KEY, JSON.stringify(submissions));

            await new Promise((resolve) => setTimeout(resolve, 600));
            setIsSubmitted(true);
            e.currentTarget.reset();
        } catch (error) {
            console.error('Submission error:', error);
            alert('Unable to save message locally. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Hero / Banner — UNCHANGED */}
            <section className={styles.hero}>
                <div className={styles.container}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1>Contact Us</h1>
                        <p>Have questions? We&apos;d love to hear from you. Our team is ready to help.</p>
                    </motion.div>
                </div>
            </section>

            {/* Info Cards Strip */}
            <section className={styles.infoStrip}>
                <div className={styles.container}>
                    <div className={styles.infoCardsGrid}>
                        {contactInfo.map((item, i) => (
                            <motion.div
                                key={i}
                                className={styles.infoCard}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                            >
                                <div
                                    className={styles.infoCardIcon}
                                    style={{ background: item.bg, color: item.color }}
                                >
                                    {item.icon}
                                </div>
                                <h3>{item.title}</h3>
                                {item.lines.map((line, j) => (
                                    <p key={j}>{line}</p>
                                ))}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main Contact Section */}
            <section className={styles.contactSection}>
                <div className={styles.container}>
                    <motion.div
                        className={styles.infoCardsHeading}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                    >
                        <h2>We&apos;re Here to Help</h2>
                    </motion.div>

                    <motion.div
                        className={styles.infoCardsRow}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className={styles.infoMiniCard}>
                            <div className={styles.infoIcon}>
                                <MapPin size={22} />
                            </div>
                            <div className={styles.infoText}>
                                <h3>Visit Us</h3>
                                <p>ITROOTS Pvt Ltd, Rainbow Plaza, J.M. Road, Pune 411005</p>
                            </div>
                        </div>

                        <div className={styles.infoMiniCard}>
                            <div className={styles.infoIcon}>
                                <Phone size={22} />
                            </div>
                            <div className={styles.infoText}>
                                <h3>Call Us</h3>
                                <p>+91 40 1234 5678 /<br />+91 98765 43210</p>
                            </div>
                        </div>

                        <div className={styles.infoMiniCard}>
                            <div className={styles.infoIcon}>
                                <Mail size={22} />
                            </div>
                            <div className={styles.infoText}>
                                <h3>Email Us</h3>
                                <p>admissions@itroots.in / career@itroots.in</p>
                            </div>
                        </div>

                        <div className={styles.infoMiniCard}>
                            <div className={styles.infoIcon}>
                                <Clock size={22} />
                            </div>
                            <div className={styles.infoText}>
                                <h3>Working Hours</h3>
                                <p>Mon - Sat: 10:00 AM - 7:00 PM</p>
                            </div>
                        </div>
                    </motion.div>

                    <div className={styles.contactGrid}>
<<<<<<< HEAD
                        {/* Contact Intro */}
                        <motion.div
                            className={styles.contactIntro}
=======

                        {/* Left — Info Panel */}
                        <motion.div
                            className={styles.contactSidebar}
>>>>>>> b8275b344df0c43dcb4d2fcd30dcfe4534e0583c
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className={styles.eyebrow}>We&apos;re Here For You</span>
                            <h2>Get In Touch With Our Team</h2>
                            <p>
<<<<<<< HEAD
                                Whether you have a question about our courses, placements, or anything else,
                                our team is ready to answer all your queries. Visit our office lobby and meet our counselling team.
                            </p>
                            <div className={styles.lobbyImageWrapper}>
                                <img
                                    src="/images/Lobby.jpg"
                                    alt="ITROOTS Lobby"
                                    className={styles.lobbyImage}
                                />
=======
                                Whether you have a question about our courses, admission process, placement support, or anything else —
                                our counsellors are ready to answer every query with care.
                            </p>

                            <div className={styles.promiseList}>
                                {[
                                    'Response within 24 hours',
                                    'Free career counselling session',
                                    'No obligation — just honest advice',
                                    'Talk to a real admission expert',
                                ].map((item, i) => (
                                    <div key={i} className={styles.promiseItem}>
                                        <CheckCircle size={18} fill="#0c2d4c" color="white" className={styles.promiseIcon} />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.sidebarDivider} />

                            <div className={styles.quickContact}>
                                <a href="tel:+914012345678" className={styles.quickLink}>
                                    <div className={styles.quickIcon}><Phone size={18} /></div>
                                    <div>
                                        <span className={styles.quickLabel}>Call directly</span>
                                        <strong>+91 40 1234 5678</strong>
                                    </div>
                                </a>
                                <a href="mailto:admissions@itroots.in" className={styles.quickLink}>
                                    <div className={styles.quickIcon}><Mail size={18} /></div>
                                    <div>
                                        <span className={styles.quickLabel}>Write to us</span>
                                        <strong>admissions@itroots.in</strong>
                                    </div>
                                </a>
>>>>>>> b8275b344df0c43dcb4d2fcd30dcfe4534e0583c
                            </div>
                        </motion.div>

                        {/* Right — Form */}
                        <motion.div
                            className={styles.formWrapper}
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            {isSubmitted ? (
                                <div className={styles.successWrapper}>
                                    <div className={styles.successIcon}>
                                        <CheckCircle size={44} color="#10b981" />
                                    </div>
                                    <h2>Message Sent!</h2>
                                    <p>Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                                    <button onClick={() => setIsSubmitted(false)} className={styles.submitBtn}>
                                        Send Another Message
                                    </button>
                                </div>
                            ) : (
                                <form className={styles.form} onSubmit={handleSubmit}>
                                    <div className={styles.formHeader}>
                                        <div className={styles.formHeaderIcon}>
                                            <MessageSquare size={22} />
                                        </div>
                                        <div>
                                            <h2>Send Us a Message</h2>
                                            <p>Fill in the form and we&apos;ll be in touch shortly.</p>
                                        </div>
                                    </div>

                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="name">Full Name <span>*</span></label>
                                            <input type="text" id="name" name="name" placeholder="e.g. Rahul Sharma" required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="email">Email Address <span>*</span></label>
                                            <input type="email" id="email" name="email" placeholder="you@email.com" required />
                                        </div>
                                    </div>

                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="phone">Phone Number <span>*</span></label>
                                            <input type="tel" id="phone" name="phone" placeholder="+91 XXXXX XXXXX" required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Course Interested In</label>
                                            <CustomSelect
                                                options={courseOptions}
                                                name="course"
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="subject">Subject</label>
                                        <input type="text" id="subject" name="subject" placeholder="How can we help you?" />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="message">Message <span>*</span></label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            required
                                            rows={5}
                                            placeholder="Tell us more about what you're looking for..."
                                        ></textarea>
                                    </div>

                                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                                        {isLoading ? (
                                            'Sending...'
                                        ) : (
                                            <>
                                                Send Message
                                                <Send size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Office Gallery */}
            <section className={styles.officeSection}>
                <div className={styles.container}>
                    <div className={styles.officeSectionHeader}>
                        <span className={styles.eyebrow}>Our Workspace</span>
                        <h2>Visit Our Office</h2>
                        <p>A modern, tech-enabled learning environment designed for your success.</p>
                    </div>
                    <div className={styles.officeGrid}>
                        <motion.div
                            className={styles.officeImageWrap}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4 }}
                        >
                            <Image
                                src="/images/Entrance.jpg"
                                alt="ITROOTS Office Entrance"
                                width={600}
                                height={400}
                                className={styles.officeImg}
                            />
                            <span className={styles.officeLabel}>Entrance</span>
                        </motion.div>
                        <motion.div
                            className={styles.officeImageWrap}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                        >
                            <Image
                                src="/images/Lobby.jpg"
                                alt="ITROOTS Lobby"
                                width={600}
                                height={400}
                                className={styles.officeImg}
                            />
                            <span className={styles.officeLabel}>Lobby</span>
                        </motion.div>
                        <motion.div
                            className={styles.officeImageWrap}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                        >
                            <Image
                                src="/images/Offfice.jpg"
                                alt="ITROOTS Office Space"
                                width={600}
                                height={400}
                                className={styles.officeImg}
                            />
                            <span className={styles.officeLabel}>Office</span>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Google Map */}
            <section className={styles.mapSection}>
<<<<<<< HEAD
                <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d242221.27525757928!2d73.70830591458395!3d18.451588520283625!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c19315a199fd%3A0xfe80d210c7470a99!2sITROOTS%20PVT%20LTD!5e0!3m2!1sen!2sin!4v1772709075908!5m2!1sen!2sin"
                    width="100%"
                    height="450"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="ITRoots Location"
                ></iframe>
=======
                <div className={styles.mapHeader}>
                    <div className={styles.container}>
                        <h2>Find Us on the Map</h2>
                        <p>ITROOTS is located in the heart of Pune &#8212; easily accessible from Shivajinagar &#38; Deccan.</p>
                    </div>
                </div>
                <div className={styles.mapFrame}>
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3783.102129968592!2d73.84688947489279!3d18.52428636906136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c19315a199fd%3A0xfe80d210c7470a99!2sITROOTS%20PVT%20LTD!5e0!3m2!1sen!2sin!4v1772691842505!5m2!1sen!2sin"
                        width="100%"
                        height="480"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="ITRoots Location"
                    ></iframe>
                </div>
>>>>>>> b8275b344df0c43dcb4d2fcd30dcfe4534e0583c
            </section>
        </>
    );
}
