'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Clock, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { courses as hardcodedCourses } from '@/data/courses';
import { ENDPOINTS } from '@/config/api';
import styles from './page.module.css';

export default function CoursesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [dynamicCourses, setDynamicCourses] = useState<any[]>([]);

    useEffect(() => {
        fetch(ENDPOINTS.PUBLIC.COURSES)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Map DB keys to Frontend keys
                    const mapped = data.map(dbCourse => ({
                        slug: dbCourse.slug || dbCourse.title.toLowerCase().replace(/\s+/g, '-'),
                        title: dbCourse.title,
                        shortTitle: dbCourse.title,
                        description: dbCourse.description,
                        shortDescription: dbCourse.description || "Learn the latest industry standard skills in this course.",
                        category: dbCourse.category || "Uncategorized",
                        price: dbCourse.price || 50000,
                        cardImage: dbCourse.thumbnail || "",
                        color: "#2563eb",
                        duration: "12 Weeks",
                        mode: "Online + Offline",
                        highlights: ["Live Sessions", "Industry Projects", "1-on-1 Mentorship"],
                        isJobGuarantee: true
                    }));
                    setDynamicCourses(mapped);
                }
            })
            .catch(err => console.error("Error fetching dynamic courses:", err));
    }, []);

    const courses = [...hardcodedCourses, ...dynamicCourses];
    const allCategories = ['All', ...Array.from(new Set(courses.map((c) => c.category)))];

    const filteredCourses = useMemo(() => {
        return courses.filter((course) => {
            const matchesCategory =
                activeCategory === 'All' || course.category === activeCategory;
            const matchesSearch =
                searchQuery.trim() === '' ||
                course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.shortTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.category.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [searchQuery, activeCategory]);

    return (
        <>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.container}>
                    <h1>Our Courses</h1>
                    <p>
                        Choose from our comprehensive range of career-focused programs designed
                        with industry experts
                    </p>
                </div>
            </section>

            {/* Filter Section */}
            <section className={styles.filterSection}>
                <div className={styles.container}>
                    <div className={styles.searchBox}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className={styles.categoryTabs}>
                        {allCategories.map((category) => (
                            <button
                                key={category}
                                className={`${styles.categoryTab} ${activeCategory === category ? styles.active : ''}`}
                                onClick={() => setActiveCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Courses Grid */}
            <section className={styles.coursesSection}>
                <div className={styles.container}>
                    <p className={styles.resultsInfo}>
                        Showing {filteredCourses.length} of {courses.length} courses
                    </p>
                    {filteredCourses.length > 0 ? (
                        <div className={styles.coursesGrid}>
                            {filteredCourses.map((course, index) => (
                                <motion.div
                                    key={course.slug}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: index * 0.08 }}
                                >
                                    <Link
                                        href={`/courses/${course.slug}`}
                                        className={styles.courseCard}
                                    >
                                        <div className={styles.cardHeader}>
                                            <div
                                                className={styles.courseIcon}
                                                style={{
                                                    backgroundColor: `${course.color}15`,
                                                    color: course.color,
                                                }}
                                            >
                                                {course.cardImage ? (
                                                    <img
                                                        src={course.cardImage}
                                                        alt={course.shortTitle}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            borderRadius: 'inherit',
                                                        }}
                                                    />
                                                ) : null}
                                            </div>
                                            {course.isJobGuarantee && (
                                                <span className={styles.jobBadge}>Job Guarantee</span>
                                            )}
                                        </div>
                                        <h3>{course.shortTitle}</h3>
                                        <p>{course.shortDescription}</p>
                                        <div className={styles.courseMeta}>
                                            <span className={styles.metaItem}>
                                                <Clock size={14} />
                                                {course.duration}
                                            </span>
                                            <span className={styles.metaItem}>
                                                {course.mode}
                                            </span>
                                        </div>
                                        <div className={styles.highlights}>
                                            {course.highlights?.slice(0, 3).map((h: string) => (
                                                <span key={h} className={styles.highlight}>
                                                    ✓ {h}
                                                </span>
                                            ))}
                                        </div>
                                        <div className={styles.cardFooter}>
                                            <div className={styles.price}>
                                                {course.discountedPrice && (
                                                    <span className={styles.originalPrice}>
                                                        ₹{course.price.toLocaleString('en-IN')}
                                                    </span>
                                                )}
                                                <span className={styles.currentPrice}>
                                                    ₹{(course.discountedPrice || course.price).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            <div className={styles.cardActions}>
                                                {course.brochureUrl && (
                                                    <span
                                                        className={styles.downloadBrochureBtn}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            window.open(course.brochureUrl, '_blank', 'noopener,noreferrer');
                                                        }}
                                                        title="Download Brochure"
                                                    >
                                                        <Download size={18} />
                                                    </span>
                                                )}
                                                <span className={styles.viewBtn}>
                                                    View Details <ArrowRight size={16} />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noResults}>
                            <p>No courses found matching your criteria.</p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setActiveCategory('All');
                                }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
