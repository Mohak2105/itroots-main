// ITROOTS Hiring Partners Data

export interface Company {
    id: number;
    name: string;
    logo: string;
    tier: 'platinum' | 'gold' | 'silver';
}

export const companies: Company[] = [
    { id: 1, name: 'TCS', logo: '/images/companies/tcs.png', tier: 'platinum' },
    { id: 2, name: 'Infosys', logo: '/images/companies/infosys.png', tier: 'platinum' },
    { id: 3, name: 'Wipro', logo: '/images/companies/wipro.png', tier: 'platinum' },
    { id: 4, name: 'Accenture', logo: '/images/companies/accenture.png', tier: 'platinum' },
    { id: 5, name: 'Cognizant', logo: '/images/companies/cognizant.png', tier: 'platinum' },
    { id: 6, name: 'Capgemini', logo: '/images/companies/capgemini.png', tier: 'gold' },
    { id: 7, name: 'Tech Mahindra', logo: '/images/companies/tech-mahindra.png', tier: 'gold' },
    { id: 8, name: 'HCL', logo: '/images/companies/hcl.png', tier: 'gold' },
    { id: 9, name: 'Deloitte', logo: '/images/companies/deloitte.png', tier: 'platinum' },
    { id: 10, name: 'IBM', logo: '/images/companies/ibm.png', tier: 'platinum' },
    { id: 11, name: 'Microsoft', logo: '/images/companies/microsoft.png', tier: 'platinum' },
    { id: 12, name: 'Amazon', logo: '/images/companies/amazon.png', tier: 'platinum' },
    { id: 13, name: 'Google', logo: '/images/companies/google.png', tier: 'platinum' },
    { id: 14, name: 'Oracle', logo: '/images/companies/oracle.png', tier: 'gold' },
    { id: 15, name: 'SAP', logo: '/images/companies/sap.png', tier: 'gold' },
    { id: 16, name: 'Mindtree', logo: '/images/companies/mindtree.png', tier: 'silver' },
    { id: 17, name: 'Mphasis', logo: '/images/companies/mphasis.png', tier: 'silver' },
    { id: 18, name: 'L&T Infotech', logo: '/images/companies/lti.png', tier: 'silver' },
    { id: 19, name: 'Hexaware', logo: '/images/companies/hexaware.png', tier: 'silver' },
    { id: 20, name: 'Persistent', logo: '/images/companies/persistent.png', tier: 'silver' }
];

export const companyStats = {
    totalPartners: 150,
    platinumPartners: 12,
    goldPartners: 25,
    silverPartners: 113
};
