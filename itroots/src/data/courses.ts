// ITROOTS Course Data
export interface Course {
  slug: string;
  title: string;
  shortTitle: string;
  shortDescription: string;
  fullDescription: string;
  duration: string;
  mode: 'Online' | 'Offline' | 'Hybrid' | 'Online / Offline';
  price: number;
  discountedPrice?: number;
  highlights: string[];
  curriculum: {
    module: string;
    topics: string[];
    duration?: string;
    deliverables?: string;
  }[];
  jobRoles: string[];
  isJobGuarantee: boolean;
  icon: string;
  color: string;
  pastelColor?: string;
  cardImage?: string;
  category: string;
  brochureUrl?: string;
  tools?: string[];
  projects?: {
    title: string;
    description: string;
    image: string;
  }[];
  mentors?: {
    name: string;
    role: string;
    company: string;
    image: string;
  }[];
  faqs?: {
    question: string;
    answer: string;
  }[];
  successStories?: {
    name: string;
    role: string;
    quote: string;
    image: string;
  }[];
}



export const courses: Course[] = [
  {
    slug: 'data-science-with-ai',
    title: 'Data Science with AI',
    shortTitle: 'Data Science AI',
    shortDescription: '6-month career-building journey to become an AI-driven data professional.',
    fullDescription: 'The Data Science with AI Program is a 6-month career-building journey designed to make you an AI-driven data professional. You’ll learn to analyze and model data, build machine learning and deep learning solutions, and use AI tools to deliver predictive insights and business intelligence.',
    duration: '6 Months',
    mode: 'Hybrid',
    price: 85000,
    discountedPrice: 65000,
    highlights: [
      '100% Placement Guarantee',
      'Refund Guarantee',
      'Post-Placement Support',
      'Lifetime Career Assistance',
      'Project-Oriented, AI-Integrated Training',
      'Expert Mentorship (10+ Years Exp)',
      'Daily 5-6 Hours Practical Training',
      'Regular Assessments & Mock Interviews'
    ],
    curriculum: [
      {
        module: 'Fundamentals of Data Science & AI',
        duration: '4 Weeks',
        topics: [
          'Data Science and its concepts',
          'Artificial Intelligence and its types',
          'Machine Learning and its types',
          'Essence of data in Data Science',
          'Various Data Formats , Data Storage',
          'Data Warehousing, Big Data',
          'Application of statistics in Data Science'
        ],
        deliverables: 'You understand the Data Science ecosystem, AI landscape, and can articulate how data drives business decisions to peers and stakeholders.'
      },
      {
        module: 'Python Programming',
        duration: '6 Weeks',
        topics: [
          'Introduction to Python',
          'Variable and constants',
          'Conditional constructs and loops',
          'List, Tuples , Sets and Dictionary',
          'Function ,Modules and Packages',
          'Object Oriented Programming',
          'Exception Handling',
          'Database handling in Python',
          'String and Regular Expressions',
          'Lambdas and Higher Order Functions',
          'Generator and iterators',
          'Map ,Filter and Decorators',
          'Capstone Project'
        ],
        deliverables: 'You can write production-quality Python code, build reusable modules, and complete a capstone project demonstrating OOP and data handling skills.'
      },
      {
        module: 'SQL',
        duration: '4 Weeks',
        topics: [
          'Introduction to RDBMS concepts',
          'Retrieving data',
          'Filtering and Sorting data',
          'Single row functions',
          'Aggregate functions',
          'Joins, Sub-queries',
          'CRUD using SQL syntax',
          'DDL, constraints'
        ],
        deliverables: 'You can query, manipulate, and manage relational databases confidently for real-world analytics tasks.'
      },
      {
        module: 'Excel for Data Analysis',
        duration: '4 Weeks',
        topics: [
          'Introduction to Excel for BI',
          'Data Entry and Cleaning',
          'Essential Formulas and Functions',
          'Data Analysis Tools',
          'Pivot Tables and Pivot Chart',
          'Power Pivot and Data Modeling',
          'Data Visualization- Excel Graphs',
          'Excel BI Dashboards',
          'Integration and Automation'
        ],
        deliverables: 'You can build interactive Excel dashboards with Pivot Tables and Power Pivot for business intelligence reporting.'
      },
      {
        module: 'Data Science Libraries',
        duration: '5 Weeks',
        topics: [
          'A. Numpy: Introduction, Arrays, Manipulation, Indexing, Slicing, Broadcasting, Reshaping, Statistical Functions',
          'B. Pandas: Data Structures, Excel/CSV Import & Export, Querying, Slicing, Exploratory Data Analysis, Cleansing',
          'C. Visualization: Matplotlib, Line/Bar/Histogram, Scatter/Box/Pie charts, SNS Heatmaps'
        ],
        deliverables: 'You master NumPy, Pandas, and visualization libraries to perform end-to-end exploratory data analysis on any dataset.'
      },
      {
        module: 'Python Powered Statistics',
        duration: '5 Weeks',
        topics: [
          'Statistics and its Types',
          'Descriptive statistical concepts',
          'Measures of tendency, Dispersion, Relationship & Shape',
          'Moments, Correlation and Regression',
          'Probability and its Types',
          'Naïve Bayes - Conditional probability',
          'Probability Distributions',
          'Sampling Theory',
          'Hypothesis Testing & Confidence Interval'
        ],
        deliverables: 'You can apply statistical analysis and hypothesis testing using Python to derive data-driven business insights.'
      },
      {
        module: 'Data Science–Machine Learning',
        duration: '6 Weeks',
        topics: [
          'Regression Supervised ML & Performance Metrics',
          'Unsupervised ML & Clustering (K-Means)',
          'Dimensionality Reduction (PCA)',
          'Hyperparameter tuning & GridSearchCV',
          'K-fold Cross Validation',
          'Neural Networks & Deep Learning',
          'NLP & Generative AI Overview',
          'Linear/Logistic Regression, Decision Tree, Random Forest',
          'Support Vector Machine and KNN',
          'Train test Split in ML'
        ],
        deliverables: 'You can build, evaluate, and tune ML models for classification, regression, and clustering problems.'
      },
      {
        module: 'R Programming for Data Science',
        duration: '4 Weeks',
        topics: [
          'Introduction & R constructs',
          'Data Structures in R',
          'Function In R',
          'Data Cleansing in R',
          'Machine Learning, Regression & Classification in R'
        ],
        deliverables: 'You can perform data analysis and build ML models in R, expanding your toolkit beyond Python.'
      },
      {
        module: 'Capstone Project',
        duration: '4 Weeks',
        topics: [
          'Project Life Cycle',
          'EDA',
          'Implement using ML',
          'Summary Report of Project Analysis'
        ],
        deliverables: 'You deliver a complete end-to-end data science project with EDA, ML implementation, and a professional analysis report.'
      },
      {
        module: 'Gen AI',
        duration: '4 Weeks',
        topics: [
          'Evolution of AI to Generative AI',
          'Foundation Models & Transformers',
          'Prompt Engg Essentials',
          'Generative AI tools and Platforms',
          'Responsible AI Use'
        ],
        deliverables: 'You understand generative AI fundamentals, can use prompt engineering effectively, and apply AI tools responsibly.'
      },
      {
        module: 'Employability Lab',
        duration: '3 Weeks',
        topics: [
          'Personal Mentoring',
          'Extensive Practice',
          'Grooming by Industry Expert',
          'Interview Preparation'
        ],
        deliverables: 'You are interview-ready with polished communication, technical confidence, and a strong professional profile.'
      },
      {
        module: 'Quantitative Aptitude',
        duration: '3 Weeks',
        topics: [
          'Numbers, Progressions, HCF & LCM',
          'Percentages, Averages, Ratio & Proportion',
          'Simple and Compound interest, Profit and Loss',
          'Mixtures and Allegations, Work, Pipes and Cistern',
          'Permutations and Combinations, Probability',
          'Sets, Relations, Sequence and Series',
          'Faster Calculation techniques'
        ],
        deliverables: 'You can confidently clear aptitude rounds in placement drives with strong quantitative and logical reasoning skills.'
      }
    ],
    jobRoles: ['Data Scientist', 'ML Engineer', 'AI Developer', 'Data Analyst', 'Business Intelligence Analyst'],
    isJobGuarantee: true,
    icon: 'Brain',
    color: '#0881ec',
    pastelColor: '#E0F2FE', // Light Blue
    cardImage: '/images/courses/DSA.png',
    category: 'Data & AI',
    brochureUrl: '/brochures/data-science-ai.pdf',
    tools: ['Python', 'SQL', 'R', 'Excel', 'NumPy', 'Machine Learning', 'Deep Learning', 'Data Analytics', 'Statistics', 'AWS'],
    projects: [
      {
        title: 'Loan Granting System',
        description: 'A modern digital platform for loan processing that features digital applications, instant verification, and efficient funds disbursement, focused on partnering for the customer\'s future.',
        image: '/images/projects/data-science-with-ai/loan-granting-system.png'
      },
      {
        title: 'Insurance Management System',
        description: 'A unified digital platform for managing a diverse portfolio of insurance services, including health, finance, property, travel, and vehicle insurance, streamlining the entire insurance lifecycle.',
        image: '/images/projects/data-science-with-ai/insurance-management-system.png'
      },
      {
        title: 'Credit Card Fraud Detection System',
        description: 'An advanced AI-driven system designed to monitor and analyze transactions in real-time. It identifies suspicious activities and generates fraud alerts to enhance financial security.',
        image: '/images/projects/data-science-with-ai/credit-card-fraud-detection.png'
      }
    ],
    mentors: [
      {
        name: 'Sachin Kulkarni',
        role: 'Senior Data Scientist',
        company: 'MNC',
        image: ''
      },
      {
        name: 'Prashant Joshi',
        role: 'AI Architect',
        company: 'Top Tech Firm',
        image: ''
      },
      {
        name: 'Deepak Sharma',
        role: 'AI Researcher',
        company: 'Tech Giant',
        image: ''
      }
    ],
    successStories: [
      {
        name: 'Harsh Patil',
        role: 'Placed within 1 Week',
        quote: 'Joining ITROOTS was the best decision. In just six months, I learned Frontend, Backend, and Database and got placed within a week! The team is dedicated.',
        image: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      {
        name: 'Mayur Aware',
        role: 'Career Starter',
        quote: 'Excellent place for learning. The team helped me build knowledge from basics even from a non-IT background. Started my career with confidence.',
        image: 'https://randomuser.me/api/portraits/men/45.jpg'
      },
      {
        name: 'Priya Wagh',
        role: 'Software Developer',
        quote: 'Grow from basics to professional. Trainers are experienced and always approachable. Grateful to the entire ITROOTS team.',
        image: 'https://randomuser.me/api/portraits/women/44.jpg'
      }
    ],
    faqs: [
      {
        question: 'Do I need a strong math background?',
        answer: 'Basic high school math is sufficient. We cover all necessary statistics and linear algebra concepts from scratch during the course.'
      },
      {
        question: 'What kind of laptop do I need?',
        answer: 'A laptop with at least 8GB RAM (16GB recommended) and an i5 processor or equivalent is perfectly suitable for all ML tasks.'
      },
      {
        question: 'Is placement assistance provided?',
        answer: 'Yes, we provide 100% Placement Guarantee. We ensure every learner achieves their career goal with interview prep and referrals.'
      }
    ]
  },
  {
    slug: 'full-stack-java-certification',
    title: 'Full Stack Java Certification Program',
    shortTitle: 'Full Stack Java',
    shortDescription: 'AI-integrated full stack Java program covering frontend, backend, databases, and real projects.',
    fullDescription: 'The Java Full Stack Development (AI-Integrated) Program is a complete 6-month career transformation journey designed to make you an industry-ready developer. You’ll learn frontend, backend, and database development while integrating AI tools that improve productivity, debugging, and real-world problem-solving. Mode: Online / Offline.',
    duration: '6 Months',
    mode: 'Hybrid',
    price: 75000,
    discountedPrice: 55000,
    highlights: [
      '100% Placement Guarantee',
      'Post-Placement Support',
      'Expert Mentorship (10+ Years Exp)',
      'Daily 5-6 Hours Practical Training',
      'Refund Guarantee',
      'Lifetime Career Assistance',
      'Project-Oriented, AI-Integrated Training',
      'Regular Assessments & Mock Interviews'
    ],
    curriculum: [
      {
        module: 'Module 01: Java Fundamentals',
        topics: [
          'Introduction to Java | JVM, JRE, JDK Architecture',
          'Installing Java & Environment Setup',
          'First Java Program | Compilation & Execution Flow',
          'Data Types & Variables | Type Casting',
          'Operators – Arithmetic, Relational, Logical, Bitwise',
          'Input/Output in Java | Comments & Code Structure',
          'Weekly Test + Hands-On Revision + Q&A'
        ]
      },
      {
        module: 'Module 02: Control Statements & Loops',
        topics: [
          'Decision Making – if, else-if, nested if | Switch Case',
          'Loops – for, while, do-while',
          'Loop Control – break, continue | Nested Loops',
          'Pattern Programs | Debugging Techniques',
          'Weekly Test + Coding Challenges + Q&A'
        ]
      },
      {
        module: 'Module 03: Object-Oriented Programming',
        topics: [
          'Class & Object Creation',
          'Constructors – Default, Parameterized',
          'this & super Keyword | Static Keyword',
          'Method Overloading (Compile Time Polymorphism)',
          'Method Overriding (Runtime Polymorphism)',
          'Inheritance – Single, Multilevel, Hierarchical',
          'Abstraction – Abstract Class & Interface',
          'Encapsulation – Getters/Setters | Access Modifiers',
          'Packages & Import',
          'Weekly Test + OOP Coding Assignments + Q&A'
        ]
      },
      {
        module: 'Module 04: Strings & Arrays in Java',
        topics: [
          '1D & 2D Arrays | Array Traversal & Manipulation',
          'Searching & Sorting (Java Implementation)',
          'Strings – Immutable Concept | String Methods',
          'StringBuilder & StringBuffer',
          'Common String Problems – Palindrome, Anagram, Subsequence, Frequency Count',
          'Weekly Test + Problem-Solving Session'
        ]
      },
      {
        module: 'Module 05: Exception Handling',
        topics: [
          'Introduction to Exceptions',
          'Types – Checked & Unchecked',
          'try–catch–finally | throw & throws',
          'Custom Exception Creation',
          'Nested Try Blocks',
          'Practical Error Handling Scenarios',
          'Weekly Test + Hands-On Exception Practice + Q&A'
        ]
      },
      {
        module: 'Module 06: Java Memory & Advanced Concepts',
        topics: [
          'Stack vs Heap Memory | Garbage Collection',
          'Wrapper Classes | Autoboxing & Unboxing',
          'Varargs | Enum | Java Annotations (Intro)',
          'Final Keyword',
          'Weekly Assessment + Revision'
        ]
      },
      {
        module: 'Module 07: Collection Framework',
        topics: [
          'Introduction to Collections',
          'List – ArrayList, LinkedList',
          'Set – HashSet, LinkedHashSet, TreeSet',
          'Map – HashMap, LinkedHashMap, TreeMap',
          'Iterator & ListIterator',
          'Comparator & Comparable | Sorting Collections',
          'Queue & PriorityQueue',
          'Common Algorithm Problems Using Collections',
          'Weekly Test + Coding Challenges + Q&A'
        ]
      },
      {
        module: 'Module 08: Multithreading',
        topics: [
          'Thread Class, Runnable Interface | Thread Lifecycle',
          'Synchronization | Inter-Thread Communication',
          'Deadlock & Race Conditions | Thread Priority',
          'Executor Framework (Intro)',
          'Practical Multithreading Problems',
          'Weekly Test + Hands-On Revision'
        ]
      },
      {
        module: 'Module 09: File Handling',
        topics: [
          'File Class | Reading Files – FileReader, BufferedReader',
          'Writing Files – FileWriter, BufferedWriter',
          'Byte Streams | Serialization & Deserialization',
          'Real-Time File Operations',
          'Weekly Test + Coding Assignments'
        ]
      },
      {
        module: 'Module 10: JDBC (Java Database Connectivity)',
        topics: [
          'JDBC Architecture',
          'Steps to Connect Java with Database',
          'DriverManager, Connection, Statement | PreparedStatement',
          'CRUD Operations | Batch Processing | ResultSet Handling',
          'Handling SQL Exceptions',
          'Building a Java + MySQL Mini Application',
          'Weekly Test + Assignment Project + Q&A'
        ]
      },
      {
        module: 'Module 11: Web UI Fundamentals',
        topics: ['HTML5 & CSS3', 'JavaScript Basics', 'Bootstrap', 'jQuery', 'Responsive UI']
      },
      {
        module: 'Module 12: Advanced Java & Frameworks',
        topics: ['JSP & Servlets', 'Hibernate', 'Spring Core', 'Spring MVC', 'Spring Boot']
      },
      {
        module: 'Module 13: Quantitative Aptitude',
        topics: ['Number System & Percentages', 'Profit & Loss', 'Simple & Compound Interest', 'Ratio & Proportion', 'Time, Speed & Distance', 'Permutation & Combination', 'Probability', 'Logical Reasoning', 'Coding-Decoding', 'Blood Relations']
      }
    ],
    jobRoles: ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    isJobGuarantee: true,
    icon: 'Code2',
    color: '#0668c2',
    pastelColor: '#F3E8FF', // Light Purple
    cardImage: '/images/courses/FSJ.png',
    category: 'Development',
    brochureUrl: '/brochures/full-stack-java.pdf',
    tools: [
      'Core Java',
      'Spring Boot',
      'Hibernate',
      'HTML',
      'CSS',
      'JavaScript',
      'Bootstrap',
      'React',
      'Angular',
      'MySQL',
      'Git',
      'JIRA'
    ],
    projects: [
      {
        title: 'Student Management System',
        description: 'Manage students, courses, fees, and attendance with role-based access.',
        image: '/images/projects/full-stack-java/Student%20management%20system.png'
      },
      {
        title: 'Product Inventory Management',
        description: 'Track stock, suppliers, sales, and reorder levels in a web dashboard.',
        image: '/images/projects/full-stack-java/Product%20inventory%20system.png'
      },
      {
        title: 'Loan Granting System',
        description: 'Process loan applications, approvals, and officer workflows with reports.',
        image: '/images/projects/full-stack-java/Loan%20inventory%20management.png'
      }
    ],
    mentors: [
      {
        name: 'Saurabh Kulkarni',
        role: 'Java Architect',
        company: 'MNC',
        image: ''
      },
      {
        name: 'Pooja Patil',
        role: 'Full Stack Trainer',
        company: 'Top Tech Firm',
        image: ''
      },
      {
        name: 'Amit Singh',
        role: 'Senior Backend Dev',
        company: 'Product Co',
        image: ''
      }
    ],
    successStories: [
      {
        name: 'Harsh Patil',
        role: 'Software Developer',
        quote: 'Built full stack projects and cleared interviews quickly after the Java program.',
        image: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      {
        name: 'Mayur Aware',
        role: 'Backend Engineer',
        quote: 'The hands-on training and mock interviews helped me land my first role.',
        image: 'https://randomuser.me/api/portraits/men/45.jpg'
      },
      {
        name: 'Priya Wagh',
        role: 'Full Stack Developer',
        quote: 'Excellent mentors and real projects made me industry ready.',
        image: 'https://randomuser.me/api/portraits/women/44.jpg'
      }
    ]
  },
  {
    slug: 'cyber-security-job-guarantee',
    title: 'Cyber Security Job Guarantee Program',
    shortTitle: 'Cyber Security',
    shortDescription: 'Hands-on cybersecurity program covering ethical hacking, network defense, and real-world simulations.',
    fullDescription: 'The Cybersecurity Program is a 6-month hands-on course built to shape industry-ready professionals. Learn ethical hacking, network defense, and risk management, and work on real-world simulations to detect, prevent, and respond to cyber threats. Mode: Online / Offline.',
    duration: '6 Months',
    mode: 'Hybrid',
    price: 95000,
    discountedPrice: 75000,
    highlights: [
      '100% Placement Guarantee',
      'Expert Mentorship (10+ Years Exp)',
      'Daily 5-6 Hours Practical Training',
      'Refund Guarantee',
      'Lifetime Career Assistance',
      'Project-Oriented, AI-Integrated Training',
      'Regular Assessments & Mock Interviews',
      'Post-Placement Support'
    ],
    curriculum: [
      {
        module: 'Module 1: Introduction to Cybersecurity',
        topics: [
          'Cybersecurity Fundamentals: Definition, Threats (Malware, Phishing, Ransomware)',
          'Attack Vectors (Network, Social Engineering, Web)',
          'Cybersecurity Standards (NIST, ISO 27001)',
          'Cybersecurity Career Paths: Roles, Progression, Certifications (CISSP, CISM, CEH, OSCP)',
          'Ethical Hacking: Frameworks (OWASP, PTES), Legal and Ethical Considerations'
        ]
      },
      {
        module: 'Module 2: Network Security',
        topics: [
          'Network Fundamentals: TCP/IP, Topologies, Devices (Routers, Switches, Firewalls)',
          'Network Security Concepts: Threats (DoS, DDoS, MiTM), Controls (Firewalls, IDS, IPS)',
          'Network Scanning and Reconnaissance: Port scanning (Nmap, Nessus), Service/Version Detection',
          'Vulnerability Scanning and Assessment'
        ]
      },
      {
        module: 'Module 3: Web Application Security',
        topics: [
          'Web Application Fundamentals: Architecture (Client-Server, Three-Tier)',
          'Web App Vulnerabilities (SQL Injection, XSS, CSRF)',
          'Web Application Security Testing: Manual techniques (Parameter Tampering, Session Hijacking)',
          'Automated tools (Burp Suite, OWASP ZAP), Web Application Firewalls (WAF)'
        ]
      },
      {
        module: 'Module 4: System Hacking',
        topics: [
          'Operating System Security: Windows and Linux configurations',
          'Privilege escalation techniques',
          'Malware analysis and reverse engineering',
          'System Hacking Tools: Metasploit Framework, Kali Linux, PowerShell scripting'
        ]
      },
      {
        module: 'Module 5: Excel for Business Insights',
        topics: [
          'Data Cleaning Techniques: Find & Replace, Text to Columns, Remove Duplicates',
          'Dashboarding: Creating Dashboards using Excel',
          'Advanced Excel Functions: LOOKUPs, IF, COUNTIFS, SUMIFS, TEXT, DATE',
          'Conditional Formatting, Data Validation, Pivot Tables & Charts',
          'Business Case and Metrics Tracking'
        ]
      },
      {
        module: 'Module 6: Aptitude, Communication & Career Readiness',
        topics: [
          'Quantitative Aptitude & Logical Reasoning',
          'Verbal Ability & Soft Skills',
          'Resume & LinkedIn Optimization',
          'Technical & HR Mock Interviews',
          'STAR Technique for Interviews'
        ]
      }
    ],
    jobRoles: ['Security Analyst', 'Ethical Hacker', 'SOC Analyst', 'Penetration Tester'],
    isJobGuarantee: true,
    icon: 'Shield',
    color: '#801c29',
    pastelColor: '#FFE4E6', // Light Red/Pink
    cardImage: '/images/courses/CS.png',
    category: 'Security',
    brochureUrl: '/brochures/cyber-security.pdf',
    tools: [
      'Kali Linux',
      'Metasploit',
      'Burp Suite',
      'Wireshark',
      'Nmap',
      'Nessus',
      'OWASP ZAP',
      'PowerShell',
      'Excel'
    ],
    projects: [
      {
        title: 'Network Vulnerability Assessment',
        description: 'Scan, analyze, and report security gaps across enterprise networks.',
        image: '/images/projects/cyber-security/Network%20Vulnerability%20Assessment.png'
      },
      {
        title: 'Web Application Security Audit',
        description: 'Test OWASP Top 10 vulnerabilities using manual and automated tools.',
        image: '/images/projects/cyber-security/Web%20Application%20Security%20Audit.png'
      },
      {
        title: 'SOC Incident Response Simulation',
        description: 'Analyze logs, detect threats, and prepare incident response reports.',
        image: '/images/projects/cyber-security/SOC%20incident.png'
      }
    ],
    mentors: [
      {
        name: 'Aditya Deshmukh',
        role: 'Security Analyst',
        company: 'MNC',
        image: ''
      },
      {
        name: 'Neha Jadhav',
        role: 'Ethical Hacking Trainer',
        company: 'Top Tech Firm',
        image: ''
      },
      {
        name: 'Rohan Verma',
        role: 'Security Architect',
        company: 'Global Bank',
        image: ''
      }
    ],
    successStories: [
      {
        name: 'Harsh Patil',
        role: 'SOC Analyst',
        quote: 'Hands-on labs and real security scenarios helped me break into SOC roles.',
        image: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      {
        name: 'Mayur Aware',
        role: 'Security Analyst',
        quote: 'The mentorship and mock interviews made the placement process smooth.',
        image: 'https://randomuser.me/api/portraits/men/45.jpg'
      },
      {
        name: 'Priya Wagh',
        role: 'Penetration Tester',
        quote: 'Great practical exposure to tools like Burp Suite and Metasploit.',
        image: 'https://randomuser.me/api/portraits/women/44.jpg'
      }
    ]
  },
  {
    slug: 'data-analytics-python',
    title: 'Data Analytics with Python Certification',
    shortTitle: 'Data Analytics Python',
    shortDescription: 'Intensive program with Excel, SQL, Power BI, Python, and AI-based analytics tools.',
    fullDescription: 'The Data Analytics with Python is a 6-month intensive course crafted to make you an industry-ready analytics expert. Gain hands-on experience with Excel, SQL, Power BI, Python, and AI-based analytics tools to turn data into powerful business insights and strategic decisions. Mode: Online / Offline.',
    duration: '6 Months',
    mode: 'Hybrid',
    price: 55000,
    discountedPrice: 42000,
    highlights: [
      '100% Placement Guarantee',
      'Expert Mentorship (10+ Years Exp)',
      'Daily 5-6 Hours Practical Training',
      'Refund Guarantee',
      'Lifetime Career Assistance',
      'Project-Oriented, AI-Integrated Training',
      'Post-Placement Support',
      'Regular Assessments & Mock Interviews'
    ],
    curriculum: [
      {
        module: 'Module 01: Python Programming Fundamentals',
        topics: [
          'Introduction to Python | Python Installation & Setup',
          'Understanding Syntax & Indentation',
          'Variables & Data Types | Operators & Expressions',
          'Conditional Statements – if, elif, else',
          'Looping Constructs – for, while, nested loops',
          'Hands-On Practice + Weekly Test + Q&A'
        ]
      },
      {
        module: 'Module 02: Data Structures & Core Python Concepts',
        topics: [
          'Lists – Creation, Indexing, Slicing',
          'Tuples – Immutable Sequences',
          'Sets – Operations & Use Cases',
          'Dictionaries – Key-Value Pairs',
          'Advanced List & Dictionary Comprehensions',
          'Hands-On Coding + Practice Assignments + Q&A'
        ]
      },
      {
        module: 'Module 03: Functions & Object-Oriented Programming (OOP)',
        topics: [
          'Defining Functions – Parameters & Arguments',
          'Default, Keyword & Lambda Functions | Variable Scope',
          'Classes & Objects | Constructor (__init__)',
          'Inheritance – Single & Multiple | Polymorphism',
          'Encapsulation | Practical OOP Implementation',
          'OOP Assignments + Coding Challenges + Q&A'
        ]
      },
      {
        module: 'Module 04: File Handling, Exceptions & Python Ecosystem',
        topics: [
          'File Handling – Text, CSV, JSON',
          'File Operations – Open, Read, Write, Close',
          'Exception Handling – try, except, finally | Custom Exceptions',
          'Built-in Modules – math, datetime, os',
          'Creating Custom Modules | Packages & Virtual Environments',
          'Hands-On Practice + Weekly Test + Q&A'
        ]
      },
      {
        module: 'Module 05: Web Development with Django',
        topics: [
          'Django Basics & Web Development Concepts',
          'HTTP Requests & Responses | Project & App Structure',
          'Models & ORM – Migrations, CRUD Operations',
          'QuerySets | Views & URLs – Dynamic Routing',
          'Templates & Static Files | Forms & Validation',
          'Authentication & Admin | Django REST Framework',
          'APIs & Postman | Git & Deployment Basics',
          'Mini Project + Practical Labs + Q&A'
        ]
      },
      {
        module: 'Module 06: Excel for Data Analysts',
        topics: [
          'Excel Basics | Tables & Ranges | Conditional Formatting',
          'Sorting & Filtering | Charts & Graphs | Pivot Tables',
          'Lookup Functions – VLOOKUP, HLOOKUP, XLOOKUP',
          'Data Cleaning | What-If Analysis',
          'Macros & Productivity Shortcuts',
          'Practical Exercises + Business Use Cases + Q&A'
        ]
      },
      {
        module: 'Module 07: SQL for Data Analytics',
        topics: [
          'Relational Database Concepts | MySQL / PostgreSQL Basics',
          'SELECT, INSERT, UPDATE, DELETE',
          'Filtering & Sorting | Joins – Inner, Left, Right, Full',
          'GROUP BY & HAVING | Aggregate Functions',
          'Subqueries | Views & Indexing | Data Normalization',
          'Hands-On Queries + Practice Sets + Q&A'
        ]
      },
      {
        module: 'Module 08: Python for Data Analysis',
        topics: [
          'Python Refresher for Analytics | Jupyter Notebooks',
          'Working with CSV & JSON',
          'NumPy – Arrays, Indexing, Slicing',
          'Pandas – DataFrames & Series',
          'Data Cleaning & Transformation | Handling Nulls, Outliers & Duplicates',
          'Date-Time Operations | Hands-On Labs + Weekly Test + Q&A'
        ]
      },
      {
        module: 'Module 09: Data Visualization & Statistics',
        topics: [
          'Data Visualization – Matplotlib, Seaborn, Plotly (Intro)',
          'Charts – Line, Bar, Histogram, Boxplot',
          'Heatmaps & Correlation | Excel vs Python Visualization',
          'Descriptive Statistics | Probability Basics | Distributions',
          'Hypothesis Testing – z-test, t-test | Outlier Detection',
          'Visualization Tasks + Statistical Analysis + Q&A'
        ]
      },
      {
        module: 'Module 10: Power BI & Tableau (BI Tools)',
        topics: [
          'Power BI – Data Loading, Power Query, Visualizations, Filters, DAX Functions',
          'Interactive Dashboards | Sharing & Publishing Reports',
          'Tableau – Data Connections, Visualizations, Dashboards, Stories',
          'Tableau Public Publishing',
          'Dashboard Projects + Case Studies + Q&A'
        ]
      },
      {
        module: 'Module 11: Quantitative Aptitude',
        topics: [
          'Number Systems, Simplification, Ratio & Proportion',
          'Percentages, Averages, Profit & Loss',
          'Simple & Compound Interest',
          'Time & Work, Time-Speed-Distance',
          'Data Interpretation'
        ]
      },
      {
        module: 'Module 12: Logical Reasoning',
        topics: [
          'Series (Numbers & Alphabets), Coding-Decoding',
          'Blood Relations, Direction Sense',
          'Seating Arrangement, Puzzles',
          'Syllogism, Venn Diagrams',
          'Ranking & Ordering, Clock & Calendar'
        ]
      },
      {
        module: 'Module 13: Verbal Ability',
        topics: [
          'Vocabulary Building',
          'Grammar (Tenses, Articles, Prepositions)',
          'Sentence Framing, Error Spotting',
          'Reading Comprehension',
          'Daily Use Expressions'
        ]
      },
      {
        module: 'Module 14: Communication & Soft Skills',
        topics: [
          'Verbal & Non-Verbal Communication',
          'Body Language, Active Listening',
          'Effective Speaking',
          'Group Discussion Practice',
          'Presentation Skills, Public Speaking',
          'Overcoming Stage Fear'
        ]
      },
      {
        module: 'Module 15: Career & Interview Preparation',
        topics: [
          'Resume Writing, Elevator Pitch',
          'HR Interview Questions, STAR Technique',
          'Mock Interviews',
          'Workplace Etiquette',
          'Time Management & Goal Setting',
          'Weekly Tests + Practice Exercises + Mock Interviews + Final Assessment + Q&A'
        ]
      }
    ],
    jobRoles: ['Data Analyst', 'Business Analyst', 'Analytics Consultant', 'BI Developer'],
    isJobGuarantee: true,
    icon: 'BarChart3',
    color: '#3b9995',
    pastelColor: '#E6FFFA', // Mint
    cardImage: '/images/courses/DAP.png',
    category: 'Data & AI',
    brochureUrl: '/brochures/data-analytics-python.pdf',
    tools: [
      'Excel',
      'SQL',
      'Power BI',
      'Tableau',
      'Python',
      'NumPy',
      'Pandas',
      'Jupyter',
      'MatplotlibSeaborn'
    ],
    projects: [
      {
        title: 'Expense & Revenue Dashboard',
        description: 'Track and visualize company expenses and revenues for better forecasting.',
        image: '/images/projects/data-analytics-python/Expense%20&%20Revenue%20Dashboard.png'
      },
      {
        title: 'Public Transport Performance',
        description: 'Analyze ticket and occupancy data to recommend route optimization.',
        image: '/images/projects/data-analytics-python/Public%20Transport%20Performance.png'
      },
      {
        title: 'Product Trends Dashboard',
        description: 'Build interactive dashboards for product trends and customer preferences.',
        image: '/images/projects/data-analytics-python/Product%20Trends%20Dashboard.png'
      }
    ],
    mentors: [
      {
        name: 'Rohit Bhosale',
        role: 'Data Analyst',
        company: 'MNC',
        image: ''
      },
      {
        name: 'Kanchan Pawar',
        role: 'BI Trainer',
        company: 'Top Tech Firm',
        image: ''
      },
      {
        name: 'Priya Desai',
        role: 'Data Consultant',
        company: 'Analytics Firm',
        image: ''
      }
    ],
    successStories: [
      {
        name: 'Harsh Patil',
        role: 'Data Analyst',
        quote: 'Hands-on dashboards and Python projects made interviews much easier.',
        image: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      {
        name: 'Mayur Aware',
        role: 'BI Developer',
        quote: 'Power BI and SQL training helped me transition into analytics quickly.',
        image: 'https://randomuser.me/api/portraits/men/45.jpg'
      },
      {
        name: 'Priya Wagh',
        role: 'Analytics Consultant',
        quote: 'Great mix of Excel, Python, and BI tools with practical assignments.',
        image: 'https://randomuser.me/api/portraits/women/44.jpg'
      }
    ]
  },
  {
    slug: 'artificial-intelligence',
    title: 'Artificial Intelligence Program',
    shortTitle: 'AI Program',
    shortDescription: 'Practical AI program covering Generative AI, Amazon Bedrock, and real-world projects.',
    fullDescription: 'The Artificial Intelligence Program is a 3-month practical course designed to help you master the foundations of AI. You’ll learn machine learning, neural networks, and model building, applying them to real-world problems and intelligent automation. Mode: Online / Offline.',
    duration: '3 Months',
    mode: 'Hybrid',
    price: 90000,
    discountedPrice: 70000,
    highlights: [
      '5 Interview Calls Guarantee',
      'Expert Mentorship (10+ Years Exp)',
      'Daily 2-3 Hours Practical Training',
      'Practical Job-Focused Learning',
      'Project-Oriented Training',
      'Regular Assessments & Mock Interviews',
      'AI-Integrated Hands-On Projects',
      'Lifetime Career Guidance'
    ],
    curriculum: [
      {
        module: 'Module 1: Introduction to Generative AI and Amazon Bedrock',
        topics: [
          'Overview of Generative AI',
          'Introduction to Amazon Bedrock',
          'Use Cases and Industry Applications'
        ]
      },
      {
        module: 'Module 2: Fundamentals of Machine Learning and Deep Learning',
        topics: [
          'Machine Learning and AI Basics',
          'Deep Learning Foundations',
          'Introduction to Transformers and Large Language Models (LLMs)',
          'Foundation Models in Generative AI'
        ]
      },
      {
        module: 'Module 3: Amazon Bedrock Components and Model Services',
        topics: [
          'Amazon Bedrock Core Services',
          'Working with Pre-trained Models',
          'Model Customization and Tuning',
          'Integrating Models into Applications'
        ]
      },
      {
        module: 'Module 4: Building Generative AI Applications with Bedrock',
        topics: [
          'Text Generation and Natural Language Processing (NLP)',
          'Image Generation and Manipulation',
          'Code Generation and Automation Applications',
          'Ethics and Responsible AI'
        ]
      },
      {
        module: 'Module 5: Practical Labs and Hands-On Projects',
        topics: [
          'Model Implementation Lab',
          'Fine-Tuning and Optimization Lab',
          'End-to-End Project Development'
        ]
      }
    ],
    jobRoles: ['AI Engineer', 'ML Engineer', 'Generative AI Engineer', 'AI Architect', 'Prompt Engineer'],
    isJobGuarantee: false,
    icon: 'Cpu',
    color: '#054151',
    pastelColor: '#E0E7FF', // Light Indigo
    cardImage: '/images/courses/AI.png',
    category: 'Data & AI',
    brochureUrl: '/brochures/artificial-intelligence.pdf',
    tools: [
      'Python',
      'Amazon Bedrock',
      'Prompt Engineering',
      'Transformers & LLMs',
      'NLP',
      'Generative AI APIs'
    ],
    projects: [
      {
        title: 'AI Customer Support Assistant',
        description: 'Build a Generative AI chatbot that answers FAQs, summarizes issues, and hands off to human agents with context.',
        image: '/images/projects/ai-program/AI%20Customer%20Support%20Assistant.png'
      },
      {
        title: 'Document Summarizer & Q/A',
        description: 'Create a system that ingests PDFs and produces concise summaries with accurate question answering.',
        image: '/images/projects/ai-program/Document%20Summarizer.png'
      },
      {
        title: 'AI Content Generator',
        description: 'Generate marketing copy and product descriptions using prompt engineering and structured templates.',
        image: '/images/projects/ai-program/AI%20Content%20Generator.png'
      }
    ],
    mentors: [
      {
        name: 'Amit Kulkarni',
        role: 'Generative AI Lead',
        company: 'MNC',
        image: ''
      },
      {
        name: 'Neha Patil',
        role: 'AI Architect',
        company: 'Top Tech Firm',
        image: ''
      },
      {
        name: 'Vikram Malhotra',
        role: 'AI Lead',
        company: 'Tech Solutions',
        image: ''
      }
    ],
    successStories: [
      {
        name: 'Rohan Jadhav',
        role: 'GenAI Engineer',
        quote: 'The Bedrock modules and hands-on labs helped me build real AI apps and crack interviews quickly.',
        image: 'https://randomuser.me/api/portraits/men/61.jpg'
      },
      {
        name: 'Sanjana More',
        role: 'ML Engineer',
        quote: 'I gained confidence in LLMs and prompt engineering. The projects made my portfolio stand out.',
        image: 'https://randomuser.me/api/portraits/women/68.jpg'
      },
      {
        name: 'Akash Joshi',
        role: 'AI Analyst',
        quote: 'Practical training and mock interviews made the placement process smooth and focused.',
        image: 'https://randomuser.me/api/portraits/men/75.jpg'
      }
    ],
    faqs: [
      {
        question: 'Do I need prior AI experience?',
        answer: 'No. We start from fundamentals and build up to Generative AI and Bedrock step by step.'
      },
      {
        question: 'Is the course practical or theory-based?',
        answer: 'It is highly practical with daily labs, real projects, and assessments aligned with industry use cases.'
      },
      {
        question: 'Will I get placement support?',
        answer: 'Yes. You get interview call assistance, mock interviews, and continuous career guidance.'
      }
    ]
  },
  {
    slug: 'dot-net-program',
    title: 'Dot Net Program',
    shortTitle: 'Dot Net',
    shortDescription: 'AI-integrated .NET full stack program covering C#, ASP.NET Core, SQL Server, and projects.',
    fullDescription: 'The DotNet Full Stack Development (AI-Integrated) Program is a 6-month hands-on journey designed to make you an industry-ready developer. You’ll build end-to-end applications using C#, ASP.NET, SQL Server, and AI tools that simplify coding, debugging, and deployment. Mode: Online / Offline.',
    duration: '6 Months',
    mode: 'Hybrid',
    price: 60000,
    discountedPrice: 45000,
    highlights: [
      '100% Placement Guarantee',
      'Post-Placement Support',
      'Expert Mentorship (10+ Years Exp)',
      'Daily 5-6 Hours Practical Training',
      'Refund Guarantee',
      'Lifetime Career Assistance',
      'Project-Oriented, AI-Integrated Training',
      'Regular Assessments & Mock Interviews'
    ],
    curriculum: [
      { module: 'Module 01: Programming Fundamentals & Data Structures', topics: ['IDE Setup & Compilation Process', 'Variables, Data Types & Operators', 'Control Statements & Loops', 'Functions & Recursion', 'Arrays & String Manipulation', 'Searching & Sorting Algorithms', 'Stacks & Linked Lists'] },
      { module: 'Module 02: SQL Server & Database Fundamentals', topics: ['RDBMS Concepts', 'Filtering & Aggregate Functions', 'Joins (Inner, Left, Right, Full)', 'Subqueries & Data Integrity', 'DDL, DML & TCL Commands', 'Views & Indexes'] },
      { module: 'Module 03: PL/SQL Programming', topics: ['PL/SQL Blocks & Variables', 'Cursors (Implicit & Explicit)', 'Stored Procedures & Functions', 'Triggers & Exception Handling'] },
      { module: 'Module 04: Advanced C# & .NET Architecture', topics: ['.NET Architecture (CLR, CLS, CTS)', 'OOPs Concepts in C#', 'Interfaces vs Abstract Classes', 'Delegates & Events', 'LINQ (Query & Method Syntax)', 'ADO.NET (Connection, Command, DataReader)'] },
      { module: 'Module 05: Entity Framework Core', topics: ['EF Core Architecture', 'Code-First Approach & Migrations', 'CRUD Operations with EF', 'Lazy vs Eager Loading'] },
      { module: 'Module 06: ASP.NET Core MVC & Web API', topics: ['Middleware Pipeline & DI', 'MVC Design Pattern', 'Razor Pages & Tag Helpers', 'RESTful Services (GET, POST, PUT, DELETE)', 'JWT Authentication & Swagger Documentation', 'API Versioning & Log Handling'] },
      { module: 'Module 07: Frontend Development with Angular', topics: ['Components & Lifecycle Hooks', 'Data Binding & Directives', 'Services & Dependency Injection', 'Angular Routing & Guards', 'Reactive Forms & Validations', 'Angular Signals & CLI Tools'] },
      { module: 'Module 08: Capstone Projects', topics: ['Loan Granting System', 'Insurance Management System', 'End-to-End Integration Project'] },
      { module: 'Module 09: Soft Skills & Career Readiness', topics: ['Email & Business Writing', 'Group Discussions', 'STAR Technique for Interviews', 'Resume & LinkedIn Optimization'] },
      { module: 'Module 10: Quantitative Aptitude', topics: ['Number Systems & Percentages', 'Profit & Loss', 'Time, Speed & Distance', 'Logical Reasoning & Puzzles'] }
    ],
    jobRoles: ['.NET Developer', 'Backend Developer', 'Software Engineer', 'Application Developer'],
    isJobGuarantee: true,
    icon: 'Layers',
    color: '#8a3d2e',
    pastelColor: '#EEF2FF', // Very Light Indigo/Blue
    cardImage: '/images/courses/NET.png',
    category: 'Development',
    brochureUrl: '/brochures/dotnet.pdf',
    tools: [
      'C#',
      'ASP.NET Core',
      'MVC',
      'Entity Framework',
      'SQL Server',
      'Angular',
      'HTML',
      'CSS',
      'JavaScript',
      'Azure'
    ],
    projects: [
      {
        title: 'Insurance Management System',
        description: 'Build policy, category, and claims modules with admin workflows.',
        image: '/images/projects/dot-net/insurance%20management%20(3).png'
      },
      {
        title: 'Loan Granting System',
        description: 'Manage loan applications, officers, and approvals with reporting.',
        image: '/images/projects/dot-net/loan-granting-system.png'
      },
      {
        title: 'Restaurant Order & Billing',
        description: 'Create order management with kitchen and billing modules.',
        image: '/images/projects/dot-net/Restaurant%20Billiing.png'
      }
    ],
    mentors: [
      {
        name: 'Rahul Patil',
        role: 'DotNet Lead',
        company: 'MNC',
        image: ''
      },
      {
        name: 'Aarti Deshmukh',
        role: 'Full Stack .NET Trainer',
        company: 'Top Tech Firm',
        image: ''
      },
      {
        name: 'Sameer Rao',
        role: 'Senior .NET Dev',
        company: 'Software House',
        image: ''
      }
    ],
    successStories: [
      {
        name: 'Harsh Patil',
        role: '.NET Developer',
        quote: 'The ASP.NET Core and SQL modules made me job ready for enterprise roles.',
        image: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      {
        name: 'Mayur Aware',
        role: 'Backend Developer',
        quote: 'Projects like loan management helped me explain real work in interviews.',
        image: 'https://randomuser.me/api/portraits/men/45.jpg'
      },
      {
        name: 'Priya Wagh',
        role: 'Software Engineer',
        quote: 'Great mentorship and practical training throughout the program.',
        image: 'https://randomuser.me/api/portraits/women/44.jpg'
      }
    ]
  },
  {
    slug: 'business-analyst',
    title: 'Business Analyst Program',
    shortTitle: 'Business Analyst',
    shortDescription: 'Hands-on business analyst program with Excel, SQL, Power BI, and practical case studies.',
    fullDescription: 'The Business Analyst program is a 3-month hands-on journey designed to prepare you for real-world business decision-making. You’ll learn to analyze data, visualize insights, and solve business problems using Excel, SQL, Power BI, and Python. Mode: Online / Offline.',
    duration: '3 Months',
    mode: 'Hybrid',
    price: 45000,
    discountedPrice: 35000,
    highlights: [
      '5 Interview Calls Guarantee',
      'Expert Mentorship (10+ Years Exp)',
      'Daily 2-3 Hours Practical Training',
      'Practical Job-Focused Learning',
      'Project-Oriented Training',
      'Regular Assessments & Mock Interviews'
    ],
    curriculum: [
      {
        module: 'Module 1: Introduction to Business Analysis & SDLC Practices',
        topics: [
          'Role of a Business Analyst in Agile & Digital Era',
          'SDLC Models: Waterfall, V-Model, Agile, Iterative',
          'Agile Fundamentals: Scrum Framework, Scrum Roles, Ceremonies (Stand-ups, Sprint Planning, Review, Retrospective)',
          'Writing User Stories with Acceptance Criteria (INVEST model)',
          'Understanding Product vs Project Mindset',
          'BA vs Business Analytics vs Product Owner',
          'Career paths & value of Business Analysis'
        ]
      },
      {
        module: 'Module 2: Stakeholder Analysis & Collaboration',
        topics: [
          'Internal vs External Stakeholders',
          'Roles: Product Owner, Project Manager, Developers, QA, DevOps, Sponsors, Customers',
          'Stakeholder Conflict Resolution Techniques',
          'Stakeholder Mapping (Power/Interest Grid)',
          'Communication Planning & Engagement Models',
          'Understanding Organizational Structure Impact on BA Work',
          'Day-to-day life of a BA in Agile/Hybrid setups'
        ]
      },
      {
        module: 'Module 3: Requirements Engineering & Documentation',
        topics: [
          'Types of Requirements: Business, User, Functional, Non-functional, Transition',
          'Characteristics of Good Requirements (SMART criteria)',
          'Requirement Lifecycle',
          'Gathering Techniques: Interviews, Workshops, Brainstorming, Observation, Surveys',
          'Preparing BA Documents with Real-time Templates',
          'Requirement Prioritization (MoSCoW, Kano Model)'
        ]
      },
      {
        module: 'Module 4: Business Analysis Techniques & Modelling',
        topics: [
          'Decomposition Analysis, GAP Analysis, Root Cause (Fishbone, 5 Whys)',
          'SWOT, PESTLE, MOST, CATWOE, VPEC-T',
          'Decision Analysis and Cost-Benefit Techniques',
          'UML Modelling: Use Case, Activity Diagram, Sequence Diagram, Class Diagram, ER Diagrams',
          'Wireframes and Prototyping using Balsamiq / Figma',
          'Change Control Process and Requirement Finalization Techniques'
        ]
      },
      {
        module: 'Module 5: Database Concepts & SQL for BA',
        topics: [
          'Introduction to Relational Databases | DBMS vs RDBMS | ER Modelling',
          'SQL Essentials: DDL, DML, DQL, DCL, TCL Commands',
          'Clauses: WHERE, GROUP BY, HAVING, ORDER BY',
          'Joins, Subqueries, Aggregate Functions',
          'Real-world Query Writing & Practice (SSMS / PostgreSQL / MySQL)',
          'Database Normalization & Constraints'
        ]
      },
      {
        module: 'Module 6: Excel for Business Insights',
        topics: [
          'Data Cleaning Techniques (Find & Replace, Text to Columns, Remove Duplicates)',
          'Creating Dashboards using Excel',
          'Advanced Excel Functions: LOOKUPs, IF, COUNTIFS, SUMIFS, TEXT, DATE',
          'Conditional Formatting, Data Validation',
          'Pivot Tables & Charts for Summarization and Reporting',
          'Using Excel for Business Cases and Metrics Tracking'
        ]
      }
    ],
    jobRoles: ['Business Analyst', 'Product Analyst', 'Systems Analyst', 'Functional Consultant'],
    isJobGuarantee: false,
    icon: 'Briefcase',
    color: '#5b4db1',
    pastelColor: '#efe9ff', // Light Violet
    cardImage: '/images/courses/BA.png',
    category: 'Business',
    brochureUrl: '/brochures/business-analyst.pdf',
    tools: [
      'Excel',
      'SQL',
      'Power BI',
      'Python',
      'JIRA',
      'Confluence',
      'Balsamiq/Figma',
      'UML'
    ],
    projects: [
      {
        title: 'Requirement Documentation',
        description: 'Create BRD, FRD, and user stories for a real-world portal.',
        image: '/images/projects/buisness-analyst-program/Requirement%20Documentation.jpeg'
      },
      {
        title: 'Business Process Gap Analysis',
        description: 'Analyze current workflows and design improved process models.',
        image: '/images/projects/buisness-analyst-program/Business%20Process%20Gap%20Analysis.jpeg'
      },
      {
        title: 'KPI & Insights Dashboard',
        description: 'Build a dashboard to track business KPIs and decision metrics.',
        image: '/images/projects/buisness-analyst-program/KPI%20&%20Insights%20Dashboard.jpeg'
      }
    ],
    mentors: [
      {
        name: 'Sagar Kulkarni',
        role: 'Business Analyst Lead',
        company: 'MNC',
        image: ''
      },
      {
        name: 'Poonam Joshi',
        role: 'Product Consultant',
        company: 'Top Tech Firm',
        image: ''
      },
      {
        name: 'Meera Nair',
        role: 'Product Owner',
        company: 'StartUp Hub',
        image: ''
      }
    ],
    successStories: [
      {
        name: 'Harsh Patil',
        role: 'Business Analyst',
        quote: 'Case studies and SQL dashboards helped me crack BA interviews.',
        image: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      {
        name: 'Mayur Aware',
        role: 'Product Analyst',
        quote: 'The BA modules and stakeholder practices were very practical.',
        image: 'https://randomuser.me/api/portraits/men/45.jpg'
      },
      {
        name: 'Priya Wagh',
        role: 'Systems Analyst',
        quote: 'Great training on documentation, user stories, and process modeling.',
        image: 'https://randomuser.me/api/portraits/women/44.jpg'
      }
    ]
  },
  {
    slug: 'data-analytics',
    title: 'Data Analytics Program',
    shortTitle: 'Data Analytics',
    shortDescription: 'Analytics program covering Excel, SQL, Power BI, Tableau, and AI-based analytics tools.',
    fullDescription: 'The Data Analytics Program is a 3-month intensive course crafted to make you an industry-ready analytics expert. You’ll gain hands-on experience with Excel, SQL, Power BI, and Tableau to turn data into powerful business insights and strategic decisions. Mode: Online / Offline.',
    duration: '3 Months',
    mode: 'Hybrid',
    price: 40000,
    discountedPrice: 30000,
    highlights: [
      'Daily 2-3 Hours Practical Training',
      'Project-Oriented Training',
      '5 Interview Calls Guarantee',
      'Regular Assessments & Mock Interviews',
      'Expert Mentorship (10+ Years Exp)',
      'Practical Job-Focused Learning'
    ],
    curriculum: [
      {
        module: 'Module 1: SQL & Database Fundamentals',
        topics: [
          'Need of Database | DBMS Models | Normalization',
          'SQL Constraints',
          'SQL Commands: DML, DDL, DQL, TCL, DCL',
          'Clauses | Functions | Joins',
          'Indexes & Views',
          'PL/SQL Block Structure',
          'Difference between Stored Procedures & Functions',
          'Exercises'
        ]
      },
      {
        module: 'Module 2: Excel for Data Analysis',
        topics: [
          'Master Data Cleaning Techniques',
          'Visualize Data with Excel Charts',
          'Efficient Sub-totaling and Analysis',
          'Advanced Excel Functions',
          'Pivot Tables for Data Summarization',
          'Data Analysis and Visualization'
        ]
      },
      {
        module: 'Module 3: DWH & ETL',
        topics: [
          'Database vs Data Warehouse: Key Differences',
          'Data Warehouse Architecture, Concepts and Components',
          'Types of Schemas (Star, Snowflake)',
          'Data Warehouse vs Data Mart',
          'Data Lake vs Data Warehouse',
          'ETL (Extract, Transform, and Load) Process',
          'What is Business Intelligence? Definition & Example'
        ]
      },
      {
        module: 'Module 4: Tableau & Power BI',
        topics: [
          'Tableau: Introduction, Data Connectors, Data Model',
          'Basic Visualizations | Filters | Groups | Sets',
          'Types of Calculations (Basic, Table, LOD)',
          'Date Functions | Table Calculations: First(), Last(), Index()',
          'Data Blending | Advanced Visualizations (Gantt, Histogram, Donut, Lollipop)',
          'Tableau Dashboards & Projects',
          'Power BI: Difference between Power BI and Tableau',
          'Data Sources | Key Terms | Installation',
          'Filters | DAX Functions | Visualization | Projects'
        ]
      }
    ],
    jobRoles: ['Data Analyst', 'BI Analyst', 'Reporting Analyst', 'MIS Executive'],
    isJobGuarantee: false,
    icon: 'PieChart',
    color: '#0f9d82',
    cardImage: '/images/courses/BAP.png',
    category: 'Data & AI',
    brochureUrl: '/brochures/data-analytics.pdf',
    tools: [
      'Advanced Excel',
      'SQL',
      'Power BI',
      'Tableau',
      'DWH/ETL'
    ],
    projects: [
      {
        title: 'Retail Sales Optimization',
        description: 'Analyze sales trends and restock cycles to reduce inventory waste.',
        image: '/images/projects/data-analytics-program/Retail%20Sales%20Optimization.jpg'
      },
      {
        title: 'Customer Preference Dashboard',
        description: 'Build dashboards that highlight customer behavior and category performance.',
        image: '/images/projects/data-analytics-program/Customer%20Preference%20Dashboard.png'
      },
      {
        title: 'Budgeting & Forecasting Report',
        description: 'Create executive reports for budgeting, forecasting, and KPI tracking.',
        image: '/images/projects/data-analytics-program/Budgeting%20&%20Forecasting%20Report.jpeg'
      }
    ],
    mentors: [
      {
        name: 'Swapnil More',
        role: 'Data Analytics Trainer',
        company: 'MNC',
        image: ''
      },
      {
        name: 'Sneha Kulkarni',
        role: 'BI Specialist',
        company: 'Top Tech Firm',
        image: ''
      },
      {
        name: 'Arjun Kapoor',
        role: 'Data Viz Expert',
        company: 'Insight Corp',
        image: ''
      }
    ],
    successStories: [
      {
        name: 'Harsh Patil',
        role: 'MIS Executive',
        quote: 'Dashboards and Excel modules helped me move into analytics quickly.',
        image: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      {
        name: 'Mayur Aware',
        role: 'Reporting Analyst',
        quote: 'The SQL and Power BI focus was exactly what the industry needs.',
        image: 'https://randomuser.me/api/portraits/men/45.jpg'
      },
      {
        name: 'Priya Wagh',
        role: 'BI Analyst',
        quote: 'Great hands-on training with real business cases and dashboards.',
        image: 'https://randomuser.me/api/portraits/women/44.jpg'
      }
    ]
  },
  {
    slug: 'software-testing',
    title: 'Software Testing Program',
    shortTitle: 'Software Testing',
    shortDescription: 'AI-integrated QA program covering manual testing, Selenium, API testing, and automation frameworks.',
    fullDescription: 'The Software Testing with AI Program is a complete 6-month hands-on journey designed to make you an industry-ready QA professional. You’ll master manual and automation testing, Selenium, API testing, and AI-based tools that make testing faster and more reliable. Mode: Online / Offline.',
    duration: '6 Months',
    mode: 'Hybrid',
    price: 50000,
    discountedPrice: 38000,
    highlights: [
      '100% Placement Guarantee',
      'Post-Placement Support',
      'Expert Mentorship (10+ Years Exp)',
      'Daily 5-6 Hours Practical Training',
      'Refund Guarantee',
      'Lifetime Career Assistance',
      'Project-Oriented, AI-Integrated Training',
      'Regular Assessments & Mock Interviews'
    ],
    curriculum: [
      {
        module: 'MODULE 1: IT Basics, Manual Testing, Agile & SQL',
        topics: [
          'IT Basics: SDLC, Types of SDLC Models (Waterfall, Spiral, Prototype, V-Model, Hybrid)',
          'Java Basics: Data Types, Variables, Strings, Operators, OOPs (Class, Object, Inheritance, Polymorphism, Abstraction, Encapsulation), String Class, Collection Framework, Exception Handling, Multithreading',
          'Manual Testing: Types of Testing, Types of Requirements, Test Cases & Scenarios, Test Case Design Techniques, STLC, Test Management Tool, Test Plan, Defect Tracking, Bugzilla, ISTQB Foundation, Mobile Application Testing',
          'Agile & Scrum: User Stories, Story Points, Planning Poker, Product Backlog, Sprint Backlog, Scrum Team, Stand-up Meetings, Sprint Planning, Burndown & Burn-up Charts, Kanban',
          'SQL: Syntax, Datatypes, Operators, DDL, DML, DCL, Constraints, Functions',
          'Soft Skills: Communication, Group Discussion, Writing Skills, Interview Skills, Resume Writing'
        ]
      },
      {
        module: 'MODULE 2: Selenium Automation',
        topics: [
          'What is Automation? | Tools in Market | When to Automate',
          'Selenium WebDriver Architecture | Configuring Selenium in Eclipse',
          'HTML Tags & Attributes | Different Types of Locators',
          'Automating UI Elements: Button, Link, Text Field, Radio Button, Checkbox, Dropdown, Searchbox',
          'Browser Launching, Navigation, Close vs Quit',
          'Synchronization, Multiple Windows, Screenshots, File Upload, Robot Class, Clipboard',
          'Automating Select Boxes using Select Class',
          'Data-Driven Testing with Apache POI (Excel)',
          'JUnit: Annotations, Checkpoints, Parameterizing, Build.xml, HTML Reports',
          'TestNG: Annotations, Checkpoints, XML Config, Data Provider, Parameterizing, Listeners, Parallel Execution, Include/Exclude',
          'Selenium Grid | AutoIT | Log4j | Maven (POM.xml, Integration with TestNG)',
          'Aptitude: Number System, Percentages, Profit & Loss, Time & Work, Speed & Distance, Permutation & Combination, Probability, Number Series, Coding-Decoding, Directions, Blood Relations, Puzzles'
        ]
      },
      {
        module: 'MODULE 3: Jenkins & Project Execution',
        topics: [
          'Jenkins: Installation, Configuration, Workspace Setup',
          'TestNG Reporting Plugin | POM.xml Integration',
          'Project Execution: Test Plan, Requirement Analysis, Identifying Scenarios',
          'Writing, Reviewing & Executing Test Cases in Quality Centre',
          'Defect Reporting in Bugzilla',
          'Smoke Testing | Functional, Integration & System Testing',
          'Adhoc, Exploratory & Security Testing',
          'Preparing STCM & Traceability Matrix',
          'Monthly Status Reports | Backend Validation with SQL',
          'Daily Stand-up Meetings | Analyzing Burndown Charts'
        ]
      },
      {
        module: 'MODULE 4: API & Performance Testing',
        topics: [
          'Postman: Collections, Variables, Assertions, Automation',
          'REST Assured: Serialization, Validation, API Frameworks',
          'JMeter: Thread Groups, Samplers, Listeners, Load Testing',
          'LoadRunner: Performance Testing Basics'
        ]
      },
      {
        module: 'MODULE 5: Capstone Projects',
        topics: [
          'Student Management System – End-to-End Testing',
          'Product Inventory Management System – Automation & Reporting'
        ]
      }
    ],
    jobRoles: ['QA Engineer', 'Test Automation Engineer', 'SDET', 'QA Analyst'],
    isJobGuarantee: true,
    icon: 'TestTube2',
    color: '#5a2d82',
    cardImage: '/images/courses/ST.png',
    category: 'Testing',
    brochureUrl: '/brochures/software-testing.pdf',
    tools: [
      'Selenium',
      'Postman',
      'REST Assured',
      'JMeter',
      'TestNG',
      'JUnit',
      'Jenkins',
      'Maven',
      'Bugzilla'
    ],
    projects: [
      {
        title: 'Student Management Testing Suite',
        description: 'Create test plans, cases, and automation scripts for a student system.',
        image: '/images/projects/software-testing/Student%20Management%20Testing%20Suite.png'
      },
      {
        title: 'Product Inventory Testing',
        description: 'Automate UI and API tests for inventory workflows and reporting.',
        image: '/images/projects/software-testing/Gemini_Generated_Image_3exdnb3exdnb3exd.png'
      },
      {
        title: 'API Automation Suite',
        description: 'Build Postman and REST Assured suites with reports and CI integration.',
        image: '/images/projects/software-testing/API%20Automation%20Suite.png'
      }
    ],
    mentors: [
      {
        name: 'Vikas Patil',
        role: 'QA Lead',
        company: 'MNC',
        image: ''
      },
      {
        name: 'Neha Sawant',
        role: 'Automation Trainer',
        company: 'Top Tech Firm',
        image: ''
      },
      {
        name: 'Kavita Singh',
        role: 'QA Manager',
        company: 'Quality First',
        image: ''
      }
    ],
    successStories: [
      {
        name: 'Harsh Patil',
        role: 'QA Engineer',
        quote: 'Strong focus on Selenium and API testing helped me get placed.',
        image: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      {
        name: 'Mayur Aware',
        role: 'SDET',
        quote: 'The framework development module was the best part of the course.',
        image: 'https://randomuser.me/api/portraits/men/45.jpg'
      },
      {
        name: 'Priya Wagh',
        role: 'Test Automation Engineer',
        quote: 'Great mix of manual, automation, and CI practices.',
        image: 'https://randomuser.me/api/portraits/women/44.jpg'
      }
    ]
  },
  {
    slug: 'hr-generalist',
    title: 'HR Generalist Program',
    shortTitle: 'HR Generalist',
    shortDescription: 'HR Generalist program covering recruitment, payroll, compliance, and HR operations.',
    fullDescription: 'The HR Generalist Program is a 3-month comprehensive journey designed to make you an industry-ready HR professional. You’ll gain hands-on expertise in recruitment, payroll management, compliance, performance evaluation, and HR operations. Mode: Online / Offline.',
    duration: '3 Months',
    mode: 'Hybrid',
    price: 35000,
    discountedPrice: 28000,
    highlights: [
      '5 Interview Calls Guarantee',
      'Expert Mentorship (10+ Years Exp)',
      'Daily 2-3 Hours Practical Training',
      'Practical Job-Focused Learning',
      'Project-Oriented Training',
      'Regular Assessments & Mock Interviews'
    ],
    curriculum: [
      { module: 'Module 01: Recruitment & Selection Mastery', topics: ['Talent Acquisition & Selection', 'Effective Onboarding Strategies', 'Competency Based Interviewing', 'Portal Training (Naukri, LinkedIn, Monster)', 'Psychometric Testing Foundations'] },
      { module: 'Module 02: Payroll & Statutory Compliance', topics: ['Practical Payroll Input & Processing', 'Statutory Compliance & Labour Laws', 'Taxation for HR Professionals', 'Practical Advanced Excel for Payroll', 'HR System Training'] },
      { module: 'Module 03: HR Operations & Strategic Management', topics: ['HR Policies & Strategic HRM', 'Performance Management Systems', 'HR Business Partner (HRBP) Core', 'Basics of HR Analytics', 'Training & Development Frameworks'] },
      { module: 'Module 04: HR Analytics - Practitioner Level', topics: ['Key HR Metrics & Statistical Modelling', 'Data Discovery & Preparation', 'Business Problem Discovery', '25+ HR Case Studies & 2 Live Projects', 'Insightful Reporting & Presenting'] },
      { module: 'Module 05: Soft Skills & Professional Development', topics: ['Public Speaking & Effective Communication', 'LinkedIn & Portals (Naukri, Zoom Info)', 'PPT Mastery & Business Etiquette', 'Mock Interviews & Confidence Boost Up', 'Professional Resume & Mail Writing'] }
    ],
    jobRoles: ['HR Generalist', 'HR Executive', 'Recruitment Specialist', 'HR Coordinator'],
    isJobGuarantee: false,
    icon: 'Users',
    color: '#3b9995',
    cardImage: '/images/courses/HR.png',
    category: 'Business',
    brochureUrl: '/brochures/hr-generalist.pdf',
    tools: [
      'Advanced Excel',
      'LinkedIn Recruiter',
      'Naukri Portal',
      'Monster Portal',
      'HR Analytics Tools',
      'Payroll Systems',
      'ATS Tools',
      'Zoom Info'
    ],
    projects: [
      {
        title: 'Recruitment Pipeline Tracker',
        description: 'Track hiring stages, sourcing channels, and onboarding metrics.',
        image: '/images/projects/hr-generalist/Recruitment pipeline tracker.png'
      },
      {
        title: 'Payroll & Compliance Dashboard',
        description: 'Create a dashboard for payroll inputs, compliance, and statutory reports.',
        image: '/images/projects/hr-generalist/ChatGPT Image Feb 17, 2026, 05_37_12 PM.png'
      },
      {
        title: 'HR Analytics Case Study',
        description: 'Analyze HR metrics and present insights with charts and reports.',
        image: '/images/projects/hr-generalist/HR Analyst case study.png'
      }
    ],
    mentors: [
      {
        name: 'Manish Jadhav',
        role: 'HR Manager',
        company: 'MNC',
        image: ''
      },
      {
        name: 'Priya Kulkarni',
        role: 'Payroll & Compliance Trainer',
        company: 'Top Tech Firm',
        image: ''
      },
      {
        name: 'Anjali Mehta',
        role: 'HR Director',
        company: 'People First',
        image: ''
      }
    ],
    successStories: [
      {
        name: 'Harsh Patil',
        role: 'HR Executive',
        quote: 'Practical HR analytics and payroll modules helped me start my HR career.',
        image: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      {
        name: 'Mayur Aware',
        role: 'Recruitment Specialist',
        quote: 'Great focus on real recruitment workflows and compliance processes.',
        image: 'https://randomuser.me/api/portraits/men/45.jpg'
      },
      {
        name: 'Priya Wagh',
        role: 'HR Coordinator',
        quote: 'Clear guidance on HR operations and strong interview preparation.',
        image: 'https://randomuser.me/api/portraits/women/44.jpg'
      }
    ]
  }
];

export const getCourseBySlug = (slug: string): Course | undefined => {
  return courses.find(course => course.slug === slug);
};

export const getCoursesByCategory = (category: string): Course[] => {
  return courses.filter(course => course.category === category);
};

export const categories = ['All', 'Data & AI', 'Development', 'Security', 'Testing', 'Business'];
