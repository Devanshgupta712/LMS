import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create Super Admin
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@apptechcareers.com' },
        update: {},
        create: {
            email: 'admin@apptechcareers.com',
            password: hashedPassword,
            name: 'Super Admin',
            phone: '+91-9999999999',
            role: 'SUPER_ADMIN',
        },
    });
    console.log('✅ Super Admin created:', superAdmin.email);

    // Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'manager@apptechcareers.com' },
        update: {},
        create: {
            email: 'manager@apptechcareers.com',
            password: hashedPassword,
            name: 'Priya Sharma',
            phone: '+91-9888888888',
            role: 'ADMIN',
        },
    });
    console.log('✅ Admin created:', admin.email);

    // Create Trainer
    const trainer = await prisma.user.upsert({
        where: { email: 'trainer@apptechcareers.com' },
        update: {},
        create: {
            email: 'trainer@apptechcareers.com',
            password: hashedPassword,
            name: 'Rajesh Kumar',
            phone: '+91-9777777777',
            role: 'TRAINER',
        },
    });
    console.log('✅ Trainer created:', trainer.email);

    // Create Marketer
    const marketer = await prisma.user.upsert({
        where: { email: 'marketing@apptechcareers.com' },
        update: {},
        create: {
            email: 'marketing@apptechcareers.com',
            password: hashedPassword,
            name: 'Anita Desai',
            phone: '+91-9666666666',
            role: 'MARKETER',
        },
    });
    console.log('✅ Marketer created:', marketer.email);

    // Create Students
    const students = [];
    const studentData = [
        { name: 'Arjun Patel', email: 'arjun@student.com', studentId: 'APC-2026-0001' },
        { name: 'Sneha Reddy', email: 'sneha@student.com', studentId: 'APC-2026-0002' },
        { name: 'Vikram Singh', email: 'vikram@student.com', studentId: 'APC-2026-0003' },
        { name: 'Meera Nair', email: 'meera@student.com', studentId: 'APC-2026-0004' },
        { name: 'Karthik Iyer', email: 'karthik@student.com', studentId: 'APC-2026-0005' },
    ];

    for (const s of studentData) {
        const student = await prisma.user.upsert({
            where: { email: s.email },
            update: {},
            create: {
                email: s.email,
                password: hashedPassword,
                name: s.name,
                role: 'STUDENT',
                studentId: s.studentId,
            },
        });
        students.push(student);
        console.log('✅ Student created:', student.email, `(${s.studentId})`);
    }

    // Create Courses
    const course1 = await prisma.course.create({
        data: {
            name: 'Full Stack Web Development',
            description: 'Complete MERN stack development with React, Node.js, Express, and MongoDB. Includes project work and deployment.',
            duration: '6 months',
            fee: 45000,
        },
    });

    const course2 = await prisma.course.create({
        data: {
            name: 'Python & Data Science',
            description: 'Python programming, data analysis with Pandas, machine learning with scikit-learn, and deep learning basics.',
            duration: '4 months',
            fee: 35000,
        },
    });

    const course3 = await prisma.course.create({
        data: {
            name: 'Java Full Stack',
            description: 'Java, Spring Boot, Hibernate, Microservices, Angular/React frontend development.',
            duration: '5 months',
            fee: 40000,
        },
    });
    console.log('✅ Courses created');

    // Create Batches
    const batch1 = await prisma.batch.create({
        data: {
            courseId: course1.id,
            name: 'FSWD Batch 2026-A',
            startDate: new Date('2026-01-15'),
            endDate: new Date('2026-07-15'),
            trainerId: trainer.id,
        },
    });

    const batch2 = await prisma.batch.create({
        data: {
            courseId: course2.id,
            name: 'DS Batch 2026-A',
            startDate: new Date('2026-02-01'),
            endDate: new Date('2026-06-01'),
            trainerId: trainer.id,
        },
    });
    console.log('✅ Batches created');

    // Map students to batches
    await prisma.batchStudent.createMany({
        data: [
            { batchId: batch1.id, studentId: students[0].id },
            { batchId: batch1.id, studentId: students[1].id },
            { batchId: batch1.id, studentId: students[2].id },
            { batchId: batch2.id, studentId: students[3].id },
            { batchId: batch2.id, studentId: students[4].id },
        ],
    });
    console.log('✅ Students mapped to batches');

    // Create sample leads
    await prisma.lead.createMany({
        data: [
            { name: 'Rahul Gupta', email: 'rahul@example.com', phone: '+91-9111111111', source: 'Website', status: 'NEW', assignedToId: marketer.id },
            { name: 'Pooja Mehta', email: 'pooja@example.com', phone: '+91-9222222222', source: 'WhatsApp', status: 'CONTACTED', assignedToId: marketer.id },
            { name: 'Amit Shah', email: 'amit@example.com', phone: '+91-9333333333', source: 'Reference', status: 'INTERESTED', assignedToId: marketer.id },
            { name: 'Divya Joshi', email: 'divya@example.com', phone: '+91-9444444444', source: 'Social Media', status: 'CONVERTED', assignedToId: marketer.id },
            { name: 'Ravi Kumar', email: 'ravi@example.com', phone: '+91-9555555555', source: 'Walk-in', status: 'NEW', assignedToId: marketer.id },
        ],
    });
    console.log('✅ Sample leads created');

    // Create registrations
    await prisma.registration.createMany({
        data: [
            { studentId: students[0].id, courseId: course1.id, batchId: batch1.id, feeAmount: 45000, feePaid: 45000, status: 'CONFIRMED' },
            { studentId: students[1].id, courseId: course1.id, batchId: batch1.id, feeAmount: 45000, feePaid: 30000, status: 'CONFIRMED' },
            { studentId: students[2].id, courseId: course1.id, batchId: batch1.id, feeAmount: 45000, feePaid: 45000, status: 'CONFIRMED' },
            { studentId: students[3].id, courseId: course2.id, batchId: batch2.id, feeAmount: 35000, feePaid: 35000, status: 'CONFIRMED' },
            { studentId: students[4].id, courseId: course2.id, batchId: batch2.id, feeAmount: 35000, feePaid: 20000, status: 'CONFIRMED' },
        ],
    });
    console.log('✅ Registrations created');

    console.log('\n🎉 Seeding complete!');
    console.log('\n📋 Login credentials (all passwords: admin123):');
    console.log('   Super Admin: admin@apptechcareers.com');
    console.log('   Admin:       manager@apptechcareers.com');
    console.log('   Trainer:     trainer@apptechcareers.com');
    console.log('   Marketer:    marketing@apptechcareers.com');
    console.log('   Student:     arjun@student.com');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
