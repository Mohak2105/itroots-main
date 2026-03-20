// ITROOTS Testimonials Data

export interface Testimonial {
    id: number;
    name: string;
    role: string;
    company: string;
    companyLogo?: string;
    image: string;
    course: string;
    testimonial: string;
    rating: number;
    salary?: string;
}

export const testimonials: Testimonial[] = [
    {
        id: 1,
        name: 'Priya Patil',
        role: 'Data Scientist',
        company: 'TCS',
        image: '',
        course: 'Data Science with AI',
        testimonial: 'ITROOTS transformed my career completely. The hands-on projects and industry mentors helped me land my dream job at TCS. The curriculum is perfectly aligned with industry needs.',
        rating: 5,
        salary: '12 LPA'
    },
    {
        id: 2,
        name: 'Rahul Deshmukh',
        role: 'Full Stack Developer',
        company: 'Infosys',
        image: '',
        course: 'Full Stack Java',
        testimonial: 'The Java program was exactly what I needed. From core concepts to Spring Boot microservices, everything was covered thoroughly. Got placed within 2 months of completion!',
        rating: 5,
        salary: '8.5 LPA'
    },
    {
        id: 3,
        name: 'Sneha Sawant',
        role: 'Security Analyst',
        company: 'Wipro',
        image: '',
        course: 'Cyber Security',
        testimonial: 'The job guarantee program delivered on its promise! The live hacking labs and SOC training prepared me for real-world scenarios. Highly recommended for aspiring security professionals.',
        rating: 5,
        salary: '10 LPA'
    },
    {
        id: 4,
        name: 'Amit Gaikwad',
        role: 'Data Analyst',
        company: 'Accenture',
        image: '',
        course: 'Data Analytics Python',
        testimonial: 'Coming from a non-tech background, I was skeptical. But the structured curriculum and patient mentors made learning Python and analytics enjoyable. Now working at Accenture!',
        rating: 5,
        salary: '7 LPA'
    },
    {
        id: 5,
        name: 'Kavita Kadam',
        role: 'QA Lead',
        company: 'Cognizant',
        image: '',
        course: 'Software Testing',
        testimonial: 'The testing program covered everything from manual testing to Selenium automation. The framework development module was particularly helpful. Got promoted to QA Lead within a year!',
        rating: 5,
        salary: '9 LPA'
    },
    {
        id: 6,
        name: 'Vikram Shinde',
        role: 'Business Analyst',
        company: 'Deloitte',
        image: '',
        course: 'Business Analyst',
        testimonial: 'The BA program gave me a complete understanding of requirements engineering and agile methodologies. The case studies were extremely practical and helped in interviews.',
        rating: 5,
        salary: '11 LPA'
    }
];

export const stats = {
    studentsPlaced: 5000,
    hiringPartners: 150,
    placementRate: 95,
    averageSalaryHike: 120,
    coursesOffered: 10,
    trainersExperience: 15
};
