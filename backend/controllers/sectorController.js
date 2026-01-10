const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
import redis from '../config/redis.js';

const getAllSectors = async (req, res) => {
  try {
         //redis get
       const cached = await redis.get("sectors:all");
     if (cached) {
      return res.json(JSON.parse(cached)); }
    const sectors = await prisma.sector.findMany();
    //redis set
    await redis.set(
  "sectors:all",
  JSON.stringify(sectors),
  "EX",
  600 // 10 minutes
);

    res.json(sectors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createSector = async (req, res) => {
  try {
    const {
      name,
      description,
      companies,
      employment,
      growth,
      majorCities,
      color,
      icon,
    } = req.body;

    const sector = await prisma.sector.create({
      data: {
        name,
        description,
        companies,
        employment,
        growth,
        majorCities,
        color,
        icon,
      },
    });
    
    res.status(201).json(sector);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateSector = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      companies,
      employment,
      growth,
      majorCities,
      color,
      icon,
    } = req.body;

    const sector = await prisma.sector.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        companies,
        employment,
        growth,
        majorCities,
        color,
        icon,
      },
    });
    res.json(sector);
    await redis.del("sectors:all");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Export properly in CommonJS
module.exports = { getAllSectors, createSector, updateSector };
