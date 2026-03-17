'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import Link from 'next/link';
import { WordRotate } from '@/components/ui/word-rotate';
import Image from 'next/image';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  GraduationCap,
  Users,
  Building2,
  CheckCircle,
  Star,
  TrendingUp,
  Briefcase,
  BookOpen,
  Brain,
  Code2,
  Shield,
  BarChart3,
  Cpu,
  Layers,
  PieChart,
  TestTube2,
  Download,
  Clock,
  Link2,
  X,
  Lightbulb,
  MonitorPlay,
  Rocket
} from 'lucide-react';
import { courses } from '@/data/courses';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { testimonials } from '@/data/testimonials';
import { TestimonialsColumn } from '@/components/ui/TestimonialsColumns';
import CustomSelect from '@/components/ui/CustomSelect/CustomSelect';
import styles from './page.module.css';

const courseOptions = courses.map((course) => ({
  value: course.slug,
  label: course.shortTitle,
}));

const courseIcons: { [key: string]: React.ReactNode } = {
  'Brain': <Brain size={24} />,
  'Code2': <Code2 size={24} />,
  'Shield': <Shield size={24} />,
  'BarChart3': <BarChart3 size={24} />,
  'Cpu': <Cpu size={24} />,
  'Layers': <Layers size={24} />,
  'Briefcase': <Briefcase size={24} />,
  'PieChart': <PieChart size={24} />,
  'TestTube2': <TestTube2 size={24} />,
  'Users': <Users size={24} />
};

const companyLogos = Array.from({ length: 22 }, (_, index) => `${index + 1}.png`);

// Counter animation component
function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>;
}

export default function Home() {
  const featuredCourses = courses.slice(0, 6);
  const featuredTestimonials = [...testimonials, ...testimonials.slice(0, 2)];
  const [testimonialCardsPerView, setTestimonialCardsPerView] = useState(4);
  const [activeTestimonialSlide, setActiveTestimonialSlide] = useState(0);
  const [isTestimonialsPaused, setIsTestimonialsPaused] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    course: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isCounsellingModalOpen, setIsCounsellingModalOpen] = useState(false);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSubmitting(true);

    // Simulate form submission (replace with actual API call later)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setFormSubmitting(false);
    setFormSubmitted(true);
    setFormData({ name: '', email: '', phone: '', course: '' });

    // Reset success message after 5 seconds
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth <= 768) {
        setTestimonialCardsPerView(1);
      } else if (window.innerWidth <= 1200) {
        setTestimonialCardsPerView(2);
      } else {
        setTestimonialCardsPerView(4);
      }
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  const testimonialSlidesCount = Math.max(featuredTestimonials.length - testimonialCardsPerView + 1, 1);

  useEffect(() => {
    setActiveTestimonialSlide((prev) => Math.min(prev, Math.max(testimonialSlidesCount - 1, 0)));
  }, [testimonialSlidesCount]);

  useEffect(() => {
    if (isTestimonialsPaused || testimonialSlidesCount <= 1) {
      return;
    }

    const autoSlideTimer = setInterval(() => {
      setActiveTestimonialSlide((prev) => (prev + 1) % testimonialSlidesCount);
    }, 4000);

    return () => clearInterval(autoSlideTimer);
  }, [isTestimonialsPaused, testimonialSlidesCount]);



  return (
    <>
      {/* Hero Section (White Design with Form) - Now at 1st Position */}
      <section className={styles.heroWhiteForm}>
        <div className={styles.container}>
          <motion.div
            className={styles.heroWhiteFormContent}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.heroBadgesRow}>
              <span className={styles.heroWhiteBadgeBlue}>
                #1 IT Training Institute
              </span>
              <a
                href="https://www.google.com/search?newwindow=1&rlz=1C1OPNX_enIN1191IN1191&sca_esv=6a3dc1d72e9664c9&sxsrf=ANbL-n4Dr0cKuoXIqu6rX0yzJ53iNyVALg:1771237726027&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOb6430ph4KW1SP9P0fsgqwVXBqDbeWFrMuYOWnwtk6HqtXBEc5ya8wUa_x6S9d1a8Ty3F7NYgdEDrWArNkHmTvyBDWag&q=ITROOTS+PVT+LTD+Reviews&sa=X&ved=2ahUKEwja1uPb5t2SAxX2dfUHHQfYF3wQ0bkNegQIQRAH&biw=1440&bih=731&dpr=1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.googleRatingBadge}
              >
                <div className={styles.googleIconRow}>
                  <Image src="/images/google-icon.svg" alt="Google" width={18} height={18} unoptimized />
                  <span className={styles.ratingValueRow}>4.8</span>
                </div>
                <div className={styles.googleStarsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={12} fill={star <= 4 ? '#FBBC04' : 'none'} color={star <= 4 ? '#FBBC04' : '#FBBC04'} strokeWidth={star === 5 ? 2 : 0} />
                  ))}
                </div>
                <WordRotate
                  className={styles.ratingTextRow}
                  words={["Google Reviews", "Rated 4.8/5 Stars"]}
                  duration={3000}
                />
              </a>
            </div>
            <h1>
              Transform Your Career with{' '}
              <span className={styles.highlight}>Industry-Ready</span>{' '}
              Tech Skills
            </h1>
            <p>
              Join 5000+ successful graduates who launched their tech careers with our
              expert-led courses in Data Science, AI, Cyber Security, and Full Stack Development.
            </p>
            <div className={styles.heroButtons}>
              <Link href="/courses" className={styles.btnPrimary}>
                Explore Courses
                <ArrowRight size={18} />
              </Link>
              <a href="/brochures/data-science-ai.pdf" download className={styles.btnOutlineBlue}>
                <Download size={18} />
                Download Brochure
              </a>
            </div>
            <div className={styles.heroBottomRow}>
              <div className={styles.associationBadges}>
                <span className={styles.heroWhiteAssociationLabel}>In Association With</span>
                <div className={styles.associationLogos}>
                  <Image src="/images/nsdc.png" alt="NSDC" width={50} height={50} unoptimized className={styles.associationLogo} />
                  <Image src="/images/skill-india.png" alt="Skill India" width={45} height={45} unoptimized className={styles.associationLogo} />
                  <img src="/images/iso.png.png" alt="ISO 9001:2015" className={styles.associationLogo} style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            className={styles.heroForm}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className={styles.formCardBlue} id="career-counselling-form-duplicate">
              <div className={styles.formHeader}>
                <h3>Get Free Career Counselling</h3>
                <p>Book your free consultation with our experts</p>
              </div>
              {formSubmitted ? (
                <div className={styles.formSuccess}>
                  <div className={styles.formSuccessIcon}>✓</div>
                  <h4>Thank You!</h4>
                  <p>Our counsellor will contact you shortly.</p>
                </div>
              ) : (
                <form className={styles.leadForm} onSubmit={handleFormSubmit}>
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      placeholder="Your Name *"
                      required
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      type="email"
                      placeholder="Email Address *"
                      required
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      required
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <CustomSelect
                      options={courseOptions}
                      placeholder="Select Course Interest"
                      name="course"
                      required
                    />
                  </div>
                  <button type="submit" className={styles.formSubmitBtn} disabled={formSubmitting}>
                    {formSubmitting ? 'Submitting...' : 'Book Free Counselling'}
                    {!formSubmitting && <ArrowRight size={18} />}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Hero Section (White Background) */}
      <section className={styles.heroWhite}>
        <div className={styles.heroWhiteBackground}>
          <div className={styles.heroWhiteGradient} />
        </div>

        {/* Floating Features Background */}
        <div className={styles.floatingFeaturesLeft}>
          <div className={styles.illustrationLeftTrack}>
            <motion.div
              animate={{ y: [-15, 15, -15] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className={styles.illustrationBlobBox}
            >
              <div className={styles.blobPink} />
              <div className={styles.illustrationIcons}>
                <Lightbulb size={90} strokeWidth={1.5} color="#0f172a" />
                <Code2 size={40} strokeWidth={2} color="#0f172a" className={styles.floatingMiniIcon1} />
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [15, -15, 15] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className={styles.illustrationBlobBox}
            >
              <div className={styles.blobYellow} />
              <div className={styles.illustrationIcons}>
                <MonitorPlay size={90} strokeWidth={1.5} color="#0f172a" />
                <CheckCircle size={40} strokeWidth={2} color="#0f172a" className={styles.floatingMiniIcon2} />
              </div>
            </motion.div>
          </div>
        </div>
        <div className={styles.floatingFeaturesRight}>
          <div className={styles.illustrationRightTrack}>
            <motion.div
              animate={{ y: [-20, 20, -20] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
              className={styles.illustrationBlobBox}
            >
              <div className={styles.blobBlue} />
              <div className={styles.illustrationIcons}>
                <Rocket size={90} strokeWidth={1.5} color="#0f172a" />
                <Star size={40} strokeWidth={2} color="#0f172a" className={styles.floatingMiniIcon1} />
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [20, -20, 20] }}
              transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
              className={styles.illustrationBlobBox}
            >
              <div className={styles.blobGreen} />
              <div className={styles.illustrationIcons}>
                <TrendingUp size={90} strokeWidth={1.5} color="#0f172a" />
                <Users size={40} strokeWidth={2} color="#0f172a" className={styles.floatingMiniIcon2} />
              </div>
            </motion.div>
          </div>
        </div>

        <div className={styles.container}>
          <motion.div
            className={styles.heroWhiteContent}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.heroBadgesRow}>
              <span className={styles.heroWhiteBadge}>
                #1 IT Training Institute
              </span>
              <a
                href="https://www.google.com/search?newwindow=1&rlz=1C1OPNX_enIN1191IN1191&sca_esv=6a3dc1d72e9664c9&sxsrf=ANbL-n4Dr0cKuoXIqu6rX0yzJ53iNyVALg:1771237726027&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOb6430ph4KW1SP9P0fsgqwVXBqDbeWFrMuYOWnwtk6HqtXBEc5ya8wUa_x6S9d1a8Ty3F7NYgdEDrWArNkHmTvyBDWag&q=ITROOTS+PVT+LTD+Reviews&sa=X&ved=2ahUKEwja1uPb5t2SAxX2dfUHHQfYF3wQ0bkNegQIQRAH&biw=1440&bih=731&dpr=1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.googleRatingBadge}
              >
                <div className={styles.googleIconRow}>
                  <Image src="/images/google-icon.svg" alt="Google" width={18} height={18} unoptimized />
                  <span className={styles.ratingValueRow}>4.8</span>
                </div>
                <div className={styles.googleStarsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={12} fill={star <= 4 ? '#FBBC04' : 'none'} color={star <= 4 ? '#FBBC04' : '#FBBC04'} strokeWidth={star === 5 ? 2 : 0} />
                  ))}
                </div>
                <WordRotate
                  className={styles.ratingTextRow}
                  words={["Google Ratings", "Rated 4.8/5 Stars"]}
                  duration={3000}
                />
              </a>
            </div>
            <h1>
              Transform Your Career with{' '}
              <span className={styles.highlight}>Industry-Ready</span>{' '}
              Tech Skills
            </h1>
            <p>
              Join 5000+ successful graduates who launched their tech careers with our
              expert-led courses in Data Science, AI, Cyber Security, and Full Stack Development.
            </p>
            <div className={styles.heroButtons}>
              <button onClick={() => setIsCounsellingModalOpen(true)} className={styles.btnPrimary}>
                Book Free Counselling
                <ArrowRight size={18} />
              </button>
              <a href="/brochures/data-science-ai.pdf" download className={styles.heroWhiteBtnOutline}>
                <Download size={18} />
                Download Brochure
              </a>
            </div>
            <div className={styles.heroBottomRow}>
              <div className={styles.associationBadges}>
                <span className={styles.heroWhiteAssociationLabel}>In Association With</span>
                <div className={styles.associationLogos}>
                  <Image src="/images/nsdc.png" alt="NSDC" width={50} height={50} unoptimized className={styles.associationLogo} />
                  <Image src="/images/skill-india.png" alt="Skill India" width={45} height={45} unoptimized className={styles.associationLogo} />
                  <img src="/images/iso.png.png" alt="ISO 9001:2015" className={styles.associationLogo} style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hero Section (Previous Design) */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroGradient} />
          <div className={styles.heroPattern} />
        </div>
        <div className={styles.container}>
          <motion.div
            className={styles.heroContent}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.heroBadgesRow}>
              <span className={styles.heroBadge}>
                #1 IT Training Institute
              </span>
              <a
                href="https://www.google.com/search?newwindow=1&rlz=1C1OPNX_enIN1191IN1191&sca_esv=6a3dc1d72e9664c9&sxsrf=ANbL-n4Dr0cKuoXIqu6rX0yzJ53iNyVALg:1771237726027&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOb6430ph4KW1SP9P0fsgqwVXBqDbeWFrMuYOWnwtk6HqtXBEc5ya8wUa_x6S9d1a8Ty3F7NYgdEDrWArNkHmTvyBDWag&q=ITROOTS+PVT+LTD+Reviews&sa=X&ved=2ahUKEwja1uPb5t2SAxX2dfUHHQfYF3wQ0bkNegQIQRAH&biw=1440&bih=731&dpr=1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.googleRatingBadge}
              >
                <div className={styles.googleIconRow}>
                  <Image src="/images/google-icon.svg" alt="Google" width={18} height={18} unoptimized />
                  <span className={styles.ratingValueRow}>4.8</span>
                </div>
                <div className={styles.googleStarsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={12} fill={star <= 4 ? '#FBBC04' : 'none'} color={star <= 4 ? '#FBBC04' : '#FBBC04'} strokeWidth={star === 5 ? 2 : 0} />
                  ))}
                </div>
                <WordRotate
                  className={styles.ratingTextRow}
                  words={["Google Rating", "Rated 4.8/5 Stars"]}
                  duration={3000}
                />
              </a>
            </div>
            <h1>
              Transform Your Career with{' '}
              <span className={styles.highlight}>Industry-Ready</span>{' '}
              Tech Skills
            </h1>
            <p>
              Join 5000+ successful graduates who launched their tech careers with our
              expert-led courses in Data Science, AI, Cyber Security, and Full Stack Development.
            </p>
            <div className={styles.heroButtons}>
              <Link href="/courses" className={styles.btnPrimary}>
                Explore Courses
                <ArrowRight size={18} />
              </Link>
              <a href="/brochures/data-science-ai.pdf" download className={styles.btnOutline}>
                <Download size={18} />
                Download Brochure
              </a>
            </div>
            <div className={styles.heroBottomRow}>
              <div className={styles.associationBadges}>
                <span className={styles.associationLabel}>In Association With</span>
                <div className={styles.associationLogos}>
                  <Image src="/images/nsdc.png" alt="NSDC" width={50} height={50} unoptimized className={styles.associationLogo} />
                  <Image src="/images/skill-india.png" alt="Skill India" width={45} height={45} unoptimized className={styles.associationLogo} />
                  <img src="/images/iso.png.png" alt="ISO 9001:2015" className={styles.associationLogo} style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            className={styles.heroForm}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className={styles.formCard} id="career-counselling-form">
              <div className={styles.formHeader}>
                <h3>Get Free Career Counselling</h3>
                <p>Book your free consultation with our experts</p>
              </div>
              {formSubmitted ? (
                <div className={styles.formSuccess}>
                  <div className={styles.formSuccessIcon}>✓</div>
                  <h4>Thank You!</h4>
                  <p>Our counsellor will contact you shortly.</p>
                </div>
              ) : (
                <form className={styles.leadForm} onSubmit={handleFormSubmit}>
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      placeholder="Your Name *"
                      required
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      type="email"
                      placeholder="Email Address *"
                      required
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      required
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <CustomSelect
                      options={courseOptions}
                      placeholder="Select Course Interest"
                      name="course"
                      required
                    />
                  </div>
                  <button type="submit" className={styles.formSubmitBtn} disabled={formSubmitting}>
                    {formSubmitting ? 'Submitting...' : 'Book Free Counselling'}
                    {!formSubmitting && <ArrowRight size={18} />}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hiring Partners Section - Redesigned */}
      <section className={styles.partnersHeroSection}>
        <div className={styles.container}>
          <div className={styles.partnersRow}>
            <div className={styles.partnersTrackRTL}>
              {companyLogos.map((logo, index) => (
                <div key={`hero-single-${logo}`} className={styles.partnersHeroSlide}>
                  <Image
                    src={`/company%20logos/${logo}`}
                    alt={`Company logo ${index + 1}`}
                    width={160}
                    height={80}
                    unoptimized
                    className={styles.partnersHeroSlideImage}
                  />
                </div>
              ))}
              {companyLogos.map((logo, index) => (
                <div key={`hero-single-dup-${logo}`} className={styles.partnersHeroSlide}>
                  <Image
                    src={`/company%20logos/${logo}`}
                    alt={`Company logo ${index + 1}`}
                    width={160}
                    height={80}
                    unoptimized
                    className={styles.partnersHeroSlideImage}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Impact Section */}
      <section className={styles.impactSection}>
        <div className={styles.container}>
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className={styles.sectionTag}>Our Impact</span>
            <h2>Proven Results That Build Careers</h2>
            <p>Numbers that reflect our commitment to student success and industry excellence</p>
          </motion.div>
          <div className={styles.impactGrid}>
            <motion.div
              className={styles.impactCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0 }}
            >
              <div className={styles.impactIcon}>
                <Image src="/images/excellence1.svg" alt="Excellence" width={48} height={48} unoptimized />
              </div>
              <div className={styles.impactNumber}>
                <AnimatedCounter end={9} suffix="+" />
              </div>
              <div className={styles.impactLabel}>Years of Excellence</div>
            </motion.div>
            <motion.div
              className={styles.impactCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className={styles.impactIcon}>
                <Image src="/images/students1.svg" alt="Students" width={48} height={48} unoptimized />
              </div>
              <div className={styles.impactNumber}>
                <AnimatedCounter end={4000} suffix="+" />
              </div>
              <div className={styles.impactLabel}>Students Trained</div>
            </motion.div>
            <motion.div
              className={styles.impactCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className={styles.impactIcon}>
                <Image src="/images/success1.svg" alt="Success" width={48} height={48} unoptimized />
              </div>
              <div className={styles.impactNumber}>
                <AnimatedCounter end={70} suffix="%+" />
              </div>
              <div className={styles.impactLabel}>Placement Success</div>
            </motion.div>
            <motion.div
              className={styles.impactCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className={styles.impactIcon}>
                <Image src="/images/hiring1.svg" alt="Partners" width={48} height={48} unoptimized />
              </div>
              <div className={styles.impactNumber}>
                <AnimatedCounter end={50} suffix="+" />
              </div>
              <div className={styles.impactLabel}>Hiring Partners</div>
            </motion.div>
          </div>
        </div>
      </section >

      {/* Our Excellence Section */}
      <section className={styles.excellenceSectionNew}>
        <div className={styles.container}>

          {/* Centered Header */}
          <motion.div
            className={styles.excellenceCenterHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className={styles.excellenceTag}>Our Excellence</span>
            <h2>Why Choose <span className={styles.excellenceHighlight}>ITROOTS</span>?</h2>
            <p>For over 9 years, we've been empowering students to launch and advance their careers in the tech industry.</p>
          </motion.div>

          <div className={styles.excellenceSplitLayout}>

            {/* Left — Stats Panel */}
            <motion.div
              className={styles.excellenceLeftPanel}
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className={styles.excellenceStatsRow}>
                {[
                  { value: 40, suffix: '%', label: 'Salary Uplift', icon: <TrendingUp size={22} /> },
                  { value: 100, suffix: '%', label: 'Job-Ready Skills', icon: <CheckCircle size={22} /> },
                  { value: 0, text: 'Live', label: 'Projects', icon: <Code2 size={22} /> },
                  { value: 0, text: '24/7', label: 'Mentor Support', icon: <Users size={22} /> },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className={styles.excellenceStatCard}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className={styles.excellenceStatIcon}>{stat.icon}</div>
                    <span className={styles.excellenceStatValue}>
                      {stat.text || <AnimatedCounter end={stat.value} suffix={stat.suffix} />}
                    </span>
                    <span className={styles.excellenceStatLabel}>{stat.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right — Feature Cards */}
            <div className={styles.excellenceFeaturesGrid}>
              {[
                { icon: <GraduationCap size={24} />, title: '100% Placement Guarantee', desc: 'We ensure every student gets placed with our dedicated placement cell.' },
                { icon: <Brain size={24} />, title: 'Expert Mentorship (10+ Years)', desc: 'Learn from industry veterans with real-world experience.' },
                { icon: <BookOpen size={24} />, title: 'Daily 5-6 Hours Practical Training', desc: 'Hands-on, project-based learning every single day.' },
                { icon: <Cpu size={24} />, title: 'AI-Integrated Project Training', desc: 'Build projects using the latest AI tools and methodologies.' },
                { icon: <Shield size={24} />, title: 'Refund Guarantee', desc: 'Your investment is protected with our money-back guarantee.' },
                { icon: <Briefcase size={24} />, title: 'Mock Interviews & Assessments', desc: 'Regular practice sessions to make you interview-ready.' },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className={styles.excellenceFeatureCard}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  <div className={styles.excellenceFeatureIcon}>{feature.icon}</div>
                  <div>
                    <h4 className={styles.excellenceFeatureTitle}>{feature.title}</h4>
                    <p className={styles.excellenceFeatureDesc}>{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Section Spacer (wave divider removed to fix black line) */}

      {/* Featured Courses Section */}
      <section className={styles.coursesSection}>
        <div className={styles.coursesContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Our Programs</span>
            <h2>Industry-Ready Courses</h2>
            <p>Choose from our comprehensive range of career-focused programs designed with industry experts</p>
          </div>
          <div className={styles.coursesGrid}>
            {featuredCourses.map((course, index) => (
              <motion.div
                key={course.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className={styles.courseCard}>
                  {course.isJobGuarantee && (
                    <span className={styles.jobBadge}>Job Guarantee</span>
                  )}
                  <Link
                    href={`/courses/${course.slug}`}
                    className={styles.courseCardContent}
                    style={{ backgroundColor: course.pastelColor || course.color + '15' }}
                  >
                    {/* Top Section with Pastel Background */}
                    <div className={styles.courseHeader}>
                      {course.cardImage ? (
                        <div className={styles.courseBannerWrapper}>
                          <img
                            src={course.cardImage}
                            alt={course.shortTitle}
                            className={styles.courseBannerImg}
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div
                          className={styles.courseIcon}
                          style={{ color: course.color }}
                        >
                          {courseIcons[course.icon]}
                        </div>
                      )}
                      <h3>{course.shortTitle}</h3>
                      <p>{course.shortDescription}</p>
                      <div className={styles.courseMeta}>
                        <span className={styles.durationBadge}>
                          {course.duration}
                        </span>
                        <span className={styles.modeBadge}>
                          {course.mode}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Bottom Section with White Background */}
                  <div className={styles.courseActions}>
                    <Link href={`/courses/${course.slug}`} className={styles.viewCourseBtnFull}>
                      View Course
                    </Link>
                    <a href={course.brochureUrl} download className={styles.downloadBrochureBtnFull}>
                      <ArrowRight size={16} className={styles.rotateDown} />
                      Brochure
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className={styles.viewAllContainer}>
            <Link href="/courses" className={styles.viewAllBtn}>
              View All Courses
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>



      {/* Journey Section */}
      <section className={styles.journeySection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>How It Works</span>
            <h2>Your Path to Success in 5 Easy Steps</h2>
            <p>Our learning approach is simple and outcome-driven. Here’s how we ensure you achieve your career goals.</p>
          </div>
          <div className={styles.journeyInfographic}>
            {[
              {
                step: "01",
                title: "Choose Your Program",
                desc: "Select the course that aligns with your career path and goals.",
                icon: <BookOpen size={24} />,
                color: "#0881ec"
              },
              {
                step: "02",
                title: "Join Live Sessions",
                desc: "Participate in instructor-led live sessions with real-time interaction.",
                icon: <Users size={24} />,
                color: "#ee9602"
              },
              {
                step: "03",
                title: "Build Real Projects",
                desc: "Work on industry projects to gain hands-on practical experience.",
                icon: <Code2 size={24} />,
                color: "#0881ec"
              },
              {
                step: "04",
                title: "Get Career Support",
                desc: "Benefit from resume building, mock interviews, and placement assistance.",
                icon: <Briefcase size={24} />,
                color: "#ee9602"
              },
              {
                step: "05",
                title: "Start Your Tech Career",
                desc: "Get placed in a top company and begin your exciting tech career!",
                icon: <Building2 size={24} />,
                color: "#0881ec"
              }
            ].map((item, index, list) => (
              <motion.div
                key={item.step}
                className={styles.journeyStepCard}
                style={{ "--step-color": item.color } as React.CSSProperties}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className={styles.journeyCircleContainer}>
                  <div className={styles.journeyRotatingRing}></div>
                  <div className={styles.journeyInnerCircle}>
                    <div className={styles.journeyIconWrapper} style={{ color: item.color }}>
                      {item.icon}
                    </div>
                    <h3 className={styles.journeyTitle}>{item.title}</h3>
                  </div>
                </div>
                <p className={styles.journeyDesc}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Testimonials Section */}
      <section className={styles.testimonialsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Success Stories</span>
            <h2>What Our Students Say</h2>
            <p>Hear from our graduates who transformed their careers with ITROOTS</p>
          </div>
          <div
            className={styles.testimonialsCarousel}
            onMouseEnter={() => setIsTestimonialsPaused(true)}
            onMouseLeave={() => setIsTestimonialsPaused(false)}
          >
            <div
              className={styles.testimonialsTrack}
              style={{ transform: `translateX(-${activeTestimonialSlide * (100 / testimonialCardsPerView)}%)` }}
            >
              {featuredTestimonials.map((testimonial, index) => (
                <div
                  key={`${testimonial.id}-${index}`}
                  className={styles.testimonialsItem}
                  style={{ width: `${100 / testimonialCardsPerView}%` }}
                >
                  <motion.div
                    className={styles.testimonialCard}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                  >
                    <div className={styles.testimonialCardHeader}>
                      <div className={styles.testimonialProfile}>
                        <div className={styles.authorAvatar}>
                          {testimonial.name.charAt(0)}
                        </div>
                        <div className={styles.authorInfo}>
                          <strong>{testimonial.name}</strong>
                        </div>
                      </div>
                      <Image
                        src="/images/google-icon.svg"
                        alt="Google Reviews"
                        width={18}
                        height={18}
                        unoptimized
                        className={styles.testimonialX}
                      />
                    </div>
                    <div className={styles.testimonialRating}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="#ee9602" color="#ee9602" />
                      ))}
                    </div>
                    <p className={styles.testimonialText}>{testimonial.testimonial}</p>
                    <p className={styles.testimonialRole}>{testimonial.role} at {testimonial.company}</p>
                    {testimonial.salary && (
                      <div className={styles.salaryBadge}>
                        Package: {testimonial.salary}
                      </div>
                    )}
                    <div className={styles.testimonialCourse}>
                      Course: {testimonial.course}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.testimonialsDots}>
            {Array.from({ length: testimonialSlidesCount }, (_, index) => (
              <button
                key={`testimonial-dot-${index}`}
                type="button"
                className={`${styles.testimonialDot} ${activeTestimonialSlide === index ? styles.activeDot : ''}`}
                onClick={() => setActiveTestimonialSlide(index)}
                aria-label={`Go to testimonial slide ${index + 1}`}
              />
            ))}
          </div>
          <div className={styles.viewAllContainer}>
            <Link href="/placements" className={styles.viewAllBtn}>
              View More Success Stories
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Hiring Partners Section (Before Reviews) */}
      <section className={styles.partnersSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Our Partners</span>
            <h2>Trusted by Top Companies</h2>
            <p>Our graduates work at leading tech companies worldwide</p>
          </div>
          <div className={styles.partnersVelocityContainer}>
            <div className={styles.partnersRow}>
              <div className={styles.partnersTrackRTL}>
                {companyLogos.map((logo, index) => (
                  <div key={`section-rtl-${logo}`} className={styles.partnerLogo}>
                    <Image
                      src={`/company%20logos/${logo}`}
                      alt={`Company logo ${index + 1}`}
                      width={210}
                      height={80}
                      sizes="210px"
                      quality={100}
                      unoptimized
                      className={styles.partnerLogoImage}
                    />
                  </div>
                ))}
                {companyLogos.map((logo, index) => (
                  <div key={`section-rtl-dup-${logo}`} className={styles.partnerLogo}>
                    <Image
                      src={`/company%20logos/${logo}`}
                      alt={`Company logo ${index + 1}`}
                      width={210}
                      height={80}
                      sizes="210px"
                      quality={100}
                      unoptimized
                      className={styles.partnerLogoImage}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.partnersRow}>
              <div className={styles.partnersTrackLTR}>
                {companyLogos.map((logo, index) => (
                  <div key={`section-ltr-${logo}`} className={styles.partnerLogo}>
                    <Image
                      src={`/company%20logos/${logo}`}
                      alt={`Company logo ${index + 1}`}
                      width={210}
                      height={80}
                      sizes="210px"
                      quality={100}
                      unoptimized
                      className={styles.partnerLogoImage}
                    />
                  </div>
                ))}
                {companyLogos.map((logo, index) => (
                  <div key={`section-ltr-dup-${logo}`} className={styles.partnerLogo}>
                    <Image
                      src={`/company%20logos/${logo}`}
                      alt={`Company logo ${index + 1}`}
                      width={210}
                      height={80}
                      sizes="210px"
                      quality={100}
                      unoptimized
                      className={styles.partnerLogoImage}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <motion.div
            className={styles.ctaBox}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.ctaContent}>
              <h2>Ready to Launch Your Tech Career?</h2>
              <p>Join thousands of successful graduates. Get expert mentorship, hands-on projects, and 100% placement assistance.</p>
              <div className={styles.ctaButtons}>
                <Link href="/courses" className={styles.ctaBtnPrimary}>
                  Explore Courses
                  <ArrowRight size={18} />
                </Link>
                <Link href="/contact" className={styles.ctaBtnOutline}>
                  Talk to a Counsellor
                </Link>
              </div>
            </div>
            <div className={styles.ctaImageWrapper}>
              <Image
                src="/images/Resume-amico (2).png"
                alt="Launch Your Tech Career"
                width={380}
                height={350}
                className={styles.ctaImage}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Counselling Modal */}
      <AnimatePresence>
        {isCounsellingModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsCounsellingModalOpen(false)}>
            <motion.div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <button className={styles.modalCloseBtn} onClick={() => setIsCounsellingModalOpen(false)} aria-label="Close">
                <X size={24} />
              </button>
              <div className={styles.formHeader}>
                <h3>Get Free Career Counselling</h3>
                <p>Book your free consultation with our experts</p>
              </div>
              {formSubmitted ? (
                <div className={styles.formSuccess}>
                  <div className={styles.formSuccessIcon}>✓</div>
                  <h4>Thank You!</h4>
                  <p>Our counsellor will contact you shortly.</p>
                </div>
              ) : (
                <form className={styles.leadForm} onSubmit={handleFormSubmit}>
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      placeholder="Your Name *"
                      required
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      type="email"
                      placeholder="Email Address *"
                      required
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      required
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <CustomSelect
                      options={courseOptions}
                      placeholder="Select Course Interest"
                      name="course"
                      required
                    />
                  </div>
                  <button type="submit" className={styles.formSubmitBtn} disabled={formSubmitting}>
                    {formSubmitting ? 'Submitting...' : 'Book Free Counselling'}
                    {!formSubmitting && <ArrowRight size={18} />}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
