const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testHostelPersistence() {
  try {
    console.log('🧪 Testing hostel data persistence...');
    
    // Test college ID (you'll need to replace this with a real college ID from your database)
    const testCollegeId = 1; // Replace with actual college ID
    
    // Test data
    const testHostelData = {
      facilities: [
        "Test facility 1",
        "Test facility 2"
      ],
      rooms: [
        {
          type: "Test Single",
          description: "Test room description",
          amenities: "Test amenities",
          fees: "₹30,000/year"
        }
      ],
      mess: {
        facilities: ["Test mess facility"],
        mealTimings: ["Test timing"],
        fees: "₹10,000/year"
      },
      rules: ["Test rule 1", "Test rule 2"]
    };
    
    console.log('📝 Test data:', JSON.stringify(testHostelData, null, 2));
    
    // 1. Check if college exists
    const college = await prisma.college.findUnique({
      where: { id: testCollegeId },
      select: { id: true, name: true, email: true }
    });
    
    if (!college) {
      console.log('❌ College not found with ID:', testCollegeId);
      console.log('📋 Available colleges:');
      const colleges = await prisma.college.findMany({
        select: { id: true, name: true, email: true },
        take: 5
      });
      colleges.forEach(c => console.log(`  - ID: ${c.id}, Name: ${c.name}, Email: ${c.email}`));
      return;
    }
    
    console.log('✅ Found college:', college);
    
    // 2. Test saving hostel data
    console.log('💾 Saving hostel data...');
    
    const hostelDataJson = JSON.stringify(testHostelData);
    
    // Check if infrastructure record exists
    const existingInfrastructure = await prisma.college_infrastructure_new.findUnique({
      where: { college_id: testCollegeId }
    });
    
    if (existingInfrastructure) {
      console.log('📝 Updating existing infrastructure record...');
      await prisma.college_infrastructure_new.update({
        where: { college_id: testCollegeId },
        data: {
          hostel_details: hostelDataJson,
          updated_at: new Date()
        }
      });
    } else {
      console.log('🆕 Creating new infrastructure record...');
      await prisma.college_infrastructure_new.create({
        data: {
          college_id: testCollegeId,
          hostel_details: hostelDataJson,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }
    
    console.log('✅ Hostel data saved successfully');
    
    // 3. Test reading hostel data
    console.log('📖 Reading hostel data...');
    
    const infrastructure = await prisma.college_infrastructure_new.findUnique({
      where: { college_id: testCollegeId }
    });
    
    if (infrastructure && infrastructure.hostel_details) {
      const retrievedData = JSON.parse(infrastructure.hostel_details);
      console.log('✅ Successfully retrieved hostel data:', JSON.stringify(retrievedData, null, 2));
      
      // Compare with original
      const dataMatches = JSON.stringify(testHostelData) === JSON.stringify(retrievedData);
      console.log('🔍 Data matches original:', dataMatches);
      
    } else {
      console.log('❌ No hostel data found after saving');
    }
    
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testHostelPersistence();
