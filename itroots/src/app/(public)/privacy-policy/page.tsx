'use client';

import React from 'react';
import styles from '../legal.module.css';

export default function PrivacyPolicy() {
    return (
        <main>
            <section className={styles.legalHeader}>
                <div className="container">
                    <h1>Privacy Policy</h1>
                    <p>How we collect, use, and protect your data</p>
                </div>
            </section>

            <section className={styles.contentSection}>
                <div className="container">
                    <div className={styles.content}>
                        <h2>1. Introduction</h2>
                        <p>
                            Welcome to ITROOTS. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy will inform you as to how we look after your personal data when you visit
                            our website and tell you about your privacy rights and how the law protects you.
                        </p>

                        <h2>2. Data We Collect</h2>
                        <p>
                            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                        </p>
                        <ul>
                            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                            <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
                            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform and other technology on the devices you use to access this website.</li>
                            <li><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
                        </ul>

                        <h2>3. How We Use Your Data</h2>
                        <p>
                            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                        </p>
                        <ul>
                            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                            <li>Where we need to comply with a legal or regulatory obligation.</li>
                        </ul>

                        <h2>4. Data Security</h2>
                        <p>
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
                        </p>

                        <h2>5. Contact Details</h2>
                        <p>
                            If you have any questions about this privacy policy or our privacy practices, please contact us at:
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
