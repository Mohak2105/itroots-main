import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    Clock,
    Monitor,
    Users,
    Award,
    CheckCircle,
    ChevronDown,
    ArrowRight,
    Briefcase,
    BookOpen,
    Target,
    Star,
    Download,
    Terminal,
    HelpCircle,
    ShieldCheck,
    Laptop,
    Trophy,
    Gem,
    Rocket,
    Headphones,
    FileCheck,
    Layers
} from 'lucide-react';
import {
    Trophy as PhTrophy,
    Headset as PhHeadset,
    UsersThree as PhUsers,
    Laptop as PhLaptop,
    ShieldCheck as PhShieldCheck,
    RocketLaunch as PhRocket,
    Stack as PhStack,
    ClipboardText as PhClipboardText,
    CheckCircle as PhCheckCircle,
    SealCheck as PhSealCheck,
    Handshake as PhHandshake,
    Books as PhBooks,
    Wrench as PhWrench,
    Monitor as PhMonitor,
    DownloadSimple as PhDownload
} from '@phosphor-icons/react/dist/ssr';
import { courses, getCourseBySlug } from '@/data/courses';
import { testimonials } from '@/data/testimonials';
import { ToolsSlider } from '@/components/courses/ToolsSlider';
import { TestimonialsSlider } from '@/components/courses/TestimonialsSlider';
import { PremiumTestimonials } from '@/components/courses/PremiumTestimonials';
import { ToolsGravity } from '@/components/ui/ToolsGravity';
import { ApplyNowModal } from '@/components/courses/ApplyNowModal';
import { JavaVisual, CyberVisual, AIVisual, TestingVisual, DotNetVisual, BAVisual, DAVisual, DAPythonVisual, HRVisual, DSVisual } from '@/components/courses/HeroVisuals';
import styles from './page.module.css';

const toolIcons: Record<string, string> = {
    'Python': '/images/tools/data-science-with-ai/python-svgrepo-com (1).svg',
    'SQL': '/images/tools/data-science-with-ai/sql-database-generic-svgrepo-com.svg',
    'Power BI': '/images/tools/data-analytics-python/Power-BI-Logo-2013.png',
    'Tableau': '/images/tools/data-science-with-ai/tableau-svgrepo-com.svg',
    'TensorFlow': '/images/tools/data-science-with-ai/tensorflow-enterprise-svgrepo-com.svg',
    'PyTorch': '/images/tools/data-science-with-ai/pytorch-svgrepo-com.svg',
    'Excel': '/images/tools/data-science-with-ai/excel2-svgrepo-com.svg',
    'R': '/images/tools/data-science-with-ai/Rlogo.png',

    // New Data Science Mappings
    'NumPy': '/images/tools/data-science-with-ai/numpy-svgrepo-com.svg',
    'Machine Learning': '/images/tools/data-science-with-ai/machine-learning-svgrepo-com.svg',
    'Deep Learning': '/images/tools/data-science-with-ai/deep-learning-svgrepo-com.svg',
    'Data Analytics': '/images/tools/data-science-with-ai/data-analytics-bars-graphic-svgrepo-com.svg',
    'Statistics': '/images/tools/data-science-with-ai/statistics-svgrepo-com.svg',
    'AWS': '/images/tools/data-science-with-ai/aws-svgrepo-com.svg',

    // Data Analytics with Python Tools
    'Jupyter': '/images/tools/data-analytics-python/jupyter-svgrepo-com.svg',
    'Pandas': '/images/tools/data-analytics-python/pandas-svgrepo-com.svg',
    'MatplotlibSeaborn': '/images/tools/data-analytics-python/MatplotlibSeaborn.png',

    'Generative AI Tools': '/images/tools/artificial-intelligence/ai.svg',
    'Generative AI': '/images/tools/artificial-intelligence/ai.svg',
    'Amazon Bedrock': '/images/tools/artificial-intelligence/Amazon.png',
    'Prompt Engineering': '/images/tools/artificial-intelligence/prompt-engineering-logo.png',
    'Transformers & LLMs': '/images/tools/artificial-intelligence/llm.svg',
    'NLP': '/images/tools/artificial-intelligence/nlp.svg',
    'Generative AI APIs': '/images/tools/artificial-intelligence/ai.svg',
    'MySQL': '/images/tools/full-stack-java-certification/mysql.svg',

    // Java Full Stack Tools
    'Core Java': '/images/tools/full-stack-java-certification/java.svg',
    'Java': '/images/tools/full-stack-java-certification/java.svg',
    'Spring Boot': '/images/tools/full-stack-java-certification/spring-boot.svg',
    'Hibernate': '/images/tools/full-stack-java-certification/hibernate.svg',
    'HTML': '/images/tools/html.svg', // Global fallback
    'CSS': '/images/tools/css.svg',
    'HTML/CSS': '/images/tools/html.svg', // For backward compatibility if needed
    'JavaScript': '/images/tools/javascript.svg', // Global fallback
    'Bootstrap': '/images/tools/full-stack-java-certification/bootstrap.svg',
    'React': '/images/tools/full-stack-java-certification/react-js.svg',
    'Angular': '/images/tools/full-stack-java-certification/angular.svg',
    'Git': '/images/tools/full-stack-java-certification/git.svg',
    'JIRA': '/images/tools/business-analyst/jira.png',
    'Jenkins': '/images/tools/full-stack-java-certification/jenkins.svg',

    // Cyber Security Tools
    'Kali Linux': '/images/tools/cyber-security-job-guarantee/kalilinux.svg',
    'Metasploit': '/images/tools/cyber-security-job-guarantee/metasploite1.svg',
    'Burp Suite': '/images/tools/cyber-security-job-guarantee/Burp Suite 2.png',
    'Wireshark': '/images/tools/cyber-security-job-guarantee/wireshark.svg',
    'Nmap': '/images/tools/cyber-security-job-guarantee/nmap.svg',
    'Nessus': '/images/tools/cyber-security-job-guarantee/nessus.svg',
    'OWASP ZAP': '/images/tools/cyber-security-job-guarantee/OWASP ZAP.png',
    'PowerShell': '/images/tools/cyber-security-job-guarantee/powershell.png',
    'Security Tools': '/images/tools/cyber-security-job-guarantee/kalilinux.svg',

    // Software Testing Tools
    'Selenium': '/images/tools/software-testing/selenium-svgrepo-com.svg',
    'Postman': '/images/tools/software-testing/postman-icon-svgrepo-com.svg',
    'REST Assured': '/images/tools/software-testing/rest-assured.svg',
    'JMeter': '/images/tools/software-testing/apachejmeter-svgrepo-com.svg',
    'TestNG': '/images/tools/software-testing/testng.svg',
    'JUnit': '/images/tools/software-testing/junit.svg',
    'Maven': '/images/tools/software-testing/maven-svgrepo-com.svg',
    'Bugzilla': '/images/tools/software-testing/bugzilla-svgrepo-com.svg',

    // HR Generalist Tools
    'LinkedIn Recruiter': '/images/tools/hr-generalist/linkedin.svg',
    'Naukri Portal': '/images/tools/hr-generalist/naukri.svg',
    'Monster Portal': '/images/tools/hr-generalist/naukri.svg', // Fallback to Naukri logo or similar
    'ATS Tools': '/images/tools/hr-generalist/ats-tools.svg',
    'Payroll Systems': '/images/tools/hr-generalist/payroll-systems.svg',
    'HR Analytics Tools': '/images/tools/hr-generalist/hr-analytics.svg',
    'Zoom Info': '/images/tools/hr-generalist/naukri.svg', // Fallback

    // Dot Net Program Tools
    'C#': '/images/tools/dot-net-program/Csharp_Logo.png',
    'ASP.NET Core': '/images/tools/dot-net-program/asp .net.png',
    'MVC': '/images/tools/dot-net-program/mvc.png',
    'Entity Framework': '/images/tools/dot-net-program/sql server.svg', // Fallback to SQL Server icon
    'Azure': '/images/tools/dot-net-program/azure.png',
    'SQL Server': '/images/tools/dot-net-program/sql server.svg',

    // Business Analyst Tools
    'Confluence': '/images/tools/business-analyst/Confluence-Emblem.png',
    'Balsamiq/Figma': '/images/tools/business-analyst/figma-svgrepo-com.svg',
    'UML': '/images/tools/business-analyst/uml.png',
};

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    return courses.map((course) => ({
        slug: course.slug,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const course = getCourseBySlug(slug);

    if (!course) {
        return {
            title: 'Course Not Found',
        };
    }

    return {
        title: `${course.title} - ITROOTS`,
        description: course.fullDescription,
        keywords: [...course.jobRoles, course.category, 'IT training', 'certification'],
        openGraph: {
            title: course.title,
            description: course.shortDescription,
            type: 'website',
        },
    };
}

export default async function CoursePage({ params }: Props) {
    const { slug } = await params;
    const course = getCourseBySlug(slug);

    if (!course) {
        notFound();
    }

    const relatedCourses = courses
        .filter(c => c.category === course.category && c.slug !== course.slug)
        .slice(0, 3);

    const heroGradients: Record<string, string> = {
        'data-science-with-ai': 'linear-gradient(135deg, #0f172a 0%, #172554 50%, #1e3a8a 100%)',
        'full-stack-java-certification': 'linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%)', // Light blue-gray
        'cyber-security-job-guarantee': 'linear-gradient(135deg, #ffffff 0%, #ecfeff 100%)', // Light cyan
        'data-analytics-python': 'linear-gradient(135deg, #ffffff 0%, #ecfeff 100%)', // Light cyan
        'artificial-intelligence': 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', // Light green
        'dot-net-program': 'linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)', // Light rose
        'business-analyst': 'linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)', // Light indigo
        'data-analytics': 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)', // Light emerald
        'software-testing': 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)', // Light purple
        'hr-generalist': 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)', // Light teal
    };

    const heroGradient = heroGradients[course.slug] || `linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)`;

    // Logic for 6 Testimonials - Prioritize relevant, backfill with others
    const relevantTestimonials = testimonials.filter(t =>
        t.course.toLowerCase().includes(course.title.split(' ')[0].toLowerCase()) ||
        course.title.toLowerCase().includes(t.course.split(' ')[0].toLowerCase())
    );
    const otherTestimonials = testimonials.filter(t => !relevantTestimonials.includes(t));
    const displayTestimonials = [...relevantTestimonials, ...otherTestimonials].slice(0, 6);

    const isDS = course.slug === 'data-science-with-ai';
    const isJava = course.slug === 'full-stack-java-certification';
    const isCyber = course.slug === 'cyber-security-job-guarantee';
    const isAI = course.slug === 'artificial-intelligence';
    const isDA = course.slug === 'data-analytics';
    const isDAPython = course.slug === 'data-analytics-python';
    const isTesting = course.slug === 'software-testing';
    const isDotNet = course.slug === 'dot-net-program';
    const isBA = course.slug === 'business-analyst';
    const isHR = course.slug === 'hr-generalist';

    return (
        <>
            {/* Hero Section */}
            <section className={`${styles.hero} ${!isDS ? styles.heroLight : ''}${isDS ? ` ${styles.heroDataScience}` : ''}${isJava ? ` ${styles.heroJava}` : ''}${isCyber ? ` ${styles.heroCyber}` : ''}${isAI ? ` ${styles.heroAI}` : ''}${isDA ? ` ${styles.heroDA}` : ''}${isDAPython ? ` ${styles.heroDAPython}` : ''}${isTesting ? ` ${styles.heroTesting}` : ''}${isDotNet ? ` ${styles.heroDotNet}` : ''}${isBA ? ` ${styles.heroBA}` : ''}${isHR ? ` ${styles.heroHR}` : ''}`} style={{ background: heroGradient }}>

                <div className={styles.container}>
                    <div className={`${styles.breadcrumb}${isDS ? ` ${styles.breadcrumbDS}` : ''}`}>
                        <Link href="/">Home</Link>
                        <span>/</span>
                        <Link href="/courses">Courses</Link>
                        <span>/</span>
                        <span>{course.shortTitle}</span>
                    </div>
                    <div className={styles.heroContent}>
                        <div className={styles.heroText}>
                            {course.isJobGuarantee && (
                                <span className={`${styles.jobBadge}${isDS ? ` ${styles.jobBadgeDS}` : ''}`}>
                                    <Award size={16} />
                                    100% Job Guarantee
                                </span>
                            )}
                            <h1>{course.title}</h1>
                            <p>{course.fullDescription}</p>
                            <div className={styles.heroBadgesRow}>
                                <div className={`${styles.glassBadge} ${styles.glassBadgeDuration}${isDS ? ` ${styles.glassBadgeDurationDS}` : ''}`}>
                                    <Clock size={16} />
                                    <span>{course.duration}</span>
                                </div>
                                <div className={`${styles.glassBadge} ${styles.glassBadgeMode}${isDS ? ` ${styles.glassBadgeModeDS}` : ''}`}>
                                    <Monitor size={16} />
                                    <span>Online & Offline Class</span>
                                </div>
                            </div>
                            <div className={styles.heroButtons}>
                                <ApplyNowModal
                                    courseTitle={course.title}
                                    price={course.price}
                                    discountedPrice={course.discountedPrice}
                                    enrollUrl="/contact"
                                />
                                {course.brochureUrl && (
                                    <a
                                        href={course.brochureUrl}
                                        download
                                        className={`${styles.downloadBtn}${isDS ? ` ${styles.downloadBtnDS}` : ''}`}
                                    >
                                        <Download size={18} />
                                        Download Brochure
                                    </a>
                                )}
                            </div>
                        </div>

                        {isDS && <DSVisual />}


                        {isJava && <JavaVisual />}
                        {isTesting && <TestingVisual />}
                        {isAI && <AIVisual />}
                        {isCyber && <CyberVisual />}
                        {isDotNet && <DotNetVisual />}
                        {isBA && <BAVisual />}
                        {isHR && <HRVisual />}
                        {isDA && !isDS && <DAVisual />}
                        {isDAPython && <DAPythonVisual />}

                    </div>
                </div>
            </section>


            {/* Old Tools Section */}
            {/* Tools Section - Hidden for DS as it's redesigned above */}
            {course.tools && !isDS && (
                <section className={styles.toolsSectionDS}>
                    <div className={styles.container}>
                        <div className={styles.sectionHeader}>
                            <h2>Tools You Will Learn</h2>
                            <p>Master the industry-standard tools and technologies</p>
                        </div>
                        <ToolsSlider tools={course.tools.map(tool => {
                            const sanitized = tool.toLowerCase().replace(/[^a-z0-9]/g, '-');
                            let iconPath = toolIcons[tool];

                            if (!iconPath) {
                                const fuzzyKey = Object.keys(toolIcons).find(k => tool.toLowerCase().includes(k.toLowerCase()));
                                if (fuzzyKey) iconPath = toolIcons[fuzzyKey];
                            }

                            // Fallback to course-specific folder structure
                            if (!iconPath) {
                                iconPath = `/images/tools/${course.slug}/${sanitized}.svg`;
                            }

                            return { name: tool, icon: iconPath };
                        })} />
                    </div>
                </section>
            )}

            {/* Curriculum Section */}
            <section id="curriculum" className={styles.curriculumSection}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <h2>Course Curriculum</h2>
                        <p>Comprehensive modules designed by industry experts</p>
                    </div>
                    {['data-science-with-ai', 'full-stack-java-certification', 'cyber-security-job-guarantee', 'data-analytics-python', 'artificial-intelligence', 'dot-net-program', 'business-analyst', 'data-analytics', 'software-testing', 'hr-generalist'].includes(course.slug) ? (
                        <div className={styles.curriculumLayout}>
                            <div className={styles.curriculumContent}>
                                {course.slug === 'data-science-with-ai' ? (
                                    <div className={styles.newAccordionList}>
                                        {course.curriculum.map((module, index) => (
                                            <details key={index} className={styles.newAccordionItem} open={index === 0}>
                                                <summary className={styles.newAccordionHeader}>
                                                    <span className={styles.blueDotOuter} />
                                                    <div className={styles.newAccordionTitleArea}>
                                                        <span className={styles.newAccordionSubtitle}>
                                                            Module {index + 1}
                                                        </span>
                                                        <h3 className={styles.newAccordionTitle}>{module.module}</h3>
                                                    </div>
                                                    <ChevronDown size={20} className={styles.newAccordionChevron} />
                                                </summary>
                                                <div className={styles.newAccordionBody}>
                                                    <div className={styles.newAccordionBodyGrid}>
                                                        <h4 className={styles.colHeading}>Topics covered</h4>
                                                        <ul className={styles.topicsListNew}>
                                                            {module.topics.map((topic, i) => (
                                                                <li key={i}>
                                                                    <CheckCircle size={16} />
                                                                    <span>{topic}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </details>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.curriculumTimeline}>
                                        <div className={styles.timelineLine} />
                                        {course.curriculum.map((module, index) => (
                                            <div key={index} className={styles.timelineItem}>
                                                <div className={styles.timelineDot}>{index + 1}</div>
                                                <details className={styles.moduleItem} open={index === 0}>
                                                    <summary className={styles.moduleSummary}>
                                                        <div className={styles.moduleInfo}>
                                                            <h3>{module.module}</h3>
                                                        </div>
                                                        <ChevronDown size={20} className={styles.accordionIcon} />
                                                    </summary>
                                                    <div className={styles.moduleContent}>
                                                        <ul className={styles.topicsList}>
                                                            {module.topics.map((topic, i) => (
                                                                <li key={i}>
                                                                    <BookOpen size={16} />
                                                                    {topic}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </details>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className={styles.curriculumSidebar}>
                                {isDS ? (
                                    <>
                                        <div className={styles.sidebarCardDSWrapper}>
                                            <div className={styles.sidebarCardDS}>
                                            </div>
                                            <div className={styles.sidebarStatsDS}>
                                                <div className={styles.statCardDS}>
                                                    <div className={styles.statIconWrapperDS}>
                                                        <PhBooks size={28} weight="duotone" />
                                                    </div>
                                                    <div className={styles.statContentDS}>
                                                        <span className={styles.statValueDS}>12+</span>
                                                        <span className={styles.statLabelDS}>Comprehensive Modules</span>
                                                    </div>
                                                </div>

                                                <div className={styles.statCardDS}>
                                                    <div className={styles.statIconWrapperDS}>
                                                        <PhWrench size={28} weight="duotone" />
                                                    </div>
                                                    <div className={styles.statContentDS}>
                                                        <span className={styles.statValueDS}>10+</span>
                                                        <span className={styles.statLabelDS}>Tools & Technologies</span>
                                                    </div>
                                                </div>

                                                <div className={styles.statCardDS}>
                                                    <div className={styles.statIconWrapperDS}>
                                                        <Monitor size={28} strokeWidth={2} />
                                                    </div>
                                                    <div className={styles.statContentDS}>
                                                        <span className={styles.statValueDS}>280+</span>
                                                        <span className={styles.statLabelDS}>Live Sessions Hours</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.sidebarToolsCardDS}>
                                            <div className={styles.toolsLabelDS}>Tools You Will Learn</div>
                                            <div className={styles.toolsGridDS}>
                                                {[
                                                    { name: 'AWS', icon: '/images/tools/data-science-with-ai/aws-svgrepo-com.svg' },
                                                    { name: 'Python', icon: '/images/tools/data-science-with-ai/python-svgrepo-com (1).svg' },
                                                    { name: 'SQL', icon: '/images/tools/data-science-with-ai/sql-database-generic-svgrepo-com.svg' },
                                                    { name: 'NumPy', icon: '/images/tools/data-science-with-ai/numpy-svgrepo-com.svg' },
                                                    { name: 'TensorFlow', icon: '/images/tools/data-science-with-ai/tensorflow-enterprise-svgrepo-com.svg' },
                                                    { name: 'PyTorch', icon: '/images/tools/data-science-with-ai/pytorch-svgrepo-com.svg' },
                                                    { name: 'Excel', icon: '/images/tools/data-science-with-ai/excel2-svgrepo-com.svg' },
                                                    { name: 'Tableau', icon: '/images/tools/data-science-with-ai/tableau-svgrepo-com.svg' },
                                                    { name: 'R', icon: '/images/tools/data-science-with-ai/Rlogo.png' },
                                                    { name: 'Machine Learning', icon: '/images/tools/data-science-with-ai/machine-learning-svgrepo-com.svg' },
                                                    { name: 'Deep Learning', icon: '/images/tools/data-science-with-ai/deep-learning-svgrepo-com.svg' },
                                                    { name: 'Statistics', icon: '/images/tools/data-science-with-ai/statistics-svgrepo-com.svg' },
                                                    { name: 'Data Analytics', icon: '/images/tools/data-science-with-ai/data-analytics-bars-graphic-svgrepo-com.svg' },
                                                    { name: 'Git', icon: '/images/tools/full-stack-java-certification/git.svg' }
                                                ].map((tool, idx) => (
                                                    <div key={idx} className={styles.toolPillDS} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Image src={tool.icon} alt={tool.name} width={18} height={18} style={tool.name === 'Tableau' ? { transform: 'scale(1.2)' } : undefined} />
                                                        <span>{tool.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.sidebarCard}>
                                        <div className={styles.sidebarTitle}>
                                            Master {course.title}
                                        </div>
                                        <div className={styles.sidebarDesc}>
                                            {course.slug === 'cyber-security-job-guarantee'
                                                ? `A complete 6-month roadmap with ${course.curriculum.length}+ modules, covering everything from Ethical Hacking & Network Defense to Web Security & SOC.`
                                                : course.slug === 'data-analytics-python'
                                                    ? `A complete 6-month roadmap with ${course.curriculum.length}+ modules, covering everything from Python & SQL to Power BI, Tableau & Machine Learning.`
                                                    : course.slug === 'artificial-intelligence'
                                                        ? `A short-term intensive roadmap with ${course.curriculum.length}+ modules, focusing on Generative AI, Amazon Bedrock, and Model Fine-tuning.`
                                                        : course.slug === 'dot-net-program'
                                                            ? `A complete 6-month roadmap with ${course.curriculum.length}+ modules, covering everything from C# & SQL Server to ASP.NET Core MVC & Angular.`
                                                            : course.slug === 'business-analyst'
                                                                ? `A complete 3-month roadmap with ${course.curriculum.length}+ modules, covering everything from Requirements Engineering & UML to SQL & Excel Insights.`
                                                                : course.slug === 'data-analytics'
                                                                    ? `A complete 3-month roadmap with ${course.curriculum.length}+ modules, covering everything from Advanced Excel & SQL to Power BI & Tableau.`
                                                                    : course.slug === 'software-testing'
                                                                        ? `A complete 6-month roadmap with ${course.curriculum.length}+ modules, covering everything from Manual Testing & Java to Selenium, API & Frameworks.`
                                                                        : course.slug === 'hr-generalist'
                                                                            ? `A complete 3-month roadmap with ${course.curriculum.length}+ modules, covering everything from Recruitment & Payroll to HR Analytics & Operational Excellence.`
                                                                            : `A complete 6-month roadmap with ${course.curriculum.length}+ modules, covering everything from Core Java & Spring Boot to Frontend & AI Integration.`
                                            }
                                        </div>

                                        <div className={styles.sidebarStats}>
                                            <div className={styles.statCard}>
                                                <div className={styles.statIconWrapper}>
                                                    <PhBooks size={24} weight="duotone" />
                                                </div>
                                                <div className={styles.statContent}>
                                                    <span className={styles.statValue}>{course.curriculum.length}+</span>
                                                    <span className={styles.statLabel}>Comprehensive Modules</span>
                                                </div>
                                            </div>

                                            <div className={styles.statCard}>
                                                <div className={styles.statIconWrapper}>
                                                    <PhWrench size={24} weight="duotone" />
                                                </div>
                                                <div className={styles.statContent}>
                                                    <span className={styles.statValue}>{course.tools?.length || 0}+</span>
                                                    <span className={styles.statLabel}>Tools & Technologies</span>
                                                </div>
                                            </div>
                                            <div className={styles.statCard}>
                                                <div className={styles.statIconWrapper}>
                                                    <PhMonitor size={24} weight="duotone" />
                                                </div>
                                                <div className={styles.statContent}>
                                                    <span className={styles.statValue}>280+</span>
                                                    <span className={styles.statLabel}>Live Sessions Hours</span>
                                                </div>
                                            </div>
                                        </div>
                                        {course.brochureUrl && (
                                            <a
                                                href={course.brochureUrl}
                                                download
                                                className={styles.priceBrochureBtn}
                                            >
                                                <Download size={18} />
                                                Download Brochure
                                            </a>
                                        )}
                                    </div>
                                )}


                            </div>
                        </div>
                    ) : (
                        <div className={styles.curriculumAccordion}>
                            {course.curriculum.map((module, index) => (
                                <details key={index} className={styles.moduleItem} open={index === 0}>
                                    <summary className={styles.moduleSummary}>
                                        <div className={styles.moduleInfo}>
                                            <span className={styles.moduleNumber}>Module {index + 1}</span>
                                            <h3>{module.module}</h3>
                                        </div>
                                        <ChevronDown size={20} className={styles.accordionIcon} />
                                    </summary>
                                    <div className={styles.moduleContent}>
                                        <ul className={styles.topicsList}>
                                            {module.topics.map((topic, i) => (
                                                <li key={i}>
                                                    <BookOpen size={16} />
                                                    {topic}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </details>
                            ))}
                        </div>
                    )}
                </div>
            </section>



            {/* Projects Section */}
            {course.projects && (
                <section className={styles.projectsSection}>
                    <div
                        className={`${styles.projectsHeaderWrapper}${isDS ? ` ${styles.projectsHeaderDS}` : ''}`}
                        style={{
                            background: isDS
                                ? `url('/images/projects/data-science-with-ai/Real-World%20Projects.png') center/cover no-repeat`
                                : heroGradient
                        }}
                    >
                        <div className={styles.container}>
                            <div className={styles.sectionHeader}>
                                <h2 style={{ color: isDS ? 'var(--white)' : 'var(--text-dark)' }}>Real-World Projects</h2>
                                <p style={{ color: isDS ? 'rgba(255, 255, 255, 0.8)' : 'var(--gray)' }}>Build your portfolio with hands-on capstone projects</p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.container}>
                        <div className={styles.projectsGrid}>
                            {course.projects.map((project, index) => (
                                <div key={index} className={styles.projectCard}>
                                    <div className={styles.projectImageWrapper}>
                                        {project.image ? (
                                            <Image
                                                src={project.image}
                                                alt={project.title}
                                                fill
                                                className={styles.projectImage}
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                quality={95}
                                            />
                                        ) : (
                                            <div className={styles.projectImagePlaceholder} style={{
                                                width: '100%',
                                                height: '100%',
                                                background: `linear-gradient(135deg, ${course.color}20 0%, ${course.color}40 100%)`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: course.color
                                            }}>
                                                <PhStack size={48} weight="duotone" />
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.projectContent}>
                                        <h3>{project.title}</h3>
                                        <p>{project.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}







            {/* Success Stories Section */}
            {isDS ? (
                <PremiumTestimonials testimonials={displayTestimonials} />
            ) : (
                <TestimonialsSlider testimonials={displayTestimonials} gradient={heroGradient} isLight={!isDS} />
            )}

            {/* Program Advantages Section - Exclusive to Selected Courses */}
            {['data-science-with-ai', 'full-stack-java-certification', 'cyber-security-job-guarantee', 'data-analytics-python', 'artificial-intelligence', 'dot-net-program', 'business-analyst', 'data-analytics', 'software-testing', 'hr-generalist'].includes(course.slug) && course.highlights && (
                <section className={styles.programAdvantageSection}>
                    {/* Banner Lead */}
                    <div className={styles.advantageBanner}>
                        <div className={styles.container}>
                            <h2>Program Advantages</h2>
                            <p>Built for learners who want real placement outcomes. Every benefit below is designed to help you gain practical skills, build confidence, and secure better career opportunities.</p>
                        </div>
                    </div>

                    {/* Highlights Grid with Custom Icons */}
                    <div className={styles.container}>
                        <div className={styles.advantageGrid}>
                            {course.highlights.map((highlight, index) => {
                                // Map icons based on text content
                                let Icon = PhCheckCircle;
                                if (highlight.includes('Placement Guarantee')) Icon = PhSealCheck;
                                else if (highlight.includes('Support')) Icon = PhHandshake;
                                else if (highlight.includes('Placement')) Icon = PhTrophy; // Fallback for other placement text
                                else if (highlight.includes('Mentorship')) Icon = PhUsers;
                                else if (highlight.includes('Practical')) Icon = PhLaptop;
                                else if (highlight.includes('Refund')) Icon = PhShieldCheck;
                                else if (highlight.includes('Career')) Icon = PhRocket;
                                else if (highlight.includes('Project')) Icon = PhStack;
                                else if (highlight.includes('Assessments')) Icon = PhClipboardText;

                                return (
                                    <div key={index} className={styles.advantageCard}>
                                        <div className={styles.advantageIconWrapper}>
                                            <Icon size={24} className={styles.advantageIcon} />
                                        </div>
                                        <span className={styles.advantageText}>{highlight}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* FAQ Section */}
            {course.faqs && (
                <section className={styles.faqSection}>
                    <div className={styles.container}>
                        <div className={styles.sectionHeader}>
                            <h2>Frequently Asked Questions</h2>
                            <p>Everything you need to know about the program</p>
                        </div>
                        <div className={styles.faqAccordion}>
                            {course.faqs.map((faq, index) => (
                                <details key={index} className={styles.faqItem}>
                                    <summary className={styles.faqSummary}>
                                        <span>{faq.question}</span>
                                        <ChevronDown size={20} className={styles.accordionIcon} />
                                    </summary>
                                    <div className={styles.faqContent}>
                                        <p>{faq.answer}</p>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className={styles.ctaSection}>
                <div className={styles.container}>
                    <div className={`${styles.ctaBox} ${styles.ctaBoxDS}`} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #172554 50%, #1e3a8a 100%)' }}>
                        <div className={styles.ctaContent}>
                            <h2>Ready to Start Your Journey?</h2>
                            <p>Join our next batch and take the first step towards your dream career</p>
                            <div className={styles.ctaButtons}>
                                <Link href="/contact" className={styles.ctaBtnPrimary}>
                                    Enroll Now
                                    <ArrowRight size={18} />
                                </Link>
                                <Link href="/contact" className={styles.ctaBtnOutline}>
                                    Request Callback
                                </Link>
                            </div>
                        </div>

                        <div className={styles.ctaImageWrapper}>
                            <Image
                                src="/images/projects/data-science-with-ai/jounery2.png"
                                alt="Your Learning Journey"
                                width={500}
                                height={500}
                                className={styles.ctaImage}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
