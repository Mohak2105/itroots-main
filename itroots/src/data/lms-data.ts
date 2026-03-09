// ─────────────────────────────────────────────
//  ITROOTS LMS — Central Mock Data
// ─────────────────────────────────────────────

export type Role = "student" | "Faculty" | "admin";

export interface User {
    id: string;
    name: string;
    email: string;
    password: string; // plain text for demo
    role: Role;
    avatar: string;
    phone: string;
    joinedAt: string;
}

export interface Lesson {
    id: string;
    moduleId: string;
    title: string;
    youtubeUrl: string;
    duration: string; // e.g. "12:45"
    description: string;
    pdfUrl?: string;
    order: number;
}

export interface Module {
    id: string;
    courseId: string;
    title: string;
    order: number;
    lessons: Lesson[];
}

export interface Course {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnail: string;
    FacultyId: string;
    totalLessons: number;
    totalDuration: string;
    modules: Module[];
}

export interface Batch {
    id: string;
    name: string;
    courseId: string;
    FacultyId: string;
    studentIds: string[];
    schedule: string; // e.g. "Mon, Wed, Fri — 10:00 AM"
    startDate: string;
    endDate: string;
}

export interface Enrollment {
    id: string;
    studentId: string;
    courseId: string;
    batchId: string;
    enrolledAt: string;
    progress: number; // 0–100
    completedLessonIds: string[];
}

export interface Assignment {
    id: string;
    courseId: string;
    FacultyId: string;
    title: string;
    description: string;
    dueDate: string;
    maxMarks: number;
}

export interface Submission {
    id: string;
    assignmentId: string;
    studentId: string;
    submittedAt: string;
    grade?: number;
    feedback?: string;
    fileUrl?: string;
}

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctIndex: number;
}

export interface Test {
    id: string;
    courseId: string;
    title: string;
    durationMinutes: number;
    totalMarks: number;
    questions: Question[];
}

export interface TestAttempt {
    id: string;
    testId: string;
    studentId: string;
    score: number;
    submittedAt: string;
    answers: number[];
}

export interface Announcement {
    id: string;
    batchId: string;
    FacultyId: string;
    message: string;
    createdAt: string;
    iconType?: "confetti" | "pin" | "holiday" | "wave";
}

// ─────────────────────────────────────────────
//  USERS
// ─────────────────────────────────────────────
export const USERS: User[] = [
    {
        id: "u1",
        name: "Arjun Sharma",
        email: "student@itroots.com",
        password: "student123",
        role: "student",
        avatar: "AS",
        phone: "+91 98765 43210",
        joinedAt: "2025-01-15",
    },
    {
        id: "u2",
        name: "Priya Patel",
        email: "priya@itroots.com",
        password: "student123",
        role: "student",
        avatar: "PP",
        phone: "+91 87654 32109",
        joinedAt: "2025-01-20",
    },
    {
        id: "u3",
        name: "Ravi Kumar",
        email: "ravi@itroots.com",
        password: "student123",
        role: "student",
        avatar: "RK",
        phone: "+91 76543 21098",
        joinedAt: "2025-02-01",
    },
    {
        id: "t1",
        name: "Dr. Anitha Reddy",
        email: "Faculty@itroots.com",
        password: "Faculty123",
        role: "Faculty",
        avatar: "AR",
        phone: "+91 91234 56789",
        joinedAt: "2024-06-01",
    },
    {
        id: "t2",
        name: "Prof. Suresh Nair",
        email: "suresh@itroots.com",
        password: "Faculty123",
        role: "Faculty",
        avatar: "SN",
        phone: "+91 92345 67890",
        joinedAt: "2024-07-15",
    },
    {
        id: "a1",
        name: "Admin ITROOTS",
        email: "admin@itroots.com",
        password: "admin123",
        role: "admin",
        avatar: "AI",
        phone: "+91 99999 00000",
        joinedAt: "2024-01-01",
    },
];

// ─────────────────────────────────────────────
//  COURSES (with YouTube lessons)
// ─────────────────────────────────────────────
export const COURSES: Course[] = [
    {
        id: "c1",
        title: "Data Science + AI",
        slug: "data-science-ai",
        description: "Master Data Science and Artificial Intelligence from scratch with real-world projects.",
        thumbnail: "/images/courses/data-science.jpg",
        FacultyId: "t1",
        totalLessons: 12,
        totalDuration: "24h 30m",
        modules: [
            {
                id: "m1",
                courseId: "c1",
                title: "Module 1: Python Fundamentals",
                order: 1,
                lessons: [
                    {
                        id: "l1",
                        moduleId: "m1",
                        title: "Introduction to Python",
                        youtubeUrl: "https://www.youtube.com/embed/kqtD5dpn9C8",
                        duration: "12:45",
                        description: "Get started with Python programming — variables, data types, and basic syntax.",
                        order: 1,
                    },
                    {
                        id: "l2",
                        moduleId: "m1",
                        title: "Python Data Structures",
                        youtubeUrl: "https://www.youtube.com/embed/W8KRzm-HUcc",
                        duration: "18:20",
                        description: "Learn about lists, dictionaries, sets, and tuples in Python.",
                        order: 2,
                    },
                    {
                        id: "l3",
                        moduleId: "m1",
                        title: "Functions and Modules",
                        youtubeUrl: "https://www.youtube.com/embed/9Os0o3wzS_I",
                        duration: "15:10",
                        description: "Writing reusable functions and importing Python modules.",
                        order: 3,
                    },
                ],
            },
            {
                id: "m2",
                courseId: "c1",
                title: "Module 2: Data Analysis with Pandas",
                order: 2,
                lessons: [
                    {
                        id: "l4",
                        moduleId: "m2",
                        title: "Introduction to NumPy",
                        youtubeUrl: "https://www.youtube.com/embed/QUT1VHiLmmI",
                        duration: "20:30",
                        description: "NumPy arrays, operations, and broadcasting explained.",
                        order: 1,
                    },
                    {
                        id: "l5",
                        moduleId: "m2",
                        title: "Pandas DataFrames",
                        youtubeUrl: "https://www.youtube.com/embed/vmEHCJofslg",
                        duration: "25:15",
                        description: "Load, filter, group, and visualize data with Pandas.",
                        order: 2,
                    },
                ],
            },
            {
                id: "m3",
                courseId: "c1",
                title: "Module 3: Machine Learning Basics",
                order: 3,
                lessons: [
                    {
                        id: "l6",
                        moduleId: "m3",
                        title: "Introduction to Machine Learning",
                        youtubeUrl: "https://www.youtube.com/embed/ukzFI9rgwfU",
                        duration: "22:00",
                        description: "Understand supervised vs unsupervised learning, and key ML concepts.",
                        order: 1,
                    },
                    {
                        id: "l7",
                        moduleId: "m3",
                        title: "Linear Regression",
                        youtubeUrl: "https://www.youtube.com/embed/nk2CQITm_eo",
                        duration: "19:45",
                        description: "Build and evaluate your first machine learning model.",
                        order: 2,
                    },
                ],
            },
        ],
    },
    {
        id: "c2",
        title: "Full Stack Java",
        slug: "full-stack-java",
        description: "Become a full-stack developer with Java, Spring Boot, and React from beginner to job-ready.",
        thumbnail: "/images/courses/java.jpg",
        FacultyId: "t2",
        totalLessons: 10,
        totalDuration: "20h 15m",
        modules: [
            {
                id: "m4",
                courseId: "c2",
                title: "Module 1: Java Core",
                order: 1,
                lessons: [
                    {
                        id: "l8",
                        moduleId: "m4",
                        title: "Java Basics & OOP Concepts",
                        youtubeUrl: "https://www.youtube.com/embed/grEKMHGYyns",
                        duration: "30:00",
                        description: "Learn classes, objects, inheritance, polymorphism — OOP fundamentals.",
                        order: 1,
                    },
                    {
                        id: "l9",
                        moduleId: "m4",
                        title: "Collections Framework",
                        youtubeUrl: "https://www.youtube.com/embed/rzA7UJ-hQoI",
                        duration: "22:30",
                        description: "ArrayList, HashMap, LinkedList and when to use each.",
                        order: 2,
                    },
                ],
            },
            {
                id: "m5",
                courseId: "c2",
                title: "Module 2: Spring Boot",
                order: 2,
                lessons: [
                    {
                        id: "l10",
                        moduleId: "m5",
                        title: "REST APIs with Spring Boot",
                        youtubeUrl: "https://www.youtube.com/embed/9SGDpanrc8U",
                        duration: "35:00",
                        description: "Build production-grade REST APIs using Spring Boot.",
                        order: 1,
                    },
                ],
            },
        ],
    },
    {
        id: "c3",
        title: "Cyber Security",
        slug: "cyber-security",
        description: "Learn ethical hacking, network security, and cyber defense strategies.",
        thumbnail: "/images/courses/cybersecurity.jpg",
        FacultyId: "t1",
        totalLessons: 8,
        totalDuration: "16h 00m",
        modules: [
            {
                id: "m6",
                courseId: "c3",
                title: "Module 1: Network Security Fundamentals",
                order: 1,
                lessons: [
                    {
                        id: "l11",
                        moduleId: "m6",
                        title: "Introduction to Cyber Security",
                        youtubeUrl: "https://www.youtube.com/embed/inWWhr5tnEA",
                        duration: "18:00",
                        description: "Overview of cybersecurity landscape, threats, and career paths.",
                        order: 1,
                    },
                    {
                        id: "l12",
                        moduleId: "m6",
                        title: "Network Protocols & Firewalls",
                        youtubeUrl: "https://www.youtube.com/embed/3b_mEZ5R138",
                        duration: "24:00",
                        description: "TCP/IP, HTTP, DNS, and how firewalls protect networks.",
                        order: 2,
                    },
                ],
            },
        ],
    },
];

// ─────────────────────────────────────────────
//  BATCHES
// ─────────────────────────────────────────────
export const BATCHES: Batch[] = [
    {
        id: "b1",
        name: "DS-AI Morning Batch",
        courseId: "c1",
        FacultyId: "t1",
        studentIds: ["u1", "u2"],
        schedule: "Mon, Wed, Fri — 10:00 AM",
        startDate: "2025-01-20",
        endDate: "2025-06-20",
    },
    {
        id: "b2",
        name: "Java Evening Batch",
        courseId: "c2",
        FacultyId: "t2",
        studentIds: ["u3"],
        schedule: "Tue, Thu, Sat — 6:00 PM",
        startDate: "2025-02-01",
        endDate: "2025-07-01",
    },
];

// ─────────────────────────────────────────────
//  ENROLLMENTS
// ─────────────────────────────────────────────
export const ENROLLMENTS: Enrollment[] = [
    {
        id: "e1",
        studentId: "u1",
        courseId: "c1",
        batchId: "b1",
        enrolledAt: "2025-01-20",
        progress: 58,
        completedLessonIds: ["l1", "l2", "l3", "l4", "l5", "l6", "l7"],
    },
    {
        id: "e2",
        studentId: "u2",
        courseId: "c1",
        batchId: "b1",
        enrolledAt: "2025-01-22",
        progress: 33,
        completedLessonIds: ["l1", "l2", "l3", "l4"],
    },
    {
        id: "e3",
        studentId: "u3",
        courseId: "c2",
        batchId: "b2",
        enrolledAt: "2025-02-05",
        progress: 15,
        completedLessonIds: ["l8"],
    },
];

// ─────────────────────────────────────────────
//  ASSIGNMENTS
// ─────────────────────────────────────────────
export const ASSIGNMENTS: Assignment[] = [
    {
        id: "a1",
        courseId: "c1",
        FacultyId: "t1",
        title: "Python Basics Exercise",
        description: "Write a Python script that reads a CSV file, calculates the mean of a numeric column, and plots a histogram using Matplotlib.",
        dueDate: "2025-03-10",
        maxMarks: 20,
    },
    {
        id: "a2",
        courseId: "c1",
        FacultyId: "t1",
        title: "Pandas Data Analysis",
        description: "Perform exploratory data analysis on the provided Titanic dataset. Answer 5 questions using Pandas groupby and pivot tables.",
        dueDate: "2025-03-20",
        maxMarks: 30,
    },
    {
        id: "a3",
        courseId: "c1",
        FacultyId: "t1",
        title: "Linear Regression Project",
        description: "Build a linear regression model to predict house prices using the provided dataset. Include model evaluation metrics.",
        dueDate: "2025-04-01",
        maxMarks: 50,
    },
    {
        id: "a4",
        courseId: "c2",
        FacultyId: "t2",
        title: "Java OOP Assignment",
        description: "Create a Java program implementing a Bank Account system with classes for SavingsAccount, CurrentAccount, and Overdraft handling.",
        dueDate: "2025-03-15",
        maxMarks: 25,
    },
];

export const SUBMISSIONS: Submission[] = [
    {
        id: "s1",
        assignmentId: "a1",
        studentId: "u1",
        submittedAt: "2025-03-08",
        grade: 17,
        feedback: "Good work! Clean code and correct output. Try to add more comments.",
    },
    {
        id: "s2",
        assignmentId: "a2",
        studentId: "u1",
        submittedAt: "2025-03-18",
        grade: 26,
        feedback: "Excellent analysis! The visualizations were insightful.",
    },
];

// ─────────────────────────────────────────────
//  TESTS
// ─────────────────────────────────────────────
export const TESTS: Test[] = [
    {
        id: "t1",
        courseId: "c1",
        title: "Python Fundamentals Quiz",
        durationMinutes: 20,
        totalMarks: 10,
        questions: [
            {
                id: "q1",
                text: "Which of the following is used to define a function in Python?",
                options: ["function", "def", "define", "func"],
                correctIndex: 1,
            },
            {
                id: "q2",
                text: "What is the output of: print(type([]))?",
                options: ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "None"],
                correctIndex: 0,
            },
            {
                id: "q3",
                text: "Which method adds an element to the end of a list?",
                options: ["insert()", "add()", "append()", "push()"],
                correctIndex: 2,
            },
            {
                id: "q4",
                text: "What does 'import numpy as np' do?",
                options: [
                    "Installs NumPy",
                    "Imports NumPy and gives it alias np",
                    "Creates a variable named np",
                    "Runs a NumPy script",
                ],
                correctIndex: 1,
            },
            {
                id: "q5",
                text: "What is a Pandas DataFrame?",
                options: [
                    "A 1D labeled array",
                    "A 2D table with rows and columns",
                    "A Python dictionary",
                    "A database connection",
                ],
                correctIndex: 1,
            },
            {
                id: "q6",
                text: "Which keyword exits a loop prematurely?",
                options: ["exit", "continue", "pass", "break"],
                correctIndex: 3,
            },
            {
                id: "q7",
                text: "What does len([1,2,3]) return?",
                options: ["2", "4", "3", "1"],
                correctIndex: 2,
            },
            {
                id: "q8",
                text: "Which is NOT a valid Python data type?",
                options: ["int", "float", "char", "bool"],
                correctIndex: 2,
            },
            {
                id: "q9",
                text: "How do you start a comment in Python?",
                options: ["//", "<!-- -->", "#", "/*"],
                correctIndex: 2,
            },
            {
                id: "q10",
                text: "What does the range(5) function produce?",
                options: ["[1,2,3,4,5]", "[0,1,2,3,4]", "[0,1,2,3,4,5]", "[1,2,3,4]"],
                correctIndex: 1,
            },
        ],
    },
    {
        id: "t2",
        courseId: "c1",
        title: "Machine Learning Concepts Quiz",
        durationMinutes: 15,
        totalMarks: 5,
        questions: [
            {
                id: "q11",
                text: "What type of ML uses labeled training data?",
                options: ["Unsupervised", "Reinforcement", "Supervised", "Semi-supervised"],
                correctIndex: 2,
            },
            {
                id: "q12",
                text: "Which algorithm is used for regression problems?",
                options: ["K-Means", "Decision Tree", "Linear Regression", "PCA"],
                correctIndex: 2,
            },
            {
                id: "q13",
                text: "What is overfitting in ML?",
                options: [
                    "Model performs well on both train and test",
                    "Model performs well on train but poorly on test",
                    "Model fails to learn patterns",
                    "Model trains too slowly",
                ],
                correctIndex: 1,
            },
            {
                id: "q14",
                text: "What does 'train_test_split' do?",
                options: [
                    "Trains the model",
                    "Splits data into training and testing sets",
                    "Tests the model",
                    "Validates the model",
                ],
                correctIndex: 1,
            },
            {
                id: "q15",
                text: "Which metric evaluates regression models?",
                options: ["Accuracy", "Precision", "RMSE (Root Mean Square Error)", "F1-Score"],
                correctIndex: 2,
            },
        ],
    },
];

export const TEST_ATTEMPTS: TestAttempt[] = [
    {
        id: "ta1",
        testId: "t1",
        studentId: "u1",
        score: 8,
        submittedAt: "2025-02-28",
        answers: [1, 0, 2, 1, 1, 3, 2, 2, 2, 1],
    },
];

// ─────────────────────────────────────────────
//  ANNOUNCEMENTS
// ─────────────────────────────────────────────
export const ANNOUNCEMENTS: Announcement[] = [
    {
        id: "an1",
        batchId: "b1",
        FacultyId: "t1",
        message: "Welcome to the Data Science + AI batch! Classes start Monday at 10 AM. Please join the WhatsApp group shared via email.",
        createdAt: "2025-01-18",
        iconType: "confetti"
    },
    {
        id: "an2",
        batchId: "b1",
        FacultyId: "t1",
        message: "Reminder: Python Basics Assignment (Assignment 1) is due by March 10. Submit your .py file via the portal.",
        createdAt: "2025-03-05",
        iconType: "pin"
    },
    {
        id: "an3",
        batchId: "b1",
        FacultyId: "t1",
        message: "No class this Friday (March 14) — National Holiday. Classes resume Monday as usual.",
        createdAt: "2025-03-12",
        iconType: "holiday"
    },
    {
        id: "an4",
        batchId: "b2",
        FacultyId: "t2",
        message: "Welcome to the Full Stack Java evening batch! Please ensure you have JDK 17 installed before Thursday's class.",
        createdAt: "2025-02-02",
        iconType: "wave"
    },
];

// ─────────────────────────────────────────────
//  HELPER FUNCTIONS
// ─────────────────────────────────────────────
export function getUserById(id: string): User | undefined {
    return USERS.find((u) => u.id === id);
}

export function getCourseById(id: string): Course | undefined {
    return COURSES.find((c) => c.id === id);
}

export function getEnrollmentsForStudent(studentId: string): Enrollment[] {
    return ENROLLMENTS.filter((e) => e.studentId === studentId);
}

export function getEnrollmentsForCourse(courseId: string): Enrollment[] {
    return ENROLLMENTS.filter((e) => e.courseId === courseId);
}

export function getAssignmentsForCourse(courseId: string): Assignment[] {
    return ASSIGNMENTS.filter((a) => a.courseId === courseId);
}

export function getSubmissionsForStudent(studentId: string): Submission[] {
    return SUBMISSIONS.filter((s) => s.studentId === studentId);
}

export function getTestsForCourse(courseId: string): Test[] {
    return TESTS.filter((t) => t.courseId === courseId);
}

export function getTestAttemptsForStudent(studentId: string): TestAttempt[] {
    return TEST_ATTEMPTS.filter((ta) => ta.studentId === studentId);
}

export function getBatchForStudent(studentId: string): Batch | undefined {
    return BATCHES.find((b) => b.studentIds.includes(studentId));
}

export function getAnnouncementsForBatch(batchId: string): Announcement[] {
    return ANNOUNCEMENTS.filter((a) => a.batchId === batchId).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getCoursesForFaculty(FacultyId: string): Course[] {
    return COURSES.filter((c) => c.FacultyId === FacultyId);
}

export function getAllLessonsFlat(course: Course): Lesson[] {
    return course.modules.flatMap((m) => m.lessons).sort((a, b) => a.order - b.order);
}
