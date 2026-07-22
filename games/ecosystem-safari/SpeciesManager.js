/**
 * SpeciesManager - Manages species data, behaviors, and interactions
 * Provides species definitions and handles species-specific logic
 */
export default class SpeciesManager {
  constructor() {
    this.speciesDatabase = new Map();
    this.loadSpeciesData();
  }

  /**
   * Load all species data into the database
   */
  loadSpeciesData() {
    // Producers (Plants)
    this.addSpecies({
      id: 'grass',
      name: 'Prairie Grass',
      type: 'plant',
      trophicLevel: 1,
      preferredHabitat: 'grassland',
      maxPopulation: 100,
      growthRate: 0.3,
      mortalityRate: 0.1,
      energyNeeds: 5,
      reproductionRate: 0.4,
      adaptability: 0.8,
      size: 'small',
      description: 'Hardy grass that forms the foundation of grassland ecosystems',
      facts: [
        'Grass roots can extend deeper than the plant is tall',
        'One grass plant can produce over 1000 seeds per year',
        'Grasslands store more carbon underground than forests do above ground',
      ],
      sprite: {
        color: '#4CAF50',
        shape: 'grass',
        animationType: 'sway',
      },
    });

    this.addSpecies({
      id: 'oak_tree',
      name: 'Oak Tree',
      type: 'plant',
      trophicLevel: 1,
      preferredHabitat: 'forest',
      maxPopulation: 20,
      growthRate: 0.1,
      mortalityRate: 0.02,
      energyNeeds: 15,
      reproductionRate: 0.1,
      adaptability: 0.6,
      size: 'large',
      description: 'Majestic trees that provide shelter and food for many species',
      facts: [
        'A single oak tree can support over 500 species of insects',
        'Oak trees can live for over 1000 years',
        'One oak tree produces about 2000 acorns per year',
      ],
      sprite: {
        color: '#8D6E63',
        shape: 'tree',
        animationType: 'gentle-sway',
      },
    });

    this.addSpecies({
      id: 'seaweed',
      name: 'Kelp Forest',
      type: 'plant',
      trophicLevel: 1,
      preferredHabitat: 'ocean',
      maxPopulation: 50,
      growthRate: 0.4,
      mortalityRate: 0.15,
      energyNeeds: 8,
      reproductionRate: 0.3,
      adaptability: 0.5,
      size: 'medium',
      description: 'Underwater forests that create complex marine habitats',
      facts: [
        'Kelp can grow up to 2 feet per day',
        'Kelp forests are among the most productive ecosystems on Earth',
        'They provide nursery areas for many fish species',
      ],
      sprite: {
        color: '#2E7D32',
        shape: 'seaweed',
        animationType: 'wave',
      },
    });

    // Primary Consumers (Herbivores)
    this.addSpecies({
      id: 'rabbit',
      name: 'Cottontail Rabbit',
      type: 'mammal',
      trophicLevel: 2,
      preferredHabitat: 'grassland',
      maxPopulation: 40,
      growthRate: 0.25,
      mortalityRate: 0.2,
      energyNeeds: 12,
      reproductionRate: 0.8,
      adaptability: 0.7,
      size: 'small',
      prey: ['grass'],
      description: 'Quick herbivores that help control plant growth',
      facts: [
        'Rabbits can run up to 35 mph to escape predators',
        'They eat their own droppings to get more nutrients',
        'Baby rabbits are born blind and hairless',
      ],
      sprite: {
        color: '#8D6E63',
        shape: 'rabbit',
        animationType: 'hop',
      },
    });

    this.addSpecies({
      id: 'deer',
      name: 'White-tailed Deer',
      type: 'mammal',
      trophicLevel: 2,
      preferredHabitat: 'forest',
      maxPopulation: 25,
      growthRate: 0.15,
      mortalityRate: 0.1,
      energyNeeds: 20,
      reproductionRate: 0.3,
      adaptability: 0.6,
      size: 'large',
      prey: ['grass', 'oak_tree'],
      description: 'Graceful browsers that shape forest understories',
      facts: [
        'Deer have excellent hearing and can move their ears independently',
        'They can jump up to 8 feet high and 15 feet long',
        'Deer are excellent swimmers',
      ],
      sprite: {
        color: '#795548',
        shape: 'deer',
        animationType: 'walk',
      },
    });

    this.addSpecies({
      id: 'sea_turtle',
      name: 'Green Sea Turtle',
      type: 'reptile',
      trophicLevel: 2,
      preferredHabitat: 'ocean',
      maxPopulation: 15,
      growthRate: 0.08,
      mortalityRate: 0.12,
      energyNeeds: 18,
      reproductionRate: 0.1,
      adaptability: 0.4,
      size: 'large',
      prey: ['seaweed'],
      description: 'Ancient mariners that maintain healthy seagrass beds',
      facts: [
        'Sea turtles can hold their breath for up to 5 hours',
        "They navigate using Earth's magnetic field",
        'Females return to the same beach where they were born to lay eggs',
      ],
      sprite: {
        color: '#4CAF50',
        shape: 'turtle',
        animationType: 'swim',
      },
    });

    // Secondary Consumers (Carnivores)
    this.addSpecies({
      id: 'hawk',
      name: 'Red-tailed Hawk',
      type: 'bird',
      trophicLevel: 3,
      preferredHabitat: 'grassland',
      maxPopulation: 10,
      growthRate: 0.12,
      mortalityRate: 0.08,
      energyNeeds: 25,
      reproductionRate: 0.2,
      adaptability: 0.8,
      size: 'medium',
      prey: ['rabbit'],
      description: 'Keen-eyed raptors that control rodent populations',
      facts: [
        'Hawks can see 8 times better than humans',
        'They can spot a mouse from 100 feet away',
        'Hawks mate for life and return to the same territory each year',
      ],
      sprite: {
        color: '#8D4E85',
        shape: 'bird',
        animationType: 'soar',
      },
    });

    this.addSpecies({
      id: 'wolf',
      name: 'Gray Wolf',
      type: 'mammal',
      trophicLevel: 3,
      preferredHabitat: 'forest',
      maxPopulation: 8,
      growthRate: 0.1,
      mortalityRate: 0.06,
      energyNeeds: 35,
      reproductionRate: 0.15,
      adaptability: 0.9,
      size: 'large',
      prey: ['deer', 'rabbit'],
      description: 'Pack hunters that maintain healthy prey populations',
      facts: [
        'Wolves can smell prey from 1.5 miles away',
        "A wolf pack's territory can be up to 1000 square miles",
        'Wolves communicate through howls that can be heard 6 miles away',
      ],
      sprite: {
        color: '#607D8B',
        shape: 'wolf',
        animationType: 'prowl',
      },
    });

    this.addSpecies({
      id: 'shark',
      name: 'Reef Shark',
      type: 'fish',
      trophicLevel: 3,
      preferredHabitat: 'ocean',
      maxPopulation: 6,
      growthRate: 0.08,
      mortalityRate: 0.04,
      energyNeeds: 40,
      reproductionRate: 0.1,
      adaptability: 0.6,
      size: 'large',
      prey: ['sea_turtle'], // sharks hunt sea turtles in this ecosystem
      description: 'Apex predators that keep marine ecosystems balanced',
      facts: [
        'Sharks have been around for over 400 million years',
        'They can detect electrical fields from other animals',
        'Some sharks must keep swimming to breathe',
      ],
      sprite: {
        color: '#455A64',
        shape: 'shark',
        animationType: 'cruise',
      },
    });

    // Decomposers and Special Species
    this.addSpecies({
      id: 'bacteria',
      name: 'Decomposer Bacteria',
      type: 'microorganism',
      trophicLevel: 0, // Special decomposer level
      preferredHabitat: 'all',
      maxPopulation: 200,
      growthRate: 0.5,
      mortalityRate: 0.3,
      energyNeeds: 3,
      reproductionRate: 0.9,
      adaptability: 1.0,
      size: 'microscopic',
      description: 'Essential recyclers that break down organic matter',
      facts: [
        'Bacteria can double their population every 20 minutes',
        'They recycle nutrients that plants need to grow',
        'Without bacteria, dead material would pile up everywhere',
      ],
      sprite: {
        color: '#9C27B0',
        shape: 'dots',
        animationType: 'pulse',
      },
    });

    this.addSpecies({
      id: 'bee',
      name: 'Honeybee',
      type: 'insect',
      trophicLevel: 2,
      preferredHabitat: 'forest',
      maxPopulation: 80,
      growthRate: 0.3,
      mortalityRate: 0.25,
      energyNeeds: 8,
      reproductionRate: 0.6,
      adaptability: 0.5,
      size: 'tiny',
      prey: ['oak_tree'], // Actually nectar, but simplifying
      relationships: [
        { partnerId: 'oak_tree', type: 'mutualism' }, // Pollination
      ],
      description: 'Vital pollinators that help plants reproduce',
      facts: [
        'A bee visits about 5000 flowers in a day',
        'Bees communicate through dance to share flower locations',
        'One bee colony can pollinate 300 million flowers per day',
      ],
      sprite: {
        color: '#FFC107',
        shape: 'bee',
        animationType: 'buzz',
      },
    });
  }

  /**
   * Add a species to the database
   * @param {Object} speciesData - Complete species information
   */
  addSpecies(speciesData) {
    this.speciesDatabase.set(speciesData.id, speciesData);
  }

  /**
   * Get species data by ID
   * @param {string} speciesId - ID of the species
   * @returns {Object|null} Species data or null if not found
   */
  getSpecies(speciesId) {
    return this.speciesDatabase.get(speciesId) || null;
  }

  /**
   * Get all species for a specific level
   * @param {number} level - Game level
   * @returns {Array} Array of species available for the level
   */
  loadSpeciesForLevel(level) {
    const levelSpecies = {
      1: ['grass', 'rabbit', 'hawk'], // Simple food chain
      2: ['grass', 'oak_tree', 'rabbit', 'deer', 'hawk'], // Forest ecosystem
      3: ['seaweed', 'sea_turtle', 'shark'], // Marine ecosystem
      4: ['grass', 'rabbit', 'hawk', 'bacteria'], // Adding decomposers
      5: ['oak_tree', 'bee', 'rabbit', 'hawk'], // Pollination relationships
      6: ['grass', 'oak_tree', 'rabbit', 'deer', 'wolf', 'hawk'], // Complex forest
      7: ['seaweed', 'sea_turtle', 'shark', 'bacteria'], // Marine with decomposers
      8: ['grass', 'oak_tree', 'rabbit', 'deer', 'wolf', 'hawk', 'bee', 'bacteria'], // Full ecosystem
    };

    const speciesIds = levelSpecies[level] || levelSpecies[1];
    return speciesIds.map(id => this.getSpecies(id)).filter(species => species !== null);
  }

  /**
   * Get species by habitat type
   * @param {string} habitatType - Type of habitat
   * @returns {Array} Species that prefer this habitat
   */
  getSpeciesByHabitat(habitatType) {
    return Array.from(this.speciesDatabase.values()).filter(
      species => species.preferredHabitat === habitatType || species.preferredHabitat === 'all'
    );
  }

  /**
   * Get species by trophic level
   * @param {number} trophicLevel - Trophic level (1=producers, 2=primary consumers, etc.)
   * @returns {Array} Species at this trophic level
   */
  getSpeciesByTrophicLevel(trophicLevel) {
    return Array.from(this.speciesDatabase.values()).filter(
      species => species.trophicLevel === trophicLevel
    );
  }

  /**
   * Get predators of a specific species
   * @param {string} speciesId - ID of the prey species
   * @returns {Array} Species that prey on the given species
   */
  getPredators(speciesId) {
    return Array.from(this.speciesDatabase.values()).filter(
      species => species.prey && species.prey.includes(speciesId)
    );
  }

  /**
   * Get prey of a specific species
   * @param {string} speciesId - ID of the predator species
   * @returns {Array} Species that are prey to the given species
   */
  getPrey(speciesId) {
    const species = this.getSpecies(speciesId);
    if (!species || !species.prey) return [];

    return species.prey.map(preyId => this.getSpecies(preyId)).filter(prey => prey !== null);
  }

  /**
   * Check if two species have a relationship
   * @param {string} speciesId1 - First species ID
   * @param {string} speciesId2 - Second species ID
   * @returns {Object|null} Relationship data or null
   */
  getRelationship(speciesId1, speciesId2) {
    const species1 = this.getSpecies(speciesId1);
    if (!species1 || !species1.relationships) return null;

    const relationship = species1.relationships.find(rel => rel.partnerId === speciesId2);
    return relationship || null;
  }

  /**
   * Get educational content for a species
   * @param {string} speciesId - ID of the species
   * @returns {Object} Educational content including facts and description
   */
  getEducationalContent(speciesId) {
    const species = this.getSpecies(speciesId);
    if (!species) return null;

    return {
      name: species.name,
      description: species.description,
      facts: species.facts || [],
      habitat: species.preferredHabitat,
      role: this.getTrophicLevelDescription(species.trophicLevel),
      relationships: this.getSpeciesRelationships(speciesId),
    };
  }

  /**
   * Get description of trophic level
   * @param {number} trophicLevel - Trophic level number
   * @returns {string} Description of the trophic level
   */
  getTrophicLevelDescription(trophicLevel) {
    const descriptions = {
      0: 'Decomposer - Breaks down dead organic matter',
      1: 'Producer - Makes food from sunlight and nutrients',
      2: 'Primary Consumer - Eats plants and producers',
      3: 'Secondary Consumer - Eats primary consumers',
      4: 'Tertiary Consumer - Top predator in the food chain',
    };

    return descriptions[trophicLevel] || 'Unknown role';
  }

  /**
   * Get all relationships for a species
   * @param {string} speciesId - ID of the species
   * @returns {Array} Array of relationship descriptions
   */
  getSpeciesRelationships(speciesId) {
    const relationships = [];

    // Predator-prey relationships
    const prey = this.getPrey(speciesId);
    if (prey.length > 0) {
      relationships.push({
        type: 'predation',
        description: `Eats: ${prey.map(p => p.name).join(', ')}`,
      });
    }

    const predators = this.getPredators(speciesId);
    if (predators.length > 0) {
      relationships.push({
        type: 'prey',
        description: `Eaten by: ${predators.map(p => p.name).join(', ')}`,
      });
    }

    // Symbiotic relationships
    const species = this.getSpecies(speciesId);
    if (species && species.relationships) {
      for (const rel of species.relationships) {
        const partner = this.getSpecies(rel.partnerId);
        if (partner) {
          relationships.push({
            type: rel.type,
            description: `${rel.type.charAt(0).toUpperCase() + rel.type.slice(1)} with ${partner.name}`,
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Generate a random species discovery fact
   * @param {string} speciesId - ID of the species
   * @returns {string} Random educational fact
   */
  getRandomFact(speciesId) {
    const species = this.getSpecies(speciesId);
    if (!species || !species.facts || species.facts.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * species.facts.length);
    return species.facts[randomIndex];
  }

  /**
   * Check if species combination creates a stable ecosystem
   * @param {Array} speciesIds - Array of species IDs
   * @returns {Object} Analysis of ecosystem stability
   */
  analyzeEcosystemStability(speciesIds) {
    const species = speciesIds.map(id => this.getSpecies(id)).filter(s => s !== null);

    const analysis = {
      isStable: true,
      warnings: [],
      suggestions: [],
      missingRoles: [],
    };

    // Check for producers
    const producers = species.filter(s => s.trophicLevel === 1);
    if (producers.length === 0) {
      analysis.isStable = false;
      analysis.missingRoles.push('producers');
      analysis.warnings.push('No producers found - ecosystem needs plants to make food');
    }

    // Check for decomposers
    const decomposers = species.filter(s => s.trophicLevel === 0);
    if (decomposers.length === 0) {
      analysis.suggestions.push('Add decomposers to recycle nutrients');
    }

    // Check food chains
    const consumers = species.filter(s => s.trophicLevel > 1);
    for (const consumer of consumers) {
      const availablePrey = consumer.prey?.filter(preyId => speciesIds.includes(preyId)) || [];
      if (consumer.prey && availablePrey.length === 0) {
        analysis.isStable = false;
        analysis.warnings.push(`${consumer.name} has no available food sources`);
      }
    }

    // Check for biodiversity
    if (species.length < 3) {
      analysis.suggestions.push('Add more species to increase biodiversity');
    }

    return analysis;
  }
}
