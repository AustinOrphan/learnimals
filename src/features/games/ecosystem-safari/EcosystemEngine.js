/**
 * EcosystemEngine - Core simulation engine for ecosystem dynamics
 * Handles population dynamics, food webs, environmental factors, and ecosystem health
 */
export default class EcosystemEngine {
  constructor(worldConfig) {
    this.config = worldConfig;

    // Ecosystem state
    this.ecosystemData = {
      temperature: 20, // Celsius
      humidity: 50, // Percentage
      oxygenLevel: 21, // Percentage
      biodiversityIndex: 0,
      carryingCapacity: 100,
      totalPopulation: 0,
    };

    // Species populations and relationships
    this.populations = new Map(); // speciesId -> population data
    this.foodWeb = new Map(); // speciesId -> [prey species ids]
    this.relationships = new Map(); // speciesId -> relationship effects

    // Environmental factors
    this.climateFactor = 1.0;
    this.pollutionLevel = 0;
    this.habitatSuitability = new Map(); // habitatType -> suitability score

    // Simulation parameters
    this.simulationSpeed = 1.0;
    this.updateCounter = 0;

    this.reset();
  }

  /**
   * Reset ecosystem to initial state
   */
  reset() {
    this.populations.clear();
    this.foodWeb.clear();
    this.relationships.clear();

    this.ecosystemData = {
      temperature: 20,
      humidity: 50,
      oxygenLevel: 21,
      biodiversityIndex: 0,
      carryingCapacity: 100,
      totalPopulation: 0,
    };

    this.pollutionLevel = 0;
    this.climateFactor = 1.0;
    this.updateCounter = 0;
  }

  /**
   * Add a species to the ecosystem
   * @param {Object} species - Species data
   * @param {number} initialPopulation - Starting population size
   */
  addSpecies(species, initialPopulation = 10) {
    const populationData = {
      id: species.id,
      name: species.name,
      currentPopulation: initialPopulation,
      maxPopulation: species.maxPopulation || 50,
      growthRate: species.growthRate || 0.1,
      mortalityRate: species.mortalityRate || 0.05,
      energyNeeds: species.energyNeeds || 10,
      preferredHabitat: species.preferredHabitat,
      trophicLevel: species.trophicLevel || 1, // 1=producer, 2=primary consumer, etc.
      adaptability: species.adaptability || 0.5,
      reproductionRate: species.reproductionRate || 0.2,
      lastUpdate: Date.now(),
      healthFactor: 1.0,
      stressFactor: 0.0,
    };

    this.populations.set(species.id, populationData);

    // Initialize food web relationships
    if (species.prey && species.prey.length > 0) {
      this.foodWeb.set(species.id, species.prey);
    }

    // Initialize symbiotic relationships
    if (species.relationships) {
      this.relationships.set(species.id, species.relationships);
    }

    this.updateBiodiversityIndex();
  }

  /**
   * Remove a species from the ecosystem
   * @param {string} speciesId - ID of species to remove
   */
  removeSpecies(speciesId) {
    this.populations.delete(speciesId);
    this.foodWeb.delete(speciesId);
    this.relationships.delete(speciesId);

    // Remove this species from other species' prey lists
    for (const [id, preyList] of this.foodWeb) {
      const filteredPrey = preyList.filter(prey => prey !== speciesId);
      if (filteredPrey.length !== preyList.length) {
        this.foodWeb.set(id, filteredPrey);
      }
    }

    this.updateBiodiversityIndex();
  }

  /**
   * Update ecosystem simulation
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    this.updateCounter++;

    // Update environmental factors
    this.updateEnvironmentalFactors();

    // Update species populations
    this.updatePopulations(deltaTime);

    // Update predator-prey relationships
    this.updateFoodWebDynamics();

    // Update symbiotic relationships
    this.updateSymbioticRelationships();

    // Calculate ecosystem health
    this.calculateEcosystemHealth();

    // Check for extinctions and explosions
    this.checkPopulationEvents();
  }

  /**
   * Update environmental factors based on current ecosystem state
   */
  updateEnvironmentalFactors() {
    // Calculate total population
    this.ecosystemData.totalPopulation = Array.from(this.populations.values()).reduce(
      (total, pop) => total + pop.currentPopulation,
      0
    );

    // Update oxygen level based on producer populations
    const producers = Array.from(this.populations.values()).filter(pop => pop.trophicLevel === 1);

    const totalProducers = producers.reduce((total, pop) => total + pop.currentPopulation, 0);
    const oxygenContribution = Math.min(totalProducers * 0.1, 10);
    this.ecosystemData.oxygenLevel = Math.max(
      15,
      Math.min(25, 21 + oxygenContribution - this.pollutionLevel)
    );

    // Update carrying capacity based on habitat suitability
    const avgSuitability =
      Array.from(this.habitatSuitability.values()).reduce((sum, val) => sum + val, 0) /
      Math.max(1, this.habitatSuitability.size);

    this.ecosystemData.carryingCapacity = Math.floor(100 * avgSuitability * this.climateFactor);
  }

  /**
   * Update species populations using logistic growth model
   */
  updatePopulations(deltaTime) {
    const dt = deltaTime / 1000; // Convert to seconds

    for (const [speciesId, population] of this.populations) {
      // Calculate growth factors
      const carryingCapacityFactor = this.calculateCarryingCapacityFactor(population);
      const environmentalStress = this.calculateEnvironmentalStress(population);
      const foodAvailability = this.calculateFoodAvailability(speciesId);

      // Logistic growth with environmental factors
      const effectiveGrowthRate =
        population.growthRate *
        carryingCapacityFactor *
        (1 - environmentalStress) *
        foodAvailability *
        this.climateFactor;

      const mortalityFactor = population.mortalityRate * (1 + environmentalStress);

      // Population change
      const populationChange =
        (effectiveGrowthRate - mortalityFactor) * population.currentPopulation * dt;

      // Update population
      population.currentPopulation = Math.max(
        0,
        Math.min(population.maxPopulation, population.currentPopulation + populationChange)
      );

      // Update health and stress factors
      population.healthFactor = Math.max(0.1, 1 - environmentalStress);
      population.stressFactor = environmentalStress;

      population.lastUpdate = Date.now();
    }
  }

  /**
   * Calculate carrying capacity factor for a species
   */
  calculateCarryingCapacityFactor(_population) {
    const totalPop = this.ecosystemData.totalPopulation;
    const capacity = this.ecosystemData.carryingCapacity;

    if (totalPop >= capacity) {
      return Math.max(0.1, 1 - (totalPop - capacity) / capacity);
    }
    return 1.0;
  }

  /**
   * Calculate environmental stress for a species
   */
  calculateEnvironmentalStress(population) {
    let stress = 0;

    // Temperature stress
    const tempOptimal = 20; // Assume most species prefer 20°C
    const tempDiff = Math.abs(this.ecosystemData.temperature - tempOptimal);
    stress += Math.min(0.5, tempDiff / 20);

    // Oxygen stress
    if (this.ecosystemData.oxygenLevel < 18) {
      stress += 0.3;
    }

    // Pollution stress
    stress += this.pollutionLevel * 0.1;

    // Habitat suitability
    const habitatSuitability = this.habitatSuitability.get(population.preferredHabitat) || 0.5;
    stress += (1 - habitatSuitability) * 0.2;

    return Math.min(1.0, stress);
  }

  /**
   * Calculate food availability for a species
   */
  calculateFoodAvailability(speciesId) {
    const preyList = this.foodWeb.get(speciesId);

    if (!preyList || preyList.length === 0) {
      // Primary producers - availability based on environmental conditions
      return Math.min(1.0, (this.ecosystemData.oxygenLevel / 21) * this.climateFactor);
    }

    // Calculate total available prey
    let totalPrey = 0;
    for (const preyId of preyList) {
      const preyPopulation = this.populations.get(preyId);
      if (preyPopulation) {
        totalPrey += preyPopulation.currentPopulation;
      }
    }

    // Food availability as a ratio of prey to predator needs
    const predatorPopulation = this.populations.get(speciesId);
    const foodNeeded = predatorPopulation.currentPopulation * predatorPopulation.energyNeeds;

    return Math.min(1.0, totalPrey / Math.max(1, foodNeeded));
  }

  /**
   * Update predator-prey dynamics
   */
  updateFoodWebDynamics() {
    for (const [predatorId, preyList] of this.foodWeb) {
      const predator = this.populations.get(predatorId);
      if (!predator || predator.currentPopulation === 0) continue;

      const huntingSuccess = 0.1; // 10% hunting success rate
      const totalHunted = predator.currentPopulation * huntingSuccess;

      // Distribute hunting pressure across prey species
      for (const preyId of preyList) {
        const prey = this.populations.get(preyId);
        if (!prey) continue;

        const huntedFromThisPrey = totalHunted / preyList.length;
        prey.currentPopulation = Math.max(0, prey.currentPopulation - huntedFromThisPrey);
      }
    }
  }

  /**
   * Update symbiotic relationships (mutualism, commensalism, parasitism)
   */
  updateSymbioticRelationships() {
    for (const [speciesId, relationships] of this.relationships) {
      const species = this.populations.get(speciesId);
      if (!species) continue;

      for (const relationship of relationships) {
        const partnerSpecies = this.populations.get(relationship.partnerId);
        if (!partnerSpecies) continue;

        switch (relationship.type) {
        case 'mutualism':
          // Both species benefit
          species.healthFactor = Math.min(1.2, species.healthFactor + 0.1);
          partnerSpecies.healthFactor = Math.min(1.2, partnerSpecies.healthFactor + 0.1);
          break;

        case 'commensalism':
          // One benefits, other neutral
          species.healthFactor = Math.min(1.2, species.healthFactor + 0.05);
          break;

        case 'parasitism':
          // One benefits, other harmed
          species.healthFactor = Math.min(1.2, species.healthFactor + 0.05);
          partnerSpecies.healthFactor = Math.max(0.5, partnerSpecies.healthFactor - 0.1);
          break;
        }
      }
    }
  }

  /**
   * Calculate overall ecosystem health score
   */
  calculateEcosystemHealth() {
    if (this.populations.size === 0) {
      this.ecosystemData.biodiversityIndex = 0;
      return 0;
    }

    // Biodiversity component (30%)
    const biodiversityScore = Math.min(1.0, this.ecosystemData.biodiversityIndex / 3.0);

    // Population stability component (25%)
    const avgHealthFactor =
      Array.from(this.populations.values()).reduce((sum, pop) => sum + pop.healthFactor, 0) /
      this.populations.size;

    // Environmental quality component (25%)
    const environmentalScore =
      ((this.ecosystemData.oxygenLevel - 15) / 10 + // Normalize oxygen (15-25)
        (1 - this.pollutionLevel) + // Inverse pollution
        this.climateFactor) /
      3;

    // Food web stability component (20%)
    const foodWebScore = this.calculateFoodWebStability();

    const overallHealth =
      (biodiversityScore * 0.3 +
        avgHealthFactor * 0.25 +
        environmentalScore * 0.25 +
        foodWebScore * 0.2) *
      100;

    return Math.max(0, Math.min(100, overallHealth));
  }

  /**
   * Calculate food web stability
   */
  calculateFoodWebStability() {
    let stability = 1.0;

    // Check for missing links in food chain
    for (const [_predatorId, preyList] of this.foodWeb) {
      const availablePrey = preyList.filter(preyId => {
        const prey = this.populations.get(preyId);
        return prey && prey.currentPopulation > 0;
      });

      if (availablePrey.length === 0 && preyList.length > 0) {
        stability -= 0.2; // Predator with no prey reduces stability
      }
    }

    return Math.max(0, stability);
  }

  /**
   * Update biodiversity index (Shannon diversity)
   */
  updateBiodiversityIndex() {
    const totalPop = Array.from(this.populations.values()).reduce(
      (sum, pop) => sum + pop.currentPopulation,
      0
    );

    if (totalPop === 0) {
      this.ecosystemData.biodiversityIndex = 0;
      return;
    }

    let diversity = 0;
    for (const population of this.populations.values()) {
      if (population.currentPopulation > 0) {
        const proportion = population.currentPopulation / totalPop;
        diversity -= proportion * Math.log(proportion);
      }
    }

    this.ecosystemData.biodiversityIndex = diversity;
  }

  /**
   * Check for population events (extinctions, population explosions)
   */
  checkPopulationEvents() {
    const events = [];

    for (const [speciesId, population] of this.populations) {
      // Check for extinction
      if (population.currentPopulation < 1 && population.currentPopulation > 0) {
        events.push({
          type: 'extinction',
          speciesId: speciesId,
          speciesName: population.name,
        });
        population.currentPopulation = 0;
      }

      // Check for population explosion
      if (population.currentPopulation > population.maxPopulation * 0.9) {
        events.push({
          type: 'population_boom',
          speciesId: speciesId,
          speciesName: population.name,
          population: Math.floor(population.currentPopulation),
        });
      }

      // Check for population crash
      if (
        population.currentPopulation < population.maxPopulation * 0.1 &&
        population.currentPopulation > 0
      ) {
        events.push({
          type: 'population_crash',
          speciesId: speciesId,
          speciesName: population.name,
          population: Math.floor(population.currentPopulation),
        });
      }
    }

    return events;
  }

  /**
   * Add a habitat to the ecosystem
   * @param {Object} habitat - Habitat data
   */
  addHabitat(habitat) {
    this.habitatSuitability.set(habitat.type, habitat.suitability || 0.8);

    // Habitat affects environmental factors
    if (habitat.effects) {
      if (habitat.effects.temperature) {
        this.ecosystemData.temperature += habitat.effects.temperature;
      }
      if (habitat.effects.humidity) {
        this.ecosystemData.humidity += habitat.effects.humidity;
      }
    }
  }

  /**
   * Apply an environmental challenge
   * @param {Object} challenge - Challenge parameters
   */
  applyChallenge(challenge) {
    switch (challenge.type) {
    case 'drought':
      this.ecosystemData.humidity = Math.max(10, this.ecosystemData.humidity - 30);
      this.climateFactor = 0.7;
      break;

    case 'flood':
      this.ecosystemData.humidity = 100;
      this.climateFactor = 0.8;
      break;

    case 'pollution':
      this.pollutionLevel = Math.min(1.0, this.pollutionLevel + 0.3);
      break;

    case 'climate_change':
      this.ecosystemData.temperature += challenge.temperatureChange || 2;
      this.climateFactor = 0.9;
      break;

    case 'disease':
      // Affect specific species or all species
      const targetSpecies = challenge.targetSpecies || Array.from(this.populations.keys());
      for (const speciesId of targetSpecies) {
        const population = this.populations.get(speciesId);
        if (population) {
          population.currentPopulation *= 0.7; // 30% mortality
          population.healthFactor = 0.5;
        }
      }
      break;
    }
  }

  /**
   * Get current ecosystem state for display
   */
  getEcosystemState() {
    return {
      ...this.ecosystemData,
      health: this.calculateEcosystemHealth(),
      populations: Array.from(this.populations.values()),
      relationships: Array.from(this.foodWeb.entries()),
      environmentalFactors: {
        climateFactor: this.climateFactor,
        pollutionLevel: this.pollutionLevel,
        habitatSuitability: Array.from(this.habitatSuitability.entries()),
      },
    };
  }
}
