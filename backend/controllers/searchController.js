// controllers/search.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Search users function
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({ 
        success: true,
        data: [],
        message: 'Search query too short' 
      });
    }

    const searchTerm = q.trim().toLowerCase();
    
    // Search in all user types
    const [students, colleges, startups, industries] = await Promise.all([
      // Search Students
      prisma.student.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
                { collegeName: { contains: searchTerm, mode: 'insensitive' } },
                { interestedField: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          collegeName: true,
          interestedField: true,
          profilePicture: true
        },
        take: 10
      }),

      // Search Colleges
      prisma.college.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
                { location: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          location: true,
          description: true,
          profilePicture: true,
          logoUrl: true
        },
        take: 10
      }),

      // Search Startups
      prisma.startup.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
                { startupName: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { location: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          startupName: true,
          email: true,
          description: true,
          location: true,
          startupStage: true,
          profilePicture: true,
          logoUrl: true
        },
        take: 10
      }),

      // Search Industries
      prisma.industry.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
                { companyName: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { location: { contains: searchTerm, mode: 'insensitive' } },
                { industryType: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          email: true,
          description: true,
          location: true,
          industryType: true,
          designation: true,
          profilePicture: true,
          logoUrl: true
        },
        take: 10
      })
    ]);

    // Transform results into a unified format
    const results = [];

    // Add students
    students.forEach(student => {
      results.push({
        id: student.id,
        type: 'student',
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email,
        subtitle: student.collegeName || student.interestedField || student.email,
        profilePicture: student.profilePicture,
        email: student.email
      });
    });

    // Add colleges
    colleges.forEach(college => {
      results.push({
        id: college.id,
        type: 'college',
        name: college.name,
        subtitle: college.location || college.email,
        profilePicture: college.profilePicture || college.logoUrl,
        email: college.email
      });
    });

    // Add startups
    startups.forEach(startup => {
      results.push({
        id: startup.id,
        type: 'startup',
        name: startup.startupName || `${startup.firstName || ''} ${startup.lastName || ''}`.trim() || startup.email,
        subtitle: startup.startupStage || startup.location || startup.email,
        profilePicture: startup.profilePicture || startup.logoUrl,
        email: startup.email
      });
    });

    // Add industries
    industries.forEach(industry => {
      results.push({
        id: industry.id,
        type: 'industry',
        name: industry.companyName || `${industry.firstName || ''} ${industry.lastName || ''}`.trim() || industry.email,
        subtitle: industry.designation || industry.industryType || industry.location || industry.email,
        profilePicture: industry.profilePicture || industry.logoUrl,
        email: industry.email
      });
    });

    // Sort results by relevance
    const sortedResults = results.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(searchTerm);
      const bNameMatch = b.name.toLowerCase().includes(searchTerm);
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return 0;
    });

    // Limit total results
    const limitedResults = sortedResults.slice(0, 20);

    res.json({
      success: true,
      data: limitedResults,
      total: limitedResults.length,
      query: q
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during search',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export the function
module.exports = {
  searchUsers
};