import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

/**
 * Seed file for creating realistic dummy data for listings and contractors
 * across major US cities to make the platform look active and established.
 * 
 * This creates:
 * - 200+ property listings across 50 major US cities
 * - 300+ contractor profiles with realistic details
 * - Reviews, ratings, and portfolio items
 * - All without creating actual user accounts (uses placeholder data)
 */

// Major US cities with coordinates for realistic data
const MAJOR_CITIES = [
  { city: 'New York', state: 'NY', zip: '10001', lat: 40.7128, lng: -74.0060 },
  { city: 'Los Angeles', state: 'CA', zip: '90001', lat: 34.0522, lng: -118.2437 },
  { city: 'Chicago', state: 'IL', zip: '60601', lat: 41.8781, lng: -87.6298 },
  { city: 'Houston', state: 'TX', zip: '77001', lat: 29.7604, lng: -95.3698 },
  { city: 'Phoenix', state: 'AZ', zip: '85001', lat: 33.4484, lng: -112.0740 },
  { city: 'Philadelphia', state: 'PA', zip: '19019', lat: 39.9526, lng: -75.1652 },
  { city: 'San Antonio', state: 'TX', zip: '78201', lat: 29.4241, lng: -98.4936 },
  { city: 'San Diego', state: 'CA', zip: '92101', lat: 32.7157, lng: -117.1611 },
  { city: 'Dallas', state: 'TX', zip: '75201', lat: 32.7767, lng: -96.7970 },
  { city: 'San Jose', state: 'CA', zip: '95101', lat: 37.3382, lng: -121.8863 },
  { city: 'Austin', state: 'TX', zip: '78701', lat: 30.2672, lng: -97.7431 },
  { city: 'Jacksonville', state: 'FL', zip: '32099', lat: 30.3322, lng: -81.6557 },
  { city: 'Fort Worth', state: 'TX', zip: '76101', lat: 32.7555, lng: -97.3308 },
  { city: 'Columbus', state: 'OH', zip: '43004', lat: 39.9612, lng: -82.9988 },
  { city: 'Charlotte', state: 'NC', zip: '28201', lat: 35.2271, lng: -80.8431 },
  { city: 'San Francisco', state: 'CA', zip: '94102', lat: 37.7749, lng: -122.4194 },
  { city: 'Indianapolis', state: 'IN', zip: '46201', lat: 39.7684, lng: -86.1581 },
  { city: 'Seattle', state: 'WA', zip: '98101', lat: 47.6062, lng: -122.3321 },
  { city: 'Denver', state: 'CO', zip: '80201', lat: 39.7392, lng: -104.9903 },
  { city: 'Washington', state: 'DC', zip: '20001', lat: 38.9072, lng: -77.0369 },
  { city: 'Boston', state: 'MA', zip: '02101', lat: 42.3601, lng: -71.0589 },
  { city: 'Nashville', state: 'TN', zip: '37201', lat: 36.1627, lng: -86.7816 },
  { city: 'Oklahoma City', state: 'OK', zip: '73101', lat: 35.4676, lng: -97.5164 },
  { city: 'Portland', state: 'OR', zip: '97201', lat: 45.5152, lng: -122.6784 },
  { city: 'Las Vegas', state: 'NV', zip: '89101', lat: 36.1699, lng: -115.1398 },
  { city: 'Detroit', state: 'MI', zip: '48201', lat: 42.3314, lng: -83.0458 },
  { city: 'Memphis', state: 'TN', zip: '37501', lat: 35.1495, lng: -90.0490 },
  { city: 'Louisville', state: 'KY', zip: '40201', lat: 38.2527, lng: -85.7585 },
  { city: 'Baltimore', state: 'MD', zip: '21201', lat: 39.2904, lng: -76.6122 },
  { city: 'Milwaukee', state: 'WI', zip: '53201', lat: 43.0389, lng: -87.9065 },
  { city: 'Albuquerque', state: 'NM', zip: '87101', lat: 35.0844, lng: -106.6504 },
  { city: 'Tucson', state: 'AZ', zip: '85701', lat: 32.2226, lng: -110.9747 },
  { city: 'Fresno', state: 'CA', zip: '93650', lat: 36.7378, lng: -119.7871 },
  { city: 'Sacramento', state: 'CA', zip: '94203', lat: 38.5816, lng: -121.4944 },
  { city: 'Kansas City', state: 'MO', zip: '64101', lat: 39.0997, lng: -94.5786 },
  { city: 'Mesa', state: 'AZ', zip: '85201', lat: 33.4152, lng: -111.8315 },
  { city: 'Atlanta', state: 'GA', zip: '30301', lat: 33.7490, lng: -84.3880 },
  { city: 'Omaha', state: 'NE', zip: '68101', lat: 41.2565, lng: -95.9345 },
  { city: 'Colorado Springs', state: 'CO', zip: '80901', lat: 38.8339, lng: -104.8214 },
  { city: 'Raleigh', state: 'NC', zip: '27601', lat: 35.7796, lng: -78.6382 },
  { city: 'Miami', state: 'FL', zip: '33101', lat: 25.7617, lng: -80.1918 },
  { city: 'Cleveland', state: 'OH', zip: '44101', lat: 41.4993, lng: -81.6944 },
  { city: 'Tulsa', state: 'OK', zip: '74101', lat: 36.1540, lng: -95.9928 },
  { city: 'Minneapolis', state: 'MN', zip: '55401', lat: 44.9778, lng: -93.2650 },
  { city: 'New Orleans', state: 'LA', zip: '70112', lat: 29.9511, lng: -90.0715 },
  { city: 'Tampa', state: 'FL', zip: '33601', lat: 27.9506, lng: -82.4572 },
  { city: 'Arlington', state: 'TX', zip: '76010', lat: 32.7357, lng: -97.1081 },
  { city: 'Pittsburgh', state: 'PA', zip: '15201', lat: 40.4406, lng: -79.9959 },
  { city: 'Cincinnati', state: 'OH', zip: '45201', lat: 39.1031, lng: -84.5120 },
  { city: 'Orlando', state: 'FL', zip: '32801', lat: 28.5383, lng: -81.3792 },
];

// Realistic first and last names
const FIRST_NAMES = [
  'James', 'Michael', 'Robert', 'John', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Andrew', 'Paul', 'Joshua', 'Kenneth',
  'Maria', 'Nancy', 'Lisa', 'Betty', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle',
  'Brian', 'Kevin', 'Timothy', 'Ronald', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas',
  'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia', 'Kathleen', 'Amy'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

// Street names for realistic addresses
const STREET_NAMES = [
  'Main', 'Oak', 'Maple', 'Cedar', 'Elm', 'Washington', 'Lake', 'Hill', 'Park', 'Pine',
  'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
  'Market', 'Church', 'Spring', 'Walnut', 'Chestnut', 'Broad', 'High', 'Center', 'Union', 'Water',
  'River', 'Sunset', 'Madison', 'Lincoln', 'Jefferson', 'Franklin', 'Adams', 'Jackson', 'Wilson', 'Grant'
];

const STREET_TYPES = ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Rd', 'Way', 'Ct', 'Pl', 'Ter'];

// Contractor specialties
const CONTRACTOR_SPECIALTIES = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'General Contracting',
  'Carpentry',
  'Painting',
  'Roofing',
  'Flooring',
  'Landscaping',
  'Drywall',
  'Tile Work',
  'Kitchen Remodeling',
  'Bathroom Remodeling',
  'Deck Building',
  'Fence Installation',
  'Concrete Work',
  'Masonry',
  'Window Installation',
  'Door Installation',
  'Siding',
  'Gutter Installation',
  'Insulation',
  'Waterproofing',
  'Foundation Repair',
  'Pest Control',
  'Appliance Repair',
  'Locksmith',
  'Garage Door Repair',
  'Pool Maintenance',
  'Tree Service'
];

// Property types
const PROPERTY_TYPES = ['apartment', 'house', 'condo', 'townhouse', 'duplex', 'studio'];

// Amenities
const PROPERTY_AMENITIES = [
  'Parking', 'Laundry', 'Pool', 'Gym', 'Pet Friendly', 'Balcony', 'Dishwasher',
  'Air Conditioning', 'Heating', 'Hardwood Floors', 'Walk-in Closet', 'Fireplace',
  'Patio', 'Garden', 'Storage', 'Elevator', 'Doorman', 'Security System'
];

// Helper functions
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateName(): string {
  return `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
}

function generateBusinessName(specialty: string): string {
  const lastName = randomElement(LAST_NAMES);
  const formats = [
    `${lastName} ${specialty}`,
    `${lastName} & Sons ${specialty}`,
    `${lastName} Brothers ${specialty}`,
    `${randomElement(FIRST_NAMES)}'s ${specialty}`,
    `${lastName} Professional ${specialty}`,
    `Elite ${specialty} Services`,
    `Premier ${specialty} Solutions`,
    `${lastName} Home Services`,
    `Quality ${specialty} Co.`,
    `${lastName} Contractors`
  ];
  return randomElement(formats);
}

function generateAddress(city: any): any {
  const streetNumber = randomInt(100, 9999);
  const streetName = randomElement(STREET_NAMES);
  const streetType = randomElement(STREET_TYPES);
  const unit = Math.random() > 0.7 ? `Apt ${randomInt(1, 999)}` : null;
  
  return {
    street: `${streetNumber} ${streetName} ${streetType}`,
    unit,
    city: city.city,
    state: city.state,
    zip: city.zip,
    country: 'USA'
  };
}

function generateSlug(text: string, id: number): string {
  return `${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id}`;
}

// Generate placeholder image URL (using picsum.photos for realistic property images)
function generatePropertyImages(count: number, seed: number): string[] {
  const images: string[] = [];
  for (let i = 0; i < count; i++) {
    images.push(`https://picsum.photos/seed/${seed + i}/800/600`);
  }
  return images;
}

function generateContractorPhoto(seed: number): string {
  // Using UI Avatars for contractor profile photos
  const name = generateName();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=random&seed=${seed}`;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log('🌱 Starting marketplace dummy data seeding...');

  // Create a dummy landlord for properties (without actual user account)
  console.log('📦 Creating dummy landlord accounts...');
  const landlords = [];
  
  for (let i = 0; i < 10; i++) {
    const city = randomElement(MAJOR_CITIES);
    const landlord = await prisma.landlord.create({
      data: {
        name: `${randomElement(LAST_NAMES)} Property Management`,
        subdomain: `landlord-${i + 1}-${Date.now()}`,
        companyName: `${randomElement(LAST_NAMES)} Properties LLC`,
        companyEmail: `contact@landlord${i + 1}.example.com`,
        companyPhone: `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
        companyAddress: `${generateAddress(city).street}, ${city.city}, ${city.state} ${city.zip}`,
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
      },
    });
    landlords.push(landlord);
  }

  // Create properties (listings) across all major cities
  console.log('🏠 Creating property listings...');
  const properties = [];
  
  for (let i = 0; i < 250; i++) {
    const city = randomElement(MAJOR_CITIES);
    const address = generateAddress(city);
    const propertyType = randomElement(PROPERTY_TYPES);
    const bedrooms = propertyType === 'studio' ? 0 : randomInt(1, 5);
    const bathrooms = randomFloat(1, 3, 1);
    const sqft = randomInt(500, 3500);
    const rent = randomInt(800, 5000);
    const landlord = randomElement(landlords);
    
    const property = await prisma.property.create({
      data: {
        name: `${address.street}${address.unit ? ` ${address.unit}` : ''}`,
        slug: generateSlug(`${address.street}-${city.city}`, i),
        description: `Beautiful ${propertyType} in ${city.city}. Features ${bedrooms} bedroom${bedrooms !== 1 ? 's' : ''} and ${bathrooms} bathroom${bathrooms !== 1 ? 's' : ''}. Located in a prime area with easy access to shopping, dining, and entertainment.`,
        address: address,
        type: propertyType,
        status: 'active',
        landlordId: landlord.id,
        amenities: randomElements(PROPERTY_AMENITIES, randomInt(3, 8)),
        videoUrl: Math.random() > 0.7 ? `https://www.youtube.com/watch?v=dQw4w9WgXcQ` : null,
        virtualTourUrl: Math.random() > 0.8 ? `https://my.matterport.com/show/?m=example` : null,
      },
    });
    
    // Create units for the property
    const unitCount = propertyType === 'apartment' ? randomInt(1, 3) : 1;
    for (let u = 0; u < unitCount; u++) {
      await prisma.unit.create({
        data: {
          propertyId: property.id,
          name: unitCount > 1 ? `Unit ${u + 1}` : 'Main',
          type: propertyType,
          bedrooms,
          bathrooms,
          sizeSqFt: sqft,
          rentAmount: rent,
          isAvailable: Math.random() > 0.3, // 70% available
          images: generatePropertyImages(randomInt(3, 8), i * 100 + u),
          amenities: randomElements(PROPERTY_AMENITIES, randomInt(2, 6)),
        },
      });
    }
    
    properties.push(property);
    
    if ((i + 1) % 50 === 0) {
      console.log(`   Created ${i + 1} properties...`);
    }
  }

  console.log(`✅ Created ${properties.length} properties`);

  // Create contractor profiles
  console.log('👷 Creating contractor profiles...');
  const contractors = [];
  
  // First, create dummy user accounts for contractors
  console.log('   Creating dummy user accounts for contractors...');
  const contractorUsers = [];
  for (let i = 0; i < 350; i++) {
    const user = await prisma.user.create({
      data: {
        name: generateName(),
        email: `contractor${i}@example.com`,
        role: 'user',
      },
    });
    contractorUsers.push(user);
  }
  
  for (let i = 0; i < 350; i++) {
    const city = randomElement(MAJOR_CITIES);
    const specialty = randomElement(CONTRACTOR_SPECIALTIES);
    const businessName = generateBusinessName(specialty);
    const name = contractorUsers[i].name;
    const yearsExp = randomInt(2, 30);
    const avgRating = randomFloat(3.5, 5.0, 1);
    const totalReviews = randomInt(5, 250);
    const completedJobs = randomInt(10, 500);
    
    // Calculate rank score based on various factors
    const rankScore = (
      (avgRating / 5) * 40 + // 40% weight on rating
      Math.min(totalReviews / 100, 1) * 20 + // 20% weight on review count
      Math.min(completedJobs / 200, 1) * 20 + // 20% weight on completed jobs
      Math.min(yearsExp / 20, 1) * 20 // 20% weight on experience
    );
    
    const contractor = await prisma.contractorProfile.create({
      data: {
        userId: contractorUsers[i].id,
        slug: generateSlug(businessName, i),
        businessName,
        displayName: name,
        tagline: `Licensed ${specialty} Professional - ${yearsExp} Years Experience`,
        bio: `${businessName} has been serving the ${city.city} area for ${yearsExp} years. We specialize in ${specialty.toLowerCase()} and pride ourselves on quality workmanship, reliability, and customer satisfaction. Our team is fully licensed, insured, and committed to exceeding your expectations.`,
        profilePhoto: generateContractorPhoto(i),
        coverPhoto: `https://picsum.photos/seed/contractor-${i}/1200/400`,
        email: `contact@${generateSlug(businessName, i)}.example.com`,
        phone: `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
        website: Math.random() > 0.5 ? `https://www.${generateSlug(businessName, i)}.com` : null,
        serviceAreas: [city.zip, ...randomElements(MAJOR_CITIES.filter(c => c.state === city.state).map(c => c.zip), randomInt(1, 3))],
        serviceRadius: randomInt(15, 50),
        baseCity: city.city,
        baseState: city.state,
        specialties: [specialty, ...randomElements(CONTRACTOR_SPECIALTIES.filter(s => s !== specialty), randomInt(0, 3))],
        yearsExperience: yearsExp,
        licenseNumber: `${city.state}-${randomInt(100000, 999999)}`,
        licenseState: city.state,
        insuranceVerified: Math.random() > 0.2, // 80% verified
        backgroundChecked: Math.random() > 0.3, // 70% checked
        portfolioImages: generatePropertyImages(randomInt(4, 12), i * 1000),
        isAvailable: Math.random() > 0.1, // 90% available
        isPublic: true,
        acceptingNewWork: Math.random() > 0.15, // 85% accepting work
        minimumJobSize: Math.random() > 0.5 ? randomInt(100, 500) : null,
        hourlyRate: randomFloat(50, 200, 2),
        rankScore,
        avgRating,
        totalReviews,
        completedJobs,
        responseRate: randomFloat(0.75, 1.0, 2),
        onTimeRate: randomFloat(0.80, 1.0, 2),
        repeatClientRate: randomFloat(0.30, 0.80, 2),
        identityVerified: Math.random() > 0.25, // 75% verified
        licenseVerifiedAt: Math.random() > 0.3 ? new Date(Date.now() - randomInt(1, 365) * 24 * 60 * 60 * 1000) : null,
        backgroundCheckDate: Math.random() > 0.4 ? new Date(Date.now() - randomInt(1, 180) * 24 * 60 * 60 * 1000) : null,
        instantBookingEnabled: Math.random() > 0.6, // 40% offer instant booking
        subscriptionTier: randomElement(['starter', 'pro', 'pro', 'enterprise']), // weighted towards pro
        subscriptionStatus: 'active',
        isPaymentReady: Math.random() > 0.2, // 80% payment ready
        subdomain: Math.random() > 0.7 ? generateSlug(businessName, i) : null,
        themeColor: randomElement(['violet', 'emerald', 'blue', 'rose', 'amber']),
      },
    });
    
    contractors.push(contractor);
    
    if ((i + 1) % 50 === 0) {
      console.log(`   Created ${i + 1} contractors...`);
    }
  }

  console.log(`✅ Created ${contractors.length} contractor profiles`);

  // Create portfolio items for contractors
  console.log('📸 Creating contractor portfolio items...');
  let portfolioCount = 0;
  
  for (const contractor of contractors) {
    const itemCount = randomInt(2, 8);
    for (let i = 0; i < itemCount; i++) {
      await prisma.contractorPortfolioItem.create({
        data: {
          contractorId: contractor.id,
          title: `${randomElement(['Kitchen', 'Bathroom', 'Living Room', 'Bedroom', 'Basement', 'Outdoor'])} ${randomElement(['Renovation', 'Remodel', 'Upgrade', 'Installation', 'Repair'])}`,
          description: `Professional ${contractor.specialties[0].toLowerCase()} work completed in ${randomElement(MAJOR_CITIES).city}. Client was extremely satisfied with the results.`,
          category: contractor.specialties[0].toLowerCase().replace(/\s+/g, '-'),
          images: generatePropertyImages(randomInt(2, 6), portfolioCount * 100),
          projectDate: new Date(Date.now() - randomInt(30, 1095) * 24 * 60 * 60 * 1000),
          budget: randomFloat(500, 15000, 2),
          duration: randomInt(1, 30),
          location: `${randomElement(MAJOR_CITIES).city}, ${randomElement(MAJOR_CITIES).state}`,
          featured: i === 0, // First item is featured
        },
      });
      portfolioCount++;
    }
  }

  console.log(`✅ Created ${portfolioCount} portfolio items`);

  // Create reviews for contractors
  console.log('⭐ Creating contractor reviews...');
  let reviewCount = 0;
  
  // First, create some dummy customer users for reviews
  console.log('   Creating dummy customer accounts for reviews...');
  const customers = [];
  for (let i = 0; i < 50; i++) {
    const customer = await prisma.user.create({
      data: {
        name: generateName(),
        email: `customer${i}@example.com`,
        role: 'user',
      },
    });
    customers.push(customer);
  }
  
  for (const contractor of contractors) {
    const reviewsToCreate = Math.min(contractor.totalReviews, randomInt(5, 25)); // Create subset of total reviews
    
    for (let i = 0; i < reviewsToCreate; i++) {
      const rating = randomInt(3, 5); // Mostly positive reviews
      const reviewTexts = {
        5: [
          'Absolutely fantastic work! Highly professional and completed the job ahead of schedule.',
          'Best contractor I\'ve ever worked with. Attention to detail was impeccable.',
          'Exceeded all expectations. Will definitely hire again for future projects.',
          'Outstanding service from start to finish. Very responsive and professional.',
          'Couldn\'t be happier with the results. Highly recommend to anyone!',
        ],
        4: [
          'Great work overall. Minor communication issues but the end result was excellent.',
          'Very satisfied with the quality. Would hire again.',
          'Professional and reliable. Job was completed as promised.',
          'Good experience. The work was done well and on time.',
        ],
        3: [
          'Decent work. Met expectations but nothing exceptional.',
          'Job was completed satisfactorily. A few minor issues but overall okay.',
          'Fair experience. Work quality was acceptable.',
        ],
      };
      
      await prisma.contractorReview.create({
        data: {
          contractorId: contractor.id,
          customerId: randomElement(customers).id,
          overallRating: rating,
          qualityRating: randomFloat(rating - 0.5, rating, 1),
          communicationRating: randomFloat(rating - 0.5, rating, 1),
          timelinessRating: randomFloat(rating - 0.5, rating, 1),
          professionalismRating: randomFloat(rating - 0.5, rating, 1),
          valueRating: randomFloat(rating - 0.5, rating, 1),
          title: rating === 5 ? 'Excellent Service!' : rating === 4 ? 'Very Good' : 'Satisfactory',
          comment: randomElement(reviewTexts[rating as 5 | 4 | 3] || reviewTexts[3]),
          projectType: randomElement(contractor.specialties),
          projectCost: randomFloat(200, 10000, 2),
          verified: Math.random() > 0.3, // 70% verified
          status: 'published',
          createdAt: new Date(Date.now() - randomInt(1, 730) * 24 * 60 * 60 * 1000),
        },
      });
      reviewCount++;
    }
  }

  console.log(`✅ Created ${reviewCount} reviews`);

  console.log('\n🎉 Marketplace dummy data seeding completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   - ${properties.length} property listings`);
  console.log(`   - ${contractors.length} contractor profiles`);
  console.log(`   - ${portfolioCount} portfolio items`);
  console.log(`   - ${reviewCount} reviews`);
  console.log(`\n✨ Your marketplace now looks active and established!`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding marketplace data:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Cleanup handled by script completion
  });
