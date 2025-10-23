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

const comprehensiveUpscResources = [
  // I. FOUNDATIONAL RESOURCES - NCERT TEXTBOOKS
  {
    category: 'NCERT',
    subject: 'History',
    title: 'Our Pasts - I (Class VI)',
    author: 'NCERT',
    publisher: 'NCERT',
    chapters: [
      { name: 'What, Where, How and When?', pageRange: '1-10', order: 1 },
      { name: 'From Hunting-Gathering to Growing Food', pageRange: '11-20', order: 2 },
      { name: 'In the Earliest Cities', pageRange: '21-30', order: 3 },
      { name: 'What Books and Burials Tell Us', pageRange: '31-40', order: 4 },
      { name: 'Kingdoms, Kings and an Early Republic', pageRange: '41-50', order: 5 },
      { name: 'New Questions and Ideas', pageRange: '51-60', order: 6 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['NCERT', 'Ancient History', 'Foundation'],
    description: 'Essential NCERT for Ancient Indian History foundation',
    totalPages: 120,
    estimatedHours: 15,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },
  {
    category: 'NCERT',
    subject: 'History',
    title: 'Themes in Indian History - I (Class XI)',
    author: 'NCERT',
    publisher: 'NCERT',
    chapters: [
      { name: 'From the Beginning of Time', pageRange: '1-20', order: 1 },
      { name: 'Writing and City Life', pageRange: '21-40', order: 2 },
      { name: 'An Empire Across Three Continents', pageRange: '41-60', order: 3 },
      { name: 'The Central Islamic Lands', pageRange: '61-80', order: 4 },
      { name: 'Nomadic Empires', pageRange: '81-100', order: 5 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['NCERT', 'World History', 'Medieval'],
    description: 'NCERT Class XI - Essential for World History and Medieval period',
    totalPages: 200,
    estimatedHours: 25,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },

  // STANDARD REFERENCE BOOKS
  {
    category: 'Book',
    subject: 'Polity',
    title: 'Indian Polity',
    author: 'M. Laxmikanth',
    publisher: 'McGraw Hill',
    chapters: [
      { name: 'Historical Background', pageRange: '1-20', order: 1 },
      { name: 'Salient Features of the Constitution', pageRange: '21-40', order: 2 },
      { name: 'Preamble of the Constitution', pageRange: '41-50', order: 3 },
      { name: 'Union and Its Territory', pageRange: '51-70', order: 4 },
      { name: 'Citizenship', pageRange: '71-90', order: 5 },
      { name: 'Fundamental Rights', pageRange: '91-130', order: 6 },
      { name: 'Directive Principles of State Policy', pageRange: '131-150', order: 7 },
      { name: 'Fundamental Duties', pageRange: '151-160', order: 8 },
      { name: 'President', pageRange: '161-190', order: 9 },
      { name: 'Vice-President', pageRange: '191-210', order: 10 },
      { name: 'Prime Minister and Council of Ministers', pageRange: '211-240', order: 11 },
      { name: 'Cabinet Committees', pageRange: '241-260', order: 12 },
      { name: 'Parliament', pageRange: '261-320', order: 13 },
      { name: 'Supreme Court', pageRange: '321-370', order: 14 },
      { name: 'High Courts', pageRange: '371-390', order: 15 },
      { name: 'Subordinate Courts', pageRange: '391-410', order: 16 },
      { name: 'Union Public Service Commission', pageRange: '411-430', order: 17 },
      { name: 'Election Commission', pageRange: '431-450', order: 18 },
      { name: 'Centre-State Relations', pageRange: '451-490', order: 19 },
      { name: 'Inter-State Relations', pageRange: '491-510', order: 20 },
      { name: 'Emergency Provisions', pageRange: '511-530', order: 21 },
      { name: 'Local ', pageRange: '531-570', order: 22 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['Constitution', 'Governance', 'Core Book'],
    description: 'Most comprehensive and updated book for Indian Polity. Essential for both Prelims and Mains.',
    totalPages: 570,
    estimatedHours: 80,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },
  {
    category: 'Book',
    subject: 'Economy',
    title: 'Indian Economy',
    author: 'Ramesh Singh',
    publisher: 'McGraw Hill',
    chapters: [
      { name: 'Introduction to Indian Economy', pageRange: '1-30', order: 1 },
      { name: 'Evolution of the Indian Economy', pageRange: '31-60', order: 2 },
      { name: 'National Income Accounting', pageRange: '61-90', order: 3 },
      { name: 'Economic Growth and Development', pageRange: '91-120', order: 4 },
      { name: 'Planning in India', pageRange: '121-150', order: 5 },
      { name: 'Agriculture and Allied Activities', pageRange: '151-200', order: 6 },
      { name: 'Industry and Infrastructure', pageRange: '201-250', order: 7 },
      { name: 'Services Sector', pageRange: '251-280', order: 8 },
      { name: 'Public Finance', pageRange: '281-320', order: 9 },
      { name: 'Money and Banking', pageRange: '321-360', order: 10 },
      { name: 'International Trade', pageRange: '361-400', order: 11 },
      { name: 'Contemporary Economic Issues', pageRange: '401-450', order: 12 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['Economy', 'Development', 'Core Book'],
    description: 'Comprehensive coverage of Indian Economy. Updated with latest economic policies and developments.',
    totalPages: 450,
    estimatedHours: 70,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },
  {
    category: 'Book',
    subject: 'History',
    title: 'A Brief History of Modern India',
    author: 'Spectrum Publications',
    publisher: 'Spectrum Publications',
    chapters: [
      { name: 'European Penetration and British Expansion', pageRange: '1-30', order: 1 },
      { name: 'British Colonial Policy', pageRange: '31-60', order: 2 },
      { name: 'Resistance to Colonial Rule', pageRange: '61-100', order: 3 },
      { name: 'Social and Religious Reform Movements', pageRange: '101-140', order: 4 },
      { name: 'Rise of Nationalism and Formation of INC', pageRange: '141-180', order: 5 },
      { name: 'Era of Militant Nationalism', pageRange: '181-220', order: 6 },
      { name: 'Gandhi and Mass Nationalism', pageRange: '221-280', order: 7 },
      { name: 'Towards Freedom and Partition', pageRange: '281-320', order: 8 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['Modern History', 'Freedom Struggle', 'Nationalism'],
    description: 'Comprehensive coverage of Modern Indian History and Freedom Struggle',
    totalPages: 320,
    estimatedHours: 45,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },
  {
    category: 'Book',
    subject: 'Geography',
    title: 'Certificate Physical and Human Geography',
    author: 'G.C. Leong',
    publisher: 'Oxford University Press',
    chapters: [
      { name: 'The Earth in the Solar System', pageRange: '1-25', order: 1 },
      { name: 'Landforms', pageRange: '26-80', order: 2 },
      { name: 'Climate and Weather', pageRange: '81-140', order: 3 },
      { name: 'Ocean Waters', pageRange: '141-170', order: 4 },
      { name: 'Natural Vegetation', pageRange: '171-200', order: 5 },
      { name: 'Soils', pageRange: '201-220', order: 6 },
      { name: 'Population Geography', pageRange: '221-260', order: 7 },
      { name: 'Settlement Geography', pageRange: '261-290', order: 8 },
      { name: 'Economic Geography', pageRange: '291-330', order: 9 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['Physical Geography', 'Human Geography'],
    description: 'Standard text for both Physical and Human Geography. Essential for building geographical concepts.',
    totalPages: 330,
    estimatedHours: 55,
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
      { name: 'India - Location and Physiography', pageRange: '1-40', order: 1 },
      { name: 'Climate of India', pageRange: '41-80', order: 2 },
      { name: 'Natural Vegetation and Wildlife', pageRange: '81-110', order: 3 },
      { name: 'Soils of India', pageRange: '111-130', order: 4 },
      { name: 'Water Resources', pageRange: '131-160', order: 5 },
      { name: 'Mineral and Energy Resources', pageRange: '161-200', order: 6 },
      { name: 'Industries', pageRange: '201-250', order: 7 },
      { name: 'Transport and Communication', pageRange: '251-280', order: 8 },
      { name: 'Population and Settlement', pageRange: '281-310', order: 9 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['India Geography', 'Economic Geography'],
    description: 'Comprehensive coverage of Indian Geography. Essential for understanding Indias physical and economic geography.',
    totalPages: 310,
    estimatedHours: 50,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },

  // CULTURE AND ETHICS
  {
    category: 'Book',
    subject: 'Art & Culture',
    title: 'Indian Art and Culture',
    author: 'Nitin Singhania',
    publisher: 'Pearson',
    chapters: [
      { name: 'Introduction to Indian Culture', pageRange: '1-20', order: 1 },
      { name: 'Religion and Philosophy', pageRange: '21-60', order: 2 },
      { name: 'Architecture', pageRange: '61-120', order: 3 },
      { name: 'Sculpture', pageRange: '121-160', order: 4 },
      { name: 'Painting', pageRange: '161-200', order: 5 },
      { name: 'Music and Dance', pageRange: '201-240', order: 6 },
      { name: 'Literature', pageRange: '241-280', order: 7 },
      { name: 'Fairs and Festivals', pageRange: '281-310', order: 8 },
    ],
    priority: 'Recommended',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['Culture', 'Arts', 'Heritage'],
    description: 'Comprehensive coverage of Indian Art and Culture for UPSC',
    totalPages: 310,
    estimatedHours: 40,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },
  {
    category: 'Book',
    subject: 'Ethics',
    title: 'Lexicon for Ethics, Integrity and Aptitude',
    author: 'Chronicle Publications',
    publisher: 'Chronicle Publications',
    chapters: [
      { name: 'Ethics and Human Interface', pageRange: '1-30', order: 1 },
      { name: 'Attitude', pageRange: '31-60', order: 2 },
      { name: 'Aptitude and Foundational Values', pageRange: '61-90', order: 3 },
      { name: 'Emotional Intelligence', pageRange: '91-120', order: 4 },
      { name: 'Contributions of Moral Thinkers', pageRange: '121-160', order: 5 },
      { name: 'Public/Civil Service Values and Ethics', pageRange: '161-200', order: 6 },
      { name: 'Probity in Governance', pageRange: '201-240', order: 7 },
      { name: 'Case Studies', pageRange: '241-300', order: 8 },
    ],
    priority: 'Must Read',
    examRelevance: ['Mains'],
    tags: ['Ethics', 'Integrity', 'Governance'],
    description: 'Essential for GS Paper IV - Ethics, Integrity and Aptitude',
    totalPages: 300,
    estimatedHours: 35,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },

  // ENVIRONMENT
  {
    category: 'Book',
    subject: 'Environment',
    title: 'Environment and Ecology',
    author: 'Shankar IAS Academy',
    publisher: 'Shankar IAS Academy',
    chapters: [
      { name: 'Environmental Studies - An Introduction', pageRange: '1-25', order: 1 },
      { name: 'Ecosystem', pageRange: '26-60', order: 2 },
      { name: 'Biodiversity and its Conservation', pageRange: '61-100', order: 3 },
      { name: 'Environmental Pollution', pageRange: '101-150', order: 4 },
      { name: 'Climate Change and Global Warming', pageRange: '151-180', order: 5 },
      { name: 'Environmental Impact Assessment', pageRange: '181-210', order: 6 },
      { name: 'Environmental Laws and Policies', pageRange: '211-250', order: 7 },
    ],
    priority: 'Recommended',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['Environment', 'Ecology', 'Climate Change'],
    description: 'Comprehensive coverage of Environment and Ecology topics',
    totalPages: 250,
    estimatedHours: 30,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },

  // II. DYNAMIC RESOURCES - CURRENT AFFAIRS
  {
    category: 'Magazine',
    subject: 'Current Affairs',
    title: 'The Hindu Newspaper',
    author: 'The Hindu',
    publisher: 'The Hindu',
    chapters: [
      { name: 'Daily Reading Practice', pageRange: 'Daily', order: 1 },
      { name: 'Editorial Analysis', pageRange: 'Daily', order: 2 },
      { name: 'Explained Section', pageRange: 'Daily', order: 3 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains', 'Interview'],
    tags: ['Current Affairs', 'Daily Reading', 'Editorial'],
    description: 'Daily newspaper reading for current affairs. Focus on Editorial and Explained pages.',
    estimatedHours: 365, // 1 hour daily
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },
  {
    category: 'Magazine',
    subject: 'Current Affairs',
    title: 'Yojana Magazine',
    author: ' of India',
    publisher: 'Publications Division',
    chapters: [
      { name: 'Monthly Theme Analysis', pageRange: 'Monthly', order: 1 },
      { name: ' Scheme Updates', pageRange: 'Monthly', order: 2 },
      { name: 'Policy Analysis', pageRange: 'Monthly', order: 3 },
    ],
    priority: 'Recommended',
    examRelevance: ['Prelims', 'Mains'],
    tags: [' Magazine', 'Schemes', 'Policy'],
    description: 'Official  publication for schemes and policies',
    estimatedHours: 24, // 2 hours monthly
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },
  {
    category: 'Document',
    subject: 'Economy',
    title: 'Economic Survey',
    author: ' of India',
    publisher: 'Ministry of Finance',
    chapters: [
      { name: 'State of the Economy', pageRange: '1-50', order: 1 },
      { name: 'Macroeconomic Framework', pageRange: '51-100', order: 2 },
      { name: 'Price and Monetary Management', pageRange: '101-150', order: 3 },
      { name: 'Growth and Investment', pageRange: '151-200', order: 4 },
      { name: 'External Sector', pageRange: '201-250', order: 5 },
      { name: 'Agriculture and Food Management', pageRange: '251-300', order: 6 },
      { name: 'Industry and Infrastructure', pageRange: '301-350', order: 7 },
      { name: 'Services', pageRange: '351-400', order: 8 },
      { name: 'Social Infrastructure and Employment', pageRange: '401-450', order: 9 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims', 'Mains'],
    tags: ['Economy', ' Document', 'Annual'],
    description: 'Annual Economic Survey - essential for understanding economic developments',
    totalPages: 450,
    estimatedHours: 25,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },

  // III. PRACTICE RESOURCES
  {
    category: 'Document',
    subject: 'Previous Year Papers',
    title: 'UPSC Prelims Previous Year Questions (Last 10 Years)',
    author: 'UPSC',
    publisher: 'UPSC',
    chapters: [
      { name: '2023 Prelims Paper', pageRange: '1-50', order: 1 },
      { name: '2022 Prelims Paper', pageRange: '51-100', order: 2 },
      { name: '2021 Prelims Paper', pageRange: '101-150', order: 3 },
      { name: '2020 Prelims Paper', pageRange: '151-200', order: 4 },
      { name: '2019 Prelims Paper', pageRange: '201-250', order: 5 },
      { name: '2018 Prelims Paper', pageRange: '251-300', order: 6 },
      { name: '2017 Prelims Paper', pageRange: '301-350', order: 7 },
      { name: '2016 Prelims Paper', pageRange: '351-400', order: 8 },
      { name: '2015 Prelims Paper', pageRange: '401-450', order: 9 },
      { name: '2014 Prelims Paper', pageRange: '451-500', order: 10 },
    ],
    priority: 'Must Read',
    examRelevance: ['Prelims'],
    tags: ['Previous Year Papers', 'Practice', 'MCQ'],
    description: 'Last 10 years Prelims papers for trend analysis and practice',
    totalPages: 500,
    estimatedHours: 40,
    isTemplate: true,
    templateCategory: 'UPSC-General',
  },

  // IV. OPTIONAL SUBJECTS - POPULAR CHOICES
  {
    category: 'Book',
    subject: 'Political Science & IR (Optional)',
    title: 'Introduction to Political Theory',
    author: 'O.P. Gauba',
    publisher: 'Macmillan Publishers',
    chapters: [
      { name: 'Political Theory - Meaning and Approaches', pageRange: '1-30', order: 1 },
      { name: 'State', pageRange: '31-70', order: 2 },
      { name: 'Liberty', pageRange: '71-100', order: 3 },
      { name: 'Equality', pageRange: '101-130', order: 4 },
      { name: 'Rights', pageRange: '131-160', order: 5 },
      { name: 'Justice', pageRange: '161-190', order: 6 },
      { name: 'Democracy', pageRange: '191-220', order: 7 },
    ],
    priority: 'Must Read',
    examRelevance: ['Optional'],
    tags: ['Political Science', 'Optional Subject', 'Theory'],
    description: 'Standard text for Political Science optional - Theory part',
    totalPages: 220,
    estimatedHours: 40,
    isTemplate: true,
    templateCategory: 'UPSC-Optional',
  },
  {
    category: 'Book',
    subject: 'Sociology (Optional)',
    title: 'Sociology: Themes and Perspectives',
    author: 'Haralambos and Holborn',
    publisher: 'Collins Educational',
    chapters: [
      { name: 'Sociological Perspectives', pageRange: '1-50', order: 1 },
      { name: 'Social Stratification', pageRange: '51-120', order: 2 },
      { name: 'Families and Households', pageRange: '121-180', order: 3 },
      { name: 'Education', pageRange: '181-240', order: 4 },
      { name: 'Religion', pageRange: '241-300', order: 5 },
      { name: 'Crime and Deviance', pageRange: '301-360', order: 6 },
    ],
    priority: 'Must Read',
    examRelevance: ['Optional'],
    tags: ['Sociology', 'Optional Subject'],
    description: 'Comprehensive text for Sociology optional',
    totalPages: 360,
    estimatedHours: 60,
    isTemplate: true,
    templateCategory: 'UPSC-Optional',
  },
  {
    category: 'Book',
    subject: 'Geography (Optional)',
    title: 'Physical Geography',
    author: 'Savindra Singh',
    publisher: 'Pravalika Publications',
    chapters: [
      { name: 'Geomorphology', pageRange: '1-80', order: 1 },
      { name: 'Climatology', pageRange: '81-160', order: 2 },
      { name: 'Oceanography', pageRange: '161-220', order: 3 },
      { name: 'Biogeography', pageRange: '221-280', order: 4 },
      { name: 'Environmental Geography', pageRange: '281-340', order: 5 },
    ],
    priority: 'Must Read',
    examRelevance: ['Optional'],
    tags: ['Geography', 'Optional Subject', 'Physical'],
    description: 'Standard text for Geography optional - Physical Geography',
    totalPages: 340,
    estimatedHours: 55,
    isTemplate: true,
    templateCategory: 'UPSC-Optional',
  },
  {
    category: 'Book',
    subject: 'Public Administration (Optional)',
    title: 'Public Administration',
    author: 'Mohit Bhattacharya',
    publisher: 'World Press',
    chapters: [
      { name: 'Introduction to Public Administration', pageRange: '1-40', order: 1 },
      { name: 'Administrative Theory', pageRange: '41-100', order: 2 },
      { name: 'Administrative Behaviour', pageRange: '101-150', order: 3 },
      { name: 'Organizations', pageRange: '151-200', order: 4 },
      { name: 'Accountability and Control', pageRange: '201-250', order: 5 },
      { name: 'Comparative Public Administration', pageRange: '251-300', order: 6 },
    ],
    priority: 'Must Read',
    examRelevance: ['Optional'],
    tags: ['Public Administration', 'Optional Subject'],
    description: 'Standard text for Public Administration optional',
    totalPages: 300,
    estimatedHours: 50,
    isTemplate: true,
    templateCategory: 'UPSC-Optional',
  },
];

const seedComprehensiveTemplates = async () => {
  try {
    console.log('🌱 Starting comprehensive UPSC template seeding...');
    
    // Clear existing templates
    await UpscResource.deleteMany({ isTemplate: true });
    console.log('🗑️  Cleared existing templates');
    
    // Insert new comprehensive templates
    const insertedTemplates = await UpscResource.insertMany(comprehensiveUpscResources);
    console.log(`✅ Inserted ${insertedTemplates.length} comprehensive UPSC template resources`);
    
    // Group by category and subject for summary
    const categorySummary = insertedTemplates.reduce((acc, book) => {
      const key = `${book.category} - ${book.subject}`;
      if (!acc[key]) acc[key] = 0;
      acc[key]++;
      return acc;
    }, {});
    
    console.log('\n📊 Summary by Category & Subject:');
    Object.entries(categorySummary).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} resources`);
    });
    
    // Template category summary
    const templateSummary = insertedTemplates.reduce((acc, book) => {
      if (!acc[book.templateCategory]) acc[book.templateCategory] = 0;
      acc[book.templateCategory]++;
      return acc;
    }, {});
    
    console.log('\n🎯 Summary by Template Category:');
    Object.entries(templateSummary).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} resources`);
    });
    
    console.log('\n🎉 Comprehensive template seeding completed successfully!');
    console.log('📚 Included resources:');
    console.log('   • Foundational NCERT books (Class VI-XII)');
    console.log('   • Standard reference books by top authors');
    console.log('   • Current affairs sources (newspapers, magazines)');
    console.log('   •  publications (Economic Survey, etc.)');
    console.log('   • Previous year question papers');
    console.log('   • Popular optional subject resources');
    console.log('\n📝 Users can now import these comprehensive templates!');
    
  } catch (error) {
    console.error('❌ Error seeding comprehensive templates:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔐 Database connection closed');
  }
};

// Run seeder
const runSeeder = async () => {
  await connectDB();
  await seedComprehensiveTemplates();
};

// Only run if called directly
if (require.main === module) {
  runSeeder();
}

module.exports = { seedComprehensiveTemplates, comprehensiveUpscResources };
