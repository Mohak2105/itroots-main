'use client';

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS } from "@/data/blog-data";
import styles from "./post.module.css";
import {
    ArrowLeft,
    Clock,
    ShareNetwork,
    BookmarkSimple,
    ArrowRight,
} from "@/components/icons/lucide-phosphor";

interface Props {
    params: Promise<{
        slug: string;
    }>;
}

export default function BlogPostDetail({ params }: Props) {
    const { slug } = use(params);
    const post = BLOG_POSTS.find((p) => p.slug === slug);

    if (!post) {
        notFound();
    }

    // Related posts (same category, different post)
    const relatedPosts = BLOG_POSTS.filter(
        (p) => p.category === post.category && p.id !== post.id
    ).slice(0, 3);

    // Simple markdown-to-HTML renderer
    const renderContent = (content: string) => {
        return content
            .replace(/## (.+)/g, '<h2>$1</h2>')
            .replace(/### (.+)/g, '<h3>$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/^- (.+)/gm, '<li>$1</li>')
            .replace(/^(\d+)\. (.+)/gm, '<li>$2</li>')
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br/>');
    };

    return (
        <div className={styles.postPage}>
            {/* Hero Header */}
            <header className={styles.postHeader}>
                <div className={styles.headerOverlay} />
                <div className={styles.headerContainer}>
                    <Link href="/blog" className={styles.backBtn}>
                        <ArrowLeft size={18} weight="bold" />
                        Back to Blog
                    </Link>

                    <div className={styles.postMeta}>
                        <span className={styles.categoryBadge}>
                            {post.category}
                        </span>
                        <span className={styles.metaItem}>
                            <Clock size={14} weight="bold" />
                            {post.readTime}
                        </span>
                    </div>

                    <h1 className={styles.postTitle}>{post.title}</h1>
                    <p className={styles.postExcerpt}>{post.excerpt}</p>

                    <div className={styles.authorBar}>
                        <div className={styles.actionBtns}>
                            <button className={styles.iconBtn} title="Share">
                                <ShareNetwork size={18} weight="bold" />
                            </button>
                            <button className={styles.iconBtn} title="Bookmark">
                                <BookmarkSimple size={18} weight="bold" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Cover Image */}
            <div className={styles.coverWrapper}>
                <img
                    src={post.image}
                    alt={post.title}
                    className={styles.coverImage}
                />
            </div>

            {/* Content */}
            <article className={styles.articleContainer}>
                <div
                    className={styles.content}
                    dangerouslySetInnerHTML={{
                        __html: renderContent(post.content),
                    }}
                />
            </article>

            {/* CTA Section */}
            <section className={styles.ctaSection}>
                <div className={styles.ctaCard}>
                    <h3>Ready to level up your career?</h3>
                    <p>
                        Join our industry-aligned programs and get trained by
                        our experts.
                    </p>
                    <Link href="/courses" className={styles.ctaBtn}>
                        <span>Explore All Courses</span>
                        <ArrowRight size={18} weight="bold" />
                    </Link>
                </div>
            </section>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <section className={styles.relatedSection}>
                    <div className={styles.relatedHeader}>
                        <h2>More from {post.category}</h2>
                        <p>
                            Continue reading articles in the same category.
                        </p>
                    </div>
                    <div className={styles.relatedGrid}>
                        {relatedPosts.map((related) => (
                            <Link
                                key={related.id}
                                href={`/blog/${related.slug}`}
                                className={styles.relatedCard}
                            >
                                <div className={styles.relatedImage}>
                                    <img
                                        src={related.image}
                                        alt={related.title}
                                    />
                                </div>
                                <div className={styles.relatedBody}>
                                    <span className={styles.relatedCategory}>
                                        {related.category}
                                    </span>
                                    <h4>{related.title}</h4>
                                    <div className={styles.relatedMeta}>
                                        <span>{related.readTime}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
