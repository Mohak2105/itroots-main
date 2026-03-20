'use client';

import React from 'react';
import styles from '../legal.module.css';

export default function RefundPolicy() {
    return (
        <main>
            <section className={styles.legalHeader}>
                <div className="container">
                    <h1>Refund Policy</h1>
                    <p>Our commitment to customer satisfaction</p>
                </div>
            </section>

            <section className={styles.contentSection}>
                <div className="container">
                    <div className={styles.content}>
                        <h2>1. Course Refund Policy</h2>
                        <p>
                            At ITROOTS, we strive to provide the best learning experience. We understand that sometimes plans change. Our refund policy is designed to be fair and transparent.
                        </p>

                        <h2>2. Refund Eligibility</h2>
                        <p>
                            To be eligible for a refund, you must submit a request within 7 days of your purchase date. The course progress must not exceed 10% of the total content.
                        </p>
                        <ul>
                            <li>Requests made after 7 days of purchase will not be accepted.</li>
                            <li>If you have accessed significant portions of the course material or downloaded resources, you may not be eligible for a full refund.</li>
                        </ul>

                        <h2>3. Process for Requesting a Refund</h2>
                        <p>
                            To request a refund, please email our support team at info@itroots.co.in with your transaction details and the reason for the refund request. Our team will review your request and respond within 3-5 business days.
                        </p>

                        <h2>4. Refund Processing</h2>
                        <p>
                            Once a refund is approved, it will be processed within 5-7 business days. The amount will be credited back to the original method of payment. Please note that it may take additional time for your bank or credit card company to post the refund to your account.
                        </p>

                        <h2>5. Non-Refundable Items</h2>
                        <p>
                            Certain items or services may not be refundable, such as:
                        </p>
                        <ul>
                            <li>Registration fees (if applicable)</li>
                            <li>Personalized coaching sessions that have already been conducted</li>
                            <li>Downloaded digital products</li>
                        </ul>

                        <h2>6. Contact Us</h2>
                        <p>
                            If you have any questions about our Refund Policy, please contact us at:
                        </p>
                        <p>
                            <strong>ITROOTS Pvt Ltd</strong><br />
                            Office No. 205 & 206, 2nd floor, Rainbow Plaza,<br />
                            Jangali Maharaj Road, opposite Modern High School,<br />
                            Deccan, Shivajinagar, Pune, Mh. 411005<br />
                            Email: info@itroots.co.in<br />
                            Phone: +(91) 8877202122
                        </p>

                        <div className={styles.lastUpdated}>
                            Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
