const mongoose = require('mongoose');
const dotenv = require('dotenv');
const UpscResource = require('../models/UpscResource');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const upscTemplateBooks = [
  // History Books
  {
    category: 'Book',
    subject: 'History',
    title: 'Ancient India',
    author: 'R.S. Sharma',
    publisher: 'Orient BlackSwan',
    chapters: [
      { name: 'Introduction to Ancient Indian History', pageRange: '1-15', order: 1 },
      { name: 'The Harappan Civilization', pageRange: '16-45', order: 2 },
      { name: 'The Vedic Age', pageRange: '46-80', order: 3 },
      { name: 'Religious Movements - Buddhism and Jainism', pageRange: '81-120', order: 4 },
      { name: 'The Mauryan Empire', pageRange: '121-160', order: 5 },
      { name: 'Post-Mauryan Developments', pageRange: '161-200', order: 6 },
      { name: 'The Gupta Age', pageRange: '201-240', order: 7 },
      { name: 'Regional Dynasties', pageRange: '241-280', order: 8 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['Ancient History', 'Core Book'],
    description: 'Comprehensive coverage of Ancient Indian History for UPSC preparation',
    totalPages: 280,
    estimatedHours: 45,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },
  {
    category: 'Book',
    subject: 'History',
    title: 'Medieval India',
    author: 'Satish Chandra',
    publisher: 'Orient BlackSwan',
    chapters: [
      { name: 'The Delhi Sultanate', pageRange: '1-50', order: 1 },
      { name: 'The Mughal Empire - Foundation', pageRange: '51-100', order: 2 },
      { name: 'Akbar and His Policies', pageRange: '101-150', order: 3 },
      { name: 'Later Mughals', pageRange: '151-200', order: 4 },
      { name: 'Regional Powers', pageRange: '201-250', order: 5 },
      { name: 'Socio-Economic Conditions', pageRange: '251-300', order: 6 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['Medieval History', 'Core Book'],
    description: 'Standard text for Medieval Indian History',
    totalPages: 300,
    estimatedHours: 40,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },
  {
    category: 'Book',
    subject: 'History',
    title: 'Modern India',
    author: 'Bipin Chandra',
    publisher: 'NCERT',
    chapters: [
      { name: 'The Advent of Europeans', pageRange: '1-30', order: 1 },
      { name: 'British Colonial Policy', pageRange: '31-60', order: 2 },
      { name: 'Resistance to Colonial Rule', pageRange: '61-90', order: 3 },
      { name: 'Social and Religious Reform', pageRange: '91-120', order: 4 },
      { name: 'Rise of Nationalism', pageRange: '121-150', order: 5 },
      { name: 'Gandhi and Mass Movement', pageRange: '151-200', order: 6 },
      { name: 'Towards Independence', pageRange: '201-250', order: 7 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['Modern History', 'Freedom Struggle'],
    description: 'Essential for Modern Indian History and Freedom Struggle',
    totalPages: 250,
    estimatedHours: 35,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },

  // Geography Books
  {
    category: 'Book',
    subject: 'Geography',
    title: 'Certificate Physical and Human Geography',
    author: 'G.C. Leong',
    publisher: 'Oxford University Press',
    chapters: [
      { name: 'The Earth and the Universe', pageRange: '1-25', order: 1 },
      { name: 'Landforms', pageRange: '26-60', order: 2 },
      { name: 'Climate', pageRange: '61-100', order: 3 },
      { name: 'Natural Vegetation', pageRange: '101-130', order: 4 },
      { name: 'Population Geography', pageRange: '131-160', order: 5 },
      { name: 'Settlement Geography', pageRange: '161-190', order: 6 },
      { name: 'Economic Geography', pageRange: '191-220', order: 7 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['Physical Geography', 'Human Geography'],
    description: 'Comprehensive coverage of both Physical and Human Geography',
    totalPages: 220,
    estimatedHours: 50,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },
  {
    category: 'Book',
    subject: 'Geography',
    title: 'Geography of India',
    author: 'Majid Husain',
    publisher: 'McGraw Hill',
    chapters: [
      { name: 'Location and Physiography', pageRange: '1-30', order: 1 },
      { name: 'Climate of India', pageRange: '31-70', order: 2 },
      { name: 'Natural Vegetation and Wildlife', pageRange: '71-100', order: 3 },
      { name: 'Soils of India', pageRange: '101-120', order: 4 },
      { name: 'Water Resources', pageRange: '121-150', order: 5 },
      { name: 'Mineral Resources', pageRange: '151-180', order: 6 },
      { name: 'Industries', pageRange: '181-220', order: 7 },
      { name: 'Transport and Communication', pageRange: '221-250', order: 8 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['India Geography', 'Economic Geography'],
    description: 'Detailed coverage of Indian Geography',
    totalPages: 250,
    estimatedHours: 40,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },

  // Polity Books
  {
    category: 'Book',
    subject: 'Polity',
    title: 'Indian Polity',
    author: 'M. Laxmikanth',
    publisher: 'McGraw Hill',
    chapters: [
      { name: 'Constitutional Development', pageRange: '1-40', order: 1 },
      { name: 'Salient Features of Constitution', pageRange: '41-60', order: 2 },
      { name: 'Fundamental Rights', pageRange: '61-90', order: 3 },
      { name: 'Directive Principles', pageRange: '91-110', order: 4 },
      { name: 'Fundamental Duties', pageRange: '111-120', order: 5 },
      { name: 'President and Vice-President', pageRange: '121-150', order: 6 },
      { name: 'Prime Minister and Council of Ministers', pageRange: '151-180', order: 7 },
      { name: 'Parliament', pageRange: '181-220', order: 8 },
      { name: 'Supreme Court', pageRange: '221-250', order: 9 },
      { name: 'Election Commission', pageRange: '251-270', order: 10 },
      { name: 'Centre-State Relations', pageRange: '271-300', order: 11 },
      { name: 'Local ', pageRange: '301-330', order: 12 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['Constitution', ''],
    description: 'Most comprehensive book for Indian Polity and Constitution',
    totalPages: 330,
    estimatedHours: 60,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },

  // Economy Books
  {
    category: 'Book',
    subject: 'Economy',
    title: 'Indian Economy',
    author: 'Ramesh Singh',
    publisher: 'McGraw Hill',
    chapters: [
      { name: 'Introduction to Indian Economy', pageRange: '1-30', order: 1 },
      { name: 'National Income', pageRange: '31-60', order: 2 },
      { name: 'Economic Growth and Development', pageRange: '61-90', order: 3 },
      { name: 'Planning in India', pageRange: '91-120', order: 4 },
      { name: 'Agriculture', pageRange: '121-160', order: 5 },
      { name: 'Industry', pageRange: '161-200', order: 6 },
      { name: 'Services Sector', pageRange: '201-230', order: 7 },
      { name: 'Money and Banking', pageRange: '231-270', order: 8 },
      { name: 'Public Finance', pageRange: '271-310', order: 9 },
      { name: 'International Trade', pageRange: '311-350', order: 10 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['Indian Economy', 'Development'],
    description: 'Comprehensive coverage of Indian Economy',
    totalPages: 350,
    estimatedHours: 65,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },

  // Environment Books
  {
    category: 'Book',
    subject: 'Environment',
    title: 'Environment',
    author: 'Shankar IAS Academy',
    publisher: 'Shankar IAS Academy',
    chapters: [
      { name: 'Fundamentals of Environment', pageRange: '1-25', order: 1 },
      { name: 'Ecosystem', pageRange: '26-50', order: 2 },
      { name: 'Biodiversity', pageRange: '51-80', order: 3 },
      { name: 'Environmental Pollution', pageRange: '81-120', order: 4 },
      { name: 'Climate Change', pageRange: '121-150', order: 5 },
      { name: 'Environmental Conservation', pageRange: '151-180', order: 6 },
      { name: 'Environmental Laws and Policies', pageRange: '181-200', order: 7 },
    ],
    priority: 'Recommended',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['Environment', 'Ecology', 'Climate Change'],
    description: 'Focused content for Environment and Ecology',
    totalPages: 200,
    estimatedHours: 30,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },

  // Science & Technology
  {
    category: 'Book',
    subject: 'Science & Technology',
    title: 'Science & Technology',
    author: 'Ravi P. Agrahari',
    publisher: 'McGraw Hill',
    chapters: [
      { name: 'Physics in Everyday Life', pageRange: '1-40', order: 1 },
      { name: 'Chemistry and Its Applications', pageRange: '41-80', order: 2 },
      { name: 'Biology and Human Health', pageRange: '81-120', order: 3 },
      { name: 'Space Technology', pageRange: '121-150', order: 4 },
      { name: 'Nuclear Technology', pageRange: '151-180', order: 5 },
      { name: 'Information Technology', pageRange: '181-220', order: 6 },
      { name: 'Biotechnology', pageRange: '221-250', order: 7 },
    ],
    priority: 'Recommended',
    examRelevance: ['Prelims'],
    tags: ['Science', 'Technology', 'Innovation'],
    description: 'Comprehensive coverage of Science and Technology topics',
    totalPages: 250,
    estimatedHours: 35,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },

  // NCERT Books
  {
    category: 'NCERT',
    subject: 'History',
    title: 'India and the Contemporary World - I',
    author: 'NCERT',
    publisher: 'NCERT',
    chapters: [
      { name: 'The French Revolution', pageRange: '1-25', order: 1 },
      { name: 'Socialism in Europe and the Russian Revolution', pageRange: '26-50', order: 2 },
      { name: 'Nazism and the Rise of Hitler', pageRange: '51-75', order: 3 },
      { name: 'Forest Society and Colonialism', pageRange: '76-100', order: 4 },
      { name: 'Pastoralists in the Modern World', pageRange: '101-125', order: 5 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['NCERT', 'Class 9', 'World History'],
    description: 'NCERT Class 9 History - Essential for World History topics',
    totalPages: 125,
    estimatedHours: 20,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },
];

const seedTemplates = async () => {
  try {
    console.log('🌱 Starting UPSC template seeding...');
    
    // Clear existing templates
    await UpscResource.deleteMany({ isTemplate: true });
    console.log('🗑️  Cleared existing templates');
    
    // Insert new templates
    const insertedTemplates = await UpscResource.insertMany(upscTemplateBooks);
    console.log(`✅ Inserted ${insertedTemplates.length} UPSC template resources`);
    
    // Group by subject for summary
    const subjectSummary = insertedTemplates.reduce((acc, book) => {
      if (!acc[book.subject]) acc[book.subject] = 0;
      acc[book.subject]++;
      return acc;
    }, {});
    
    console.log('\n📊 Summary by Subject:');
    Object.entries(subjectSummary).forEach(([subject, count]) => {
      console.log(`   ${subject}: ${count} books`);
    });
    
    console.log('\n🎯 Template seeding completed successfully!');
    console.log('📝 Users can now import these templates using the import-template API');
    
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔐 Database connection closed');
  }
};

// Run seeder
const runSeeder = async () => {
  await connectDB();
  await seedTemplates();
};

// Only run if called directly
if (require.main === module) {
  runSeeder();
}

module.exports = { seedTemplates, upscTemplateBooks };
