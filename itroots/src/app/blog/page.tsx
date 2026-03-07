'use client';

import { useState } from "react";
import Link from "next/link";
import { BLOG_POSTS, BLOG_CATEGORIES } from "@/data/blog-data";
import styles from "./blog.module.css";
import {
    ArrowRight,
    Clock,
    MagnifyingGlass,
    Tag,
} from "@phosphor-icons/react";

export default function BlogListingPage() {
    const [activeCategory, setActiveCategory] = useState("All");

    const featuredPost = BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0];

    const filteredPosts = BLOG_POSTS.filter((post) => {
        const matchesCategory =
            activeCategory === "All" || post.category === activeCategory;
        return matchesCategory && post.id !== featuredPost.id;
    });

    return (
        <div className={styles.blogPage}>
            {/* Hero Section */}
            <section className={styles.heroSection}>
                <div className={styles.heroContainer}>
                    <h1 className={styles.heroTitle}>Blog</h1>
                    <p className={styles.heroSubtitle}>
                        Expert articles, career roadmaps, and industry trends to help
                        you navigate your tech journey.
                    </p>
                </div>
            </section>

            <div className={styles.mainContainer}>
                {/* Featured Post */}
                {activeCategory === "All" && (
                    <section className={styles.featuredSection}>
                        <div className={styles.sectionLabel}>
                            <span className={styles.labelDot} />
                            Featured Article
                        </div>
                        <Link
                            href={`/blog/${featuredPost.slug}`}
                            className={styles.featuredCard}
                        >
                            <div className={styles.featuredImage}>
                                <img
                                    src={featuredPost.image}
                                    alt={featuredPost.title}
                                />
                                <div className={styles.featuredOverlay} />
                            </div>
                            <div className={styles.featuredContent}>
                                <div className={styles.featuredMeta}>
                                    <span className={styles.categoryTag}>
                                        <Tag size={14} weight="bold" />
                                        {featuredPost.category}
                                    </span>
                                    <span className={styles.readTime}>
                                        <Clock size={14} weight="bold" />
                                        {featuredPost.readTime}
                                    </span>
                                </div>
                                <h2 className={styles.featuredTitle}>
                                    {featuredPost.title}
                                </h2>
                                <p className={styles.featuredExcerpt}>
                                    {featuredPost.excerpt}
                                </p>
                                <div className={styles.featuredFooter}>
                                    <span className={styles.readMore}>
                                        Read Article
                                        <ArrowRight size={16} weight="bold" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </section>
                )}

                {/* Category Filters */}
                <section className={styles.filterSection}>
                    <div className={styles.sectionLabel}>
                        <span className={styles.labelDot} />
                        All Articles
                    </div>
                    <div className={styles.categoryFilters}>
                        {BLOG_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterActive : ""
                                    }`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Blog Grid */}
                <section className={styles.gridSection}>
                    {filteredPosts.length > 0 ? (
                        <div className={styles.blogGrid}>
                            {filteredPosts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className={styles.blogCard}
                                >
                                    <div className={styles.cardImage}>
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                        />
                                        <span className={styles.cardCategory}>
                                            {post.category}
                                        </span>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <div className={styles.cardMeta}>
                                            <span>
                                                <Clock
                                                    size={13}
                                                    weight="bold"
                                                />
                                                {post.readTime}
                                            </span>
                                        </div>
                                        <h3 className={styles.cardTitle}>
                                            {post.title}
                                        </h3>
                                        <p className={styles.cardExcerpt}>
                                            {post.excerpt}
                                        </p>
                                        <div className={styles.cardFooter}>
                                            <span className={styles.cardCategory2}>
                                                {post.category}
                                            </span>
                                            <span
                                                className={
                                                    styles.cardReadMore
                                                }
                                            >
                                                <ArrowRight
                                                    size={16}
                                                    weight="bold"
                                                />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <MagnifyingGlass
                                size={48}
                                weight="duotone"
                                color="#94a3b8"
                            />
                            <h3>No articles found</h3>
                            <p>
                                Try adjusting your filter to find
                                what you&apos;re looking for.
                            </p>
                        </div>
                    )}
                </section>


            </div>
        </div>
    );
}
