import Link from 'next/link';
import Image from 'next/image';
import {
    Mail,
    Phone,
    MapPin,
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    Youtube,
    ArrowRight
} from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <>
            <footer className={styles.footer}>

                {/* Main Footer */}
                <div className={styles.mainFooter}>
                    <div className={styles.container}>
                        <div className={styles.footerGrid}>
                            {/* Company Info */}
                            <div className={styles.companyInfo}>
                                <Link href="/" className={styles.logo}>
                                    <Image
                                        src="/images/footer_logo2.png"
                                        alt="ITROOTS"
                                        width={180}
                                        height={60}
                                        style={{ height: '70px', width: 'auto' }}
                                    />
                                </Link>
                                <p className={styles.tagline}>
                                    Empowering careers through quality IT education and industry-ready training programs.
                                </p>
                                <div className={styles.socialLinks}>
                                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                        <Facebook size={20} />
                                    </a>
                                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                        <Instagram size={20} />
                                    </a>
                                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                        <Youtube size={20} />
                                    </a>
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className={styles.footerColumn}>
                                <h4>Quick Links</h4>
                                <ul>
                                    <li><Link href="/">Home</Link></li>
                                    <li><Link href="/courses">All Courses</Link></li>
                                    <li><Link href="/placements">Our Placements</Link></li>
                                    <li><Link href="/hire-from-us">Hire From Us</Link></li>
                                    <li><Link href="/about">About Us</Link></li>
                                    <li><Link href="/contact">Contact Us</Link></li>
                                    <li style={{ marginTop: '1rem' }}>
                                        <Link href="/lms/login" className={styles.loginButton}>Student Login →</Link>
                                    </li>
                                </ul>
                            </div>

                            {/* Popular Courses */}
                            <div className={styles.footerColumn}>
                                <h4>Popular Courses</h4>
                                <ul>
                                    <li><Link href="/courses/data-science-with-ai">Data Science with AI</Link></li>
                                    <li><Link href="/courses/full-stack-java-certification">Full Stack Java</Link></li>
                                    <li><Link href="/courses/cyber-security-job-guarantee">Cyber Security</Link></li>
                                    <li><Link href="/courses/data-analytics-python">Data Analytics Python</Link></li>
                                    <li><Link href="/courses/software-testing">Software Testing</Link></li>
                                </ul>
                            </div>

                            {/* Contact Info */}
                            <div className={styles.footerColumn}>
                                <h4>Contact Us</h4>
                                <ul className={styles.contactList}>
                                    <li>
                                        <MapPin size={18} />
                                        <span>ITROOTS Pvt Ltd, Office No. 1319, 2nd floor, Rainbow Plaza, Jangali Maharaj Road, opposite Modern High School, Deccan, Shivajinagar, Pune, Mh. 411005</span>
                                    </li>
                                    <li>
                                        <Phone size={18} />
                                        <a href="tel:+918877202122">+(91) 8877202122</a>
                                    </li>
                                    <li>
                                        <Mail size={18} />
                                        <a href="mailto:info@itroots.co.in">info@itroots.co.in</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className={styles.bottomBar}>
                    <div className={styles.container}>
                        <p>© 2016 - {currentYear} ITROOTS. All rights reserved.</p>
                        <div className={styles.legalLinks}>
                            <Link href="/privacy-policy">Privacy Policy</Link>
                            <Link href="/terms-of-service">Terms of Service</Link>
                            <Link href="/refund-policy">Refund Policy</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
