/**
 * HabitatBuilder - Manages habitat creation and environmental setup
 * Handles biome selection, environmental factors, and habitat customization
 */
export default class HabitatBuilder {
  constructor(uiConfig) {
    this.config = uiConfig;
    this.availableHabitats = new Map();
    this.currentHabitat = null;
    this.habitatComponents = [];

    this.loadHabitatData();
  }

  /**
   * Load all available habitat types and their properties
   */
  loadHabitatData() {
    // Grassland/Prairie Habitat
    this.addHabitat({
      id: 'grassland',
      name: 'Prairie Grassland',
      description: 'Wide open spaces with grasses and wildflowers',
      climate: 'temperate',
      difficulty: 1,
      unlockLevel: 1,
      baseEnvironment: {
        temperature: 18,
        humidity: 45,
        rainfall: 'moderate',
        windSpeed: 15,
      },
      suitability: 0.9,
      effects: {
        temperature: 0,
        humidity: -5,
        windExposure: 2,
      },
      components: [
        // Visual/interactive elements for this habitat
        {
          type: 'terrain',
          subtype: 'grass_field',
          coverage: 0.8,
          color: '#8BC34A',
          texture: 'grass-pattern',
        },
        {
          type: 'terrain',
          subtype: 'wildflowers',
          coverage: 0.2,
          color: '#FF9800',
          texture: 'flower-dots',
        },
        {
          type: 'weather',
          subtype: 'gentle_breeze',
          intensity: 0.3,
        },
      ],
      compatibleSpecies: ['grass', 'rabbit', 'hawk', 'bacteria'],
      educationalNotes: [
        'Grasslands are some of the most productive ecosystems on Earth',
        'Prairie grass roots can extend 15 feet underground',
        'Grasslands support large grazing animals and their predators',
      ],
    });

    // Forest Habitat
    this.addHabitat({
      id: 'forest',
      name: 'Deciduous Forest',
      description: 'Dense woodland with towering trees and forest floor life',
      climate: 'temperate',
      difficulty: 2,
      unlockLevel: 2,
      baseEnvironment: {
        temperature: 15,
        humidity: 65,
        rainfall: 'high',
        windSpeed: 5,
      },
      suitability: 0.8,
      effects: {
        temperature: -3,
        humidity: 15,
        windExposure: -3,
      },
      components: [
        {
          type: 'terrain',
          subtype: 'tree_canopy',
          coverage: 0.6,
          color: '#4CAF50',
          texture: 'tree-pattern',
          height: 3, // Visual layers
        },
        {
          type: 'terrain',
          subtype: 'forest_floor',
          coverage: 1.0,
          color: '#8D6E63',
          texture: 'leaf-litter',
        },
        {
          type: 'atmosphere',
          subtype: 'dappled_sunlight',
          intensity: 0.7,
        },
      ],
      compatibleSpecies: ['oak_tree', 'deer', 'wolf', 'bee', 'bacteria'],
      educationalNotes: [
        'Forests create their own weather patterns',
        'A single tree can support hundreds of species',
        'Forest soil is rich with decomposing organic matter',
      ],
    });

    // Ocean/Marine Habitat
    this.addHabitat({
      id: 'ocean',
      name: 'Coastal Ocean',
      description: 'Deep blue waters with coral reefs and kelp forests',
      climate: 'marine',
      difficulty: 3,
      unlockLevel: 3,
      baseEnvironment: {
        temperature: 22,
        humidity: 85,
        salinity: 35, // Parts per thousand
        currentStrength: 2,
      },
      suitability: 0.7,
      effects: {
        temperature: 5,
        humidity: 20,
        pressure: 1, // Ocean pressure
      },
      components: [
        {
          type: 'water',
          subtype: 'open_ocean',
          coverage: 1.0,
          color: '#2196F3',
          texture: 'water-waves',
          depth: 4,
        },
        {
          type: 'terrain',
          subtype: 'kelp_forest',
          coverage: 0.3,
          color: '#4CAF50',
          texture: 'kelp-sway',
        },
        {
          type: 'terrain',
          subtype: 'coral_reef',
          coverage: 0.2,
          color: '#FF7043',
          texture: 'coral-pattern',
        },
        {
          type: 'atmosphere',
          subtype: 'underwater_light',
          intensity: 0.6,
        },
      ],
      compatibleSpecies: ['seaweed', 'sea_turtle', 'shark', 'bacteria'],
      educationalNotes: [
        "Oceans cover 71% of Earth's surface",
        'Marine ecosystems produce most of our oxygen',
        'Ocean currents distribute heat around the planet',
      ],
    });

    // Desert Habitat (Advanced)
    this.addHabitat({
      id: 'desert',
      name: 'Arid Desert',
      description: 'Harsh, dry landscape with specialized desert life',
      climate: 'arid',
      difficulty: 4,
      unlockLevel: 5,
      baseEnvironment: {
        temperature: 35,
        humidity: 15,
        rainfall: 'very_low',
        windSpeed: 20,
      },
      suitability: 0.4,
      effects: {
        temperature: 15,
        humidity: -30,
        waterAvailability: -0.7,
      },
      components: [
        {
          type: 'terrain',
          subtype: 'sand_dunes',
          coverage: 0.7,
          color: '#FFC107',
          texture: 'sand-pattern',
        },
        {
          type: 'terrain',
          subtype: 'rock_formations',
          coverage: 0.2,
          color: '#795548',
          texture: 'rock-pattern',
        },
        {
          type: 'vegetation',
          subtype: 'cacti',
          coverage: 0.1,
          color: '#4CAF50',
          texture: 'cactus-pattern',
        },
        {
          type: 'weather',
          subtype: 'heat_shimmer',
          intensity: 0.8,
        },
      ],
      compatibleSpecies: ['desert_grass', 'lizard', 'hawk'], // Would need desert species
      educationalNotes: [
        'Desert plants store water in special tissues',
        'Many desert animals are nocturnal to avoid heat',
        'Deserts can be hot or cold - the key is low rainfall',
      ],
    });

    // Arctic/Tundra Habitat (Advanced)
    this.addHabitat({
      id: 'arctic',
      name: 'Arctic Tundra',
      description: 'Frozen landscape with hardy cold-adapted species',
      climate: 'arctic',
      difficulty: 5,
      unlockLevel: 7,
      baseEnvironment: {
        temperature: -10,
        humidity: 30,
        daylight: 0.3, // Long winter nights
        windSpeed: 25,
      },
      suitability: 0.3,
      effects: {
        temperature: -25,
        humidity: -20,
        growingSeason: -0.8,
      },
      components: [
        {
          type: 'terrain',
          subtype: 'permafrost',
          coverage: 1.0,
          color: '#E3F2FD',
          texture: 'ice-pattern',
        },
        {
          type: 'vegetation',
          subtype: 'tundra_moss',
          coverage: 0.3,
          color: '#8BC34A',
          texture: 'moss-pattern',
        },
        {
          type: 'weather',
          subtype: 'aurora',
          intensity: 0.2,
          special: true,
        },
      ],
      compatibleSpecies: ['arctic_moss', 'caribou', 'polar_bear'], // Would need arctic species
      educationalNotes: [
        'Permafrost stores huge amounts of carbon',
        'Arctic animals have special adaptations for cold',
        'The Arctic is warming twice as fast as the rest of the planet',
      ],
    });
  }

  /**
   * Add a habitat type to the available options
   * @param {Object} habitatData - Complete habitat information
   */
  addHabitat(habitatData) {
    this.availableHabitats.set(habitatData.id, habitatData);
  }

  /**
   * Get available habitats for a specific level
   * @param {number} level - Current game level
   * @returns {Array} Array of available habitat types
   */
  loadLevel(level) {
    return Array.from(this.availableHabitats.values())
      .filter(habitat => habitat.unlockLevel <= level)
      .sort((a, b) => a.difficulty - b.difficulty);
  }

  /**
   * Select a habitat type for the current ecosystem
   * @param {string} habitatId - ID of the habitat to select
   * @returns {boolean} Success status
   */
  selectHabitat(habitatId) {
    const habitat = this.availableHabitats.get(habitatId);
    if (!habitat) return false;

    this.currentHabitat = { ...habitat };
    this.habitatComponents = [...habitat.components];

    return true;
  }

  /**
   * Get the currently selected habitat
   * @returns {Object|null} Current habitat data
   */
  getCurrentHabitat() {
    return this.currentHabitat;
  }

  /**
   * Customize habitat with additional components
   * @param {Object} component - Component to add
   */
  addComponent(component) {
    this.habitatComponents.push(component);

    // Update habitat effects based on new component
    if (component.effects) {
      for (const [effect, value] of Object.entries(component.effects)) {
        if (this.currentHabitat.effects[effect] !== undefined) {
          this.currentHabitat.effects[effect] += value;
        }
      }
    }
  }

  /**
   * Remove a component from the habitat
   * @param {number} componentIndex - Index of component to remove
   */
  removeComponent(componentIndex) {
    if (componentIndex >= 0 && componentIndex < this.habitatComponents.length) {
      const component = this.habitatComponents[componentIndex];

      // Reverse the effects of this component
      if (component.effects) {
        for (const [effect, value] of Object.entries(component.effects)) {
          if (this.currentHabitat.effects[effect] !== undefined) {
            this.currentHabitat.effects[effect] -= value;
          }
        }
      }

      this.habitatComponents.splice(componentIndex, 1);
    }
  }

  /**
   * Calculate habitat suitability for a species
   * @param {Object} species - Species data
   * @returns {number} Suitability score (0-1)
   */
  calculateSuitability(species) {
    if (!this.currentHabitat) return 0;

    // Base suitability for habitat type
    let suitability = species.preferredHabitat === this.currentHabitat.id ? 0.9 : 0.3;

    // Environmental factor adjustments
    const environment = this.getEffectiveEnvironment();

    // Temperature tolerance (assuming species have optimal ranges)
    const tempOptimal = this.getSpeciesOptimalTemp(species);
    const tempDiff = Math.abs(environment.temperature - tempOptimal);
    suitability *= Math.max(0.2, 1 - tempDiff / 20); // Reduce by temp difference

    // Humidity tolerance
    const humidityOptimal = this.getSpeciesOptimalHumidity(species);
    const humidityDiff = Math.abs(environment.humidity - humidityOptimal);
    suitability *= Math.max(0.2, 1 - humidityDiff / 50);

    // Special habitat requirements
    if (species.type === 'fish' && this.currentHabitat.id !== 'ocean') {
      suitability *= 0.1; // Fish need water
    }

    return Math.max(0, Math.min(1, suitability));
  }

  /**
   * Get effective environment including all modifications
   * @returns {Object} Complete environmental parameters
   */
  getEffectiveEnvironment() {
    if (!this.currentHabitat) return {};

    const environment = { ...this.currentHabitat.baseEnvironment };
    const effects = this.currentHabitat.effects;

    // Apply habitat effects
    if (effects.temperature) environment.temperature += effects.temperature;
    if (effects.humidity) environment.humidity += effects.humidity;

    // Apply component effects
    for (const component of this.habitatComponents) {
      if (component.effects) {
        for (const [effect, value] of Object.entries(component.effects)) {
          if (environment[effect] !== undefined) {
            environment[effect] += value;
          }
        }
      }
    }

    return environment;
  }

  /**
   * Get visual rendering data for the habitat
   * @returns {Array} Array of renderable components
   */
  getRenderingData() {
    return this.habitatComponents.map(component => ({
      ...component,
      // Add any runtime properties for rendering
      opacity: component.opacity || 1.0,
      animationPhase: Math.random() * Math.PI * 2, // Random starting animation phase
      zIndex: this.getComponentZIndex(component),
    }));
  }

  /**
   * Get appropriate z-index for rendering layers
   * @param {Object} component - Component to get z-index for
   * @returns {number} Z-index value
   */
  getComponentZIndex(component) {
    const zIndexMap = {
      terrain: 1,
      water: 1,
      vegetation: 2,
      atmosphere: 5,
      weather: 6,
      particles: 7,
    };

    return zIndexMap[component.type] || 3;
  }

  /**
   * Check if habitat setup is complete and valid
   * @returns {Object} Validation result
   */
  validateHabitat() {
    const validation = {
      isValid: true,
      warnings: [],
      suggestions: [],
    };

    if (!this.currentHabitat) {
      validation.isValid = false;
      validation.warnings.push('No habitat selected');
      return validation;
    }

    // Check for minimum components
    const terrainComponents = this.habitatComponents.filter(c => c.type === 'terrain');
    if (terrainComponents.length === 0) {
      validation.warnings.push('Habitat needs terrain foundation');
    }

    // Check environmental extremes
    const environment = this.getEffectiveEnvironment();
    if (environment.temperature < -30 || environment.temperature > 50) {
      validation.warnings.push('Extreme temperatures may limit species survival');
    }

    if (environment.humidity < 10 || environment.humidity > 95) {
      validation.warnings.push('Extreme humidity levels detected');
    }

    // Suggestions for improvement
    const atmosphereComponents = this.habitatComponents.filter(c => c.type === 'atmosphere');
    if (atmosphereComponents.length === 0) {
      validation.suggestions.push('Add atmospheric effects for visual appeal');
    }

    return validation;
  }

  /**
   * Get educational content about the current habitat
   * @returns {Object} Educational information
   */
  getEducationalContent() {
    if (!this.currentHabitat) return null;

    return {
      name: this.currentHabitat.name,
      description: this.currentHabitat.description,
      climate: this.currentHabitat.climate,
      environment: this.getEffectiveEnvironment(),
      notes: this.currentHabitat.educationalNotes,
      compatibleSpecies: this.currentHabitat.compatibleSpecies,
      uniqueFeatures: this.getUniqueFeatures(),
    };
  }

  /**
   * Get unique features of the current habitat setup
   * @returns {Array} Array of unique feature descriptions
   */
  getUniqueFeatures() {
    const features = [];

    if (!this.currentHabitat) return features;

    // Check for special components
    const specialComponents = this.habitatComponents.filter(c => c.special);
    for (const component of specialComponents) {
      features.push(`Features ${component.subtype.replace('_', ' ')}`);
    }

    // Environmental extremes
    const environment = this.getEffectiveEnvironment();
    if (environment.temperature > 30) {
      features.push('High temperature environment');
    } else if (environment.temperature < 5) {
      features.push('Cold climate conditions');
    }

    if (environment.humidity > 80) {
      features.push('High humidity environment');
    } else if (environment.humidity < 25) {
      features.push('Arid conditions');
    }

    return features;
  }

  /**
   * Reset habitat builder to initial state
   */
  reset() {
    this.currentHabitat = null;
    this.habitatComponents = [];
  }

  /**
   * Get optimal temperature for a species (simplified)
   * @param {Object} species - Species data
   * @returns {number} Optimal temperature in Celsius
   */
  getSpeciesOptimalTemp(species) {
    const tempMap = {
      grassland: 18,
      forest: 15,
      ocean: 22,
      desert: 35,
      arctic: -10,
    };

    return tempMap[species.preferredHabitat] || 20;
  }

  /**
   * Get optimal humidity for a species (simplified)
   * @param {Object} species - Species data
   * @returns {number} Optimal humidity percentage
   */
  getSpeciesOptimalHumidity(species) {
    const humidityMap = {
      grassland: 45,
      forest: 65,
      ocean: 85,
      desert: 15,
      arctic: 30,
    };

    return humidityMap[species.preferredHabitat] || 50;
  }
}
