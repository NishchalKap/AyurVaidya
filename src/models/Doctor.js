/**
 * Doctor Model & Data
 * Serves the frontend doctor discovery features
 */

const DOCTORS = [
    {
        id: 'ananya',
        name: 'Dr. Ananya Sharma',
        initials: 'AS',
        specialty: 'Cardiologist',
        qualifications: 'MBBS, MD (Cardiology) - AIIMS Delhi',
        location: 'Delhi, India',
        rating: 4.9,
        reviews: 128,
        consultations: 500,
        experience: 12,
        patients: 500,
        about: 'Dr. Ananya Sharma is a highly experienced cardiologist specializing in preventive cardiology, heart failure management, and interventional procedures.',
        price: 500,
        availability: ['10:00 AM', '11:00 AM', '2:00 PM', '4:00 PM']
    },
    {
        id: 'priya',
        name: 'Dr. Priya Shastri',
        initials: 'PS',
        specialty: 'Panchakarma Expert',
        qualifications: 'BAMS, Panchakarma Specialist - Kerala Ayurveda',
        location: 'Mumbai, India',
        rating: 4.8,
        reviews: 1200,
        consultations: 1000,
        experience: 15,
        patients: 1200,
        about: 'Dr. Priya Shastri is a renowned Ayurveda expert specializing in Panchakarma therapies and stress management.',
        price: 300,
        availability: ['09:00 AM', '10:30 AM', '3:00 PM', '5:00 PM']
    },
    {
        id: 'narayan',
        name: 'Vaidya Narayan Joshi',
        initials: 'VN',
        specialty: 'Ayurveda Specialist',
        qualifications: 'BAMS, MD (Ayurveda) - BHU Varanasi',
        location: 'Varanasi, India',
        rating: 4.9,
        reviews: 2000,
        consultations: 2500,
        experience: 25,
        patients: 2000,
        about: 'Vaidya Narayan Joshi is a senior Ayurveda practitioner with 25 years of expertise in Kayachikitsa (Internal Medicine).',
        price: 350,
        availability: ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM']
    },
    {
        id: 'rohan',
        name: 'Dr. Rohan Mehta',
        initials: 'RM',
        specialty: 'Dermatologist',
        qualifications: 'MBBS, MD (Dermatology) - KMC Mumbai',
        location: 'Mumbai, India',
        rating: 4.8,
        reviews: 350,
        consultations: 400,
        experience: 8,
        patients: 350,
        about: 'Dr. Rohan Mehta specializes in clinical dermatology and cosmetic procedures.',
        price: 400,
        availability: ['11:00 AM', '01:00 PM', '03:00 PM']
    },
    {
        id: 'kavita',
        name: 'Dr. Kavita Iyer',
        initials: 'KI',
        specialty: 'General Physician',
        qualifications: 'MBBS, DNB (Family Medicine)',
        location: 'Chennai, India',
        rating: 4.7,
        reviews: 800,
        consultations: 950,
        experience: 10,
        patients: 800,
        about: 'Dr. Kavita Iyer provides comprehensive primary care for families.',
        price: 300,
        availability: ['09:00 AM', '12:00 PM', '04:00 PM', '06:00 PM']
    }
];

export function getAllDoctors() {
    return DOCTORS;
}

export function getDoctorById(id) {
    return DOCTORS.find(d => d.id === id);
}
