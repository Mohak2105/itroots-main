"use client";

import LMSShell from "@/components/lms/LMSShell";
import { COURSES } from "@/data/lms-data";
import { Book, Folder } from "@phosphor-icons/react";
import styles from "../dashboard/dashboard.module.css";

export default function TeacherContent() {
    return (
        <LMSShell pageTitle="Content Access Management">
            <div className={styles.welcome}>
                <h2>Curriculum & Resources</h2>
                <p>Manage access levels and review course materials across all modules.</p>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>Active Course Content</div>
                {COURSES.map(course => (
                    <div key={course.id} className={styles.listItem} style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flex: 1 }}>
                            <div style={{ width: '40px', height: '40px', background: '#0881ec15', color: '#0881ec', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Book size={24} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{course.title}</div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{(course.modules || []).length} Modules · {course.totalDuration}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button style={{ background: '#0881ec', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>Edit Lessons</button>
                            <button style={{ background: '#f3f4f6', color: '#374151', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>Preview</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.section} style={{ marginTop: '2rem' }}>
                <div className={styles.sectionHeader}>Global Resource Library</div>
                <div style={{ padding: '1.5rem' }}>
                    <div style={{ color: '#0881ec', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Folder size={18} /> Shared PDF Library →
                    </div>
                    <div style={{ color: '#0881ec', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Folder size={18} /> Presentation Assets →
                    </div>
                    <div style={{ color: '#0881ec', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Folder size={18} /> Assignment Templates →
                    </div>
                </div>
            </div>
        </LMSShell>
    );
}
