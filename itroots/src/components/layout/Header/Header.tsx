'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu,
    X,
    ChevronDown,
    Code2,
    GraduationCap,
    Brain,
    Shield,
    BarChart3,
    Cpu,
    Layers,
    Briefcase,
    PieChart,
    TestTube2,
    Users
} from 'lucide-react';
import { courses } from '@/data/courses';
import EnrollModal from '@/components/ui/EnrollModal/EnrollModal';
import styles from './Header.module.css';

const courseIcons: { [key: string]: React.ReactNode } = {
    'Brain': <Brain size={18} />,
    'Code2': <Code2 size={18} />,
    'Shield': <Shield size={18} />,
    'BarChart3': <BarChart3 size={18} />,
    'Cpu': <Cpu size={18} />,
    'Layers': <Layers size={18} />,
    'Briefcase': <Briefcase size={18} />,
    'PieChart': <PieChart size={18} />,
    'TestTube2': <TestTube2 size={18} />,
    'Users': <Users size={18} />
};

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const [showNotification, setShowNotification] = useState(true);
    const [isEnrollOpen, setIsEnrollOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (dropdownRef.current && dropdownRef.current.contains(target)) {
                return;
            }
            if (mobileMenuRef.current && mobileMenuRef.current.contains(target)) {
                return;
            }
            setActiveDropdown(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    const toggleDropdown = (name: string) => {
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    const toggleMobileDropdown = (name: string) => {
        setActiveDropdown(prev => prev === name ? null : name);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
        setActiveDropdown(null);
    };

    return (
        <>
            {/* Notification Bar */}
            {showNotification && (
                <div className={styles.notificationBar}>
                    <div className={styles.notificationContent}>
                        <p>
                            <GraduationCap size={18} className={styles.notificationIcon} />
                            New Batch Starting Soon! <strong>Enroll Now</strong> and Get 20% Off on All Courses
                        </p>
                        <button
                            className={styles.notificationClose}
                            onClick={() => setShowNotification(false)}
                            aria-label="Close notification"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Header */}
            <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
                <div className={styles.container}>
                    {/* Logo */}
                    <div className={styles.logoAndBadge}>
                        <Link href="/" className={styles.logo}>
                            <Image
                                src="/images/logo.png"
                                alt="ITROOTS"
                                width={160}
                                height={48}
                                className={styles.logoImage}
                                priority
                            />
                        </Link>
                        <Image
                            src="/images/Excellnce New1.png"
                            alt="Excellence"
                            width={160}
                            height={48}
                            className={styles.headerBadge}
                            priority
                            unoptimized
                        />
                    </div>

                    {/* Explore Courses Button */}
                    <Link href="/courses" className={styles.exploreBtn}>
                        <GraduationCap size={18} />
                        Explore Courses
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className={styles.desktopNav} ref={dropdownRef}>
                        {/* All Courses Dropdown */}
                        <div className={`${styles.dropdown} ${activeDropdown === 'courses' ? styles.dropdownActive : ''}`}>
                            <button
                                className={`${styles.navLink} ${styles.dropdownTrigger}`}
                                onClick={() => toggleDropdown('courses')}
                            >
                                All Courses
                                <ChevronDown size={16} className={activeDropdown === 'courses' ? styles.rotated : ''} />
                            </button>
                            <AnimatePresence>
                                {activeDropdown === 'courses' && (
                                    <motion.div
                                        className={styles.megaMenu}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className={styles.megaMenuGrid}>
                                            {courses.map((course) => (
                                                <Link
                                                    key={course.slug}
                                                    href={`/courses/${course.slug}`}
                                                    className={styles.megaMenuItem}
                                                    onClick={() => setActiveDropdown(null)}
                                                >
                                                    <span
                                                        className={styles.courseIcon}
                                                        style={{ backgroundColor: `${course.color}15`, color: course.color }}
                                                    >
                                                        {courseIcons[course.icon]}
                                                    </span>
                                                    <div className={styles.courseInfo}>
                                                        <span className={styles.courseName}>{course.shortTitle}</span>
                                                        <span className={styles.courseDuration}>{course.duration}</span>
                                                    </div>
                                                    {course.isJobGuarantee && (
                                                        <span className={styles.jobGuaranteeBadge}>Job Guarantee</span>
                                                    )}
                                                </Link>
                                            ))}
                                        </div>
                                        <div className={styles.megaMenuFooter}>
                                            <Link href="/courses" className={styles.viewAllLink}>
                                                View All Courses →
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <Link href="/hire-from-us" className={styles.navLink}>Hire From Us</Link>
                        <Link href="/placements" className={styles.navLink}>Our Placements</Link>
                        <Link href="/blog" className={styles.navLink}>Blog</Link>

                        {/* More Dropdown */}
                        <div className={`${styles.dropdown} ${activeDropdown === 'more' ? styles.dropdownActive : ''}`}>
                            <button
                                className={`${styles.navLink} ${styles.dropdownTrigger}`}
                                onClick={() => toggleDropdown('more')}
                            >
                                More
                                <ChevronDown size={16} className={activeDropdown === 'more' ? styles.rotated : ''} />
                            </button>
                            <AnimatePresence>
                                {activeDropdown === 'more' && (
                                    <motion.div
                                        className={styles.dropdownMenu}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Link
                                            href="/about"
                                            className={styles.dropdownItem}
                                            onClick={() => setActiveDropdown(null)}
                                        >
                                            About Us
                                        </Link>
                                        <Link
                                            href="/contact"
                                            className={styles.dropdownItem}
                                            onClick={() => setActiveDropdown(null)}
                                        >
                                            Contact Us
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </nav>

                    {/* CTA Buttons */}
                    <div className={styles.headerActions}>
                        <button className={styles.enrollBtn} onClick={() => setIsEnrollOpen(true)}>
                            Enroll Now
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className={styles.mobileMenuBtn}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Secondary Header */}
            <div className={styles.secondaryHeader}>
                <div className={styles.secondaryContainer}>
                    {courses.map((course) => (
                        <Link
                            key={course.slug}
                            href={`/courses/${course.slug}`}
                            className={styles.secondaryNavLink}
                        >
                            {course.shortTitle}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence mode="wait">
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            className={styles.mobileMenuOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={closeMobileMenu}
                        />
                        <motion.div
                            className={styles.mobileMenu}
                            ref={mobileMenuRef}
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'tween', duration: 0.25 }}
                        >
                            {/* Mobile Menu Header */}
                            <div className={styles.mobileMenuHeader}>
                                <Link href="/" className={styles.logo} onClick={closeMobileMenu}>
                                    <Image
                                        src="/images/logo.png"
                                        alt="ITROOTS"
                                        width={150}
                                        height={55}
                                        style={{ height: '55px', width: 'auto' }}
                                    />
                                </Link>
                                <button
                                    className={styles.mobileMenuClose}
                                    onClick={closeMobileMenu}
                                    aria-label="Close menu"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Mobile Navigation */}
                            <nav className={styles.mobileNav}>
                                {/* All Courses Dropdown */}
                                <div className={styles.mobileNavItem}>
                                    <button
                                        className={`${styles.mobileNavLink} ${activeDropdown === 'mobile-courses' ? styles.active : ''}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleMobileDropdown('mobile-courses');
                                        }}
                                        type="button"
                                    >
                                        <span>All Courses</span>
                                        <ChevronDown
                                            size={18}
                                            className={`${styles.mobileChevron} ${activeDropdown === 'mobile-courses' ? styles.rotated : ''}`}
                                        />
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {activeDropdown === 'mobile-courses' && (
                                            <motion.div
                                                className={styles.mobileSubmenu}
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                {courses.map((course) => (
                                                    <Link
                                                        key={course.slug}
                                                        href={`/courses/${course.slug}`}
                                                        className={styles.mobileSubmenuLink}
                                                        onClick={closeMobileMenu}
                                                    >
                                                        <span
                                                            className={styles.mobileSubmenuIcon}
                                                            style={{ backgroundColor: `${course.color}15`, color: course.color }}
                                                        >
                                                            {courseIcons[course.icon]}
                                                        </span>
                                                        <span>{course.shortTitle}</span>
                                                    </Link>
                                                ))}
                                                <Link
                                                    href="/courses"
                                                    className={styles.mobileViewAll}
                                                    onClick={closeMobileMenu}
                                                >
                                                    View All Courses →
                                                </Link>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Hire From Us */}
                                <div className={styles.mobileNavItem}>
                                    <Link
                                        href="/hire-from-us"
                                        className={styles.mobileNavLink}
                                        onClick={closeMobileMenu}
                                    >
                                        <span>Hire From Us</span>
                                    </Link>
                                </div>

                                {/* Our Placements */}
                                <div className={styles.mobileNavItem}>
                                    <Link
                                        href="/placements"
                                        className={styles.mobileNavLink}
                                        onClick={closeMobileMenu}
                                    >
                                        <span>Our Placements</span>
                                    </Link>
                                </div>

                                {/* Blog */}
                                <div className={styles.mobileNavItem}>
                                    <Link
                                        href="/blog"
                                        className={styles.mobileNavLink}
                                        onClick={closeMobileMenu}
                                    >
                                        <span>Blog</span>
                                    </Link>
                                </div>

                                {/* More Dropdown */}
                                <div className={styles.mobileNavItem}>
                                    <button
                                        className={`${styles.mobileNavLink} ${activeDropdown === 'mobile-more' ? styles.active : ''}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleMobileDropdown('mobile-more');
                                        }}
                                        type="button"
                                    >
                                        <span>More</span>
                                        <ChevronDown
                                            size={18}
                                            className={`${styles.mobileChevron} ${activeDropdown === 'mobile-more' ? styles.rotated : ''}`}
                                        />
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {activeDropdown === 'mobile-more' && (
                                            <motion.div
                                                className={styles.mobileSubmenu}
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <Link
                                                    href="/about"
                                                    className={styles.mobileSubmenuLink}
                                                    onClick={closeMobileMenu}
                                                >
                                                    <span>About Us</span>
                                                </Link>
                                                <Link
                                                    href="/contact"
                                                    className={styles.mobileSubmenuLink}
                                                    onClick={closeMobileMenu}
                                                >
                                                    <span>Contact Us</span>
                                                </Link>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </nav>

                            {/* Mobile Menu Footer */}
                            <div className={styles.mobileMenuFooter}>
                                <button
                                    className={styles.mobileEnrollBtn}
                                    onClick={() => {
                                        closeMobileMenu();
                                        setIsEnrollOpen(true);
                                    }}
                                >
                                    Enroll Now
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>


            <EnrollModal isOpen={isEnrollOpen} onClose={() => setIsEnrollOpen(false)} />
        </>
    );
}
