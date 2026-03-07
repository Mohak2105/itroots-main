'use client';

import React from 'react';
import styles from '../legal.module.css';

export default function TermsOfService() {
    return (
        <main>
            <section className={styles.legalHeader}>
                <div className="container">
                    <h1>Terms of Service</h1>
                    <p>Rules and regulations for the use of ITROOTS' Website</p>
                </div>
            </section>

            <section className={styles.contentSection}>
                <div className="container">
                    <div className={styles.content}>
                        <h2>1. Agreement to Terms</h2>
                        <p>
                            By accessing or using our services, you agree to be bound by these Terms of Service. If you do not agree to abide by these Terms of Service, you are not authorized to use, access or participate in the service.
                        </p>

                        <h2>2. Intellectual Property Rights</h2>
                        <p>
                            Other than the content you own, under these Terms, ITROOTS and/or its licensors own all the intellectual property rights and materials contained in this Website. You are granted limited license only for purposes of viewing the material contained on this Website.
                        </p>

                        <h2>3. Restrictions</h2>
                        <p>
                            You are specifically restricted from all of the following:
                        </p>
                        <ul>
                            <li>Publishing any Website material in any other media;</li>
                            <li>Selling, sublicensing and/or otherwise commercializing any Website material;</li>
                            <li>Publicly performing and/or showing any Website material;</li>
                            <li>Using this Website in any way that is or may be damaging to this Website;</li>
                            <li>Using this Website in any way that impacts user access to this Website;</li>
                        </ul>

                        <h2>4. Course Content and Access</h2>
                        <p>
                            ITROOTS grants you a limited, non-exclusive, non-transferable license to access and view the courses and associated content for which you have paid all required fees, solely for your personal, non-commercial, educational purposes. All other uses are expressly prohibited.
                        </p>

                        <h2>5. Limitation of Liability</h2>
                        <p>
                            In no event shall ITROOTS, nor any of its officers, directors and employees, be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract. ITROOTS, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Website.
                        </p>

                        <h2>6. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at:
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
