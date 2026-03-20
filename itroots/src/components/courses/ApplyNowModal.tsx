'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { X, CheckCircle, ArrowRight } from 'lucide-react';
import styles from './ApplyNowModal.module.css';

interface ApplyNowModalProps {
    courseTitle: string;
    price: number;
    discountedPrice?: number;
    enrollUrl?: string;
}

export function ApplyNowModal({ courseTitle, price, discountedPrice, enrollUrl = '/contact' }: ApplyNowModalProps) {
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [open, close]);

    const displayPrice = discountedPrice ?? price;
    const savings = discountedPrice ? price - discountedPrice : 0;

    return (
        <>
            <button className={styles.triggerBtn} onClick={() => setOpen(true)} type="button">
                <ArrowRight size={17} /> Apply Now
            </button>

            {open && (
                <div className={styles.overlay} onClick={close}>
                    <div className={styles.card} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={close}><X size={16} /></button>
                        <p className={styles.label}>Course Fee</p>
                        <h2 className={styles.title}>{courseTitle}</h2>
                        <div className={styles.priceBox}>
                            <span className={styles.price}>₹{displayPrice.toLocaleString('en-IN')}</span>
                            {discountedPrice && (
                                <span className={styles.original}>₹{price.toLocaleString('en-IN')}</span>
                            )}
                            {discountedPrice && (
                                <span className={styles.saveBadge}>Save ₹{savings.toLocaleString('en-IN')}</span>
                            )}
                        </div>
                        <hr className={styles.hr} />
                        <ul className={styles.list}>
                            {['Live Interactive Sessions', 'Industry Projects', 'Certification', 'Placement Assistance', 'Lifetime Access'].map(f => (
                                <li key={f}><CheckCircle size={15} />{f}</li>
                            ))}
                        </ul>
                        <Link href={enrollUrl} className={styles.enrollBtn} onClick={close}>
                            Enroll Now <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
