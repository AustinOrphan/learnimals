/**
 * DiscoveryJournal - Manages educational content and player discoveries
 * Tracks learning progress and provides contextual educational information
 */
export default class DiscoveryJournal {
  constructor() {
    this.discoveries = new Map(); // discoveryId -> discovery data
    this.unlockedContent = new Set();
    this.playerProgress = {
      totalDiscoveries: 0,
      ecosystemsExplored: new Set(),
      speciesEncountered: new Set(),
      conceptsLearned: new Set(),
      experimentsCompleted: new Set(),
    };

    this.educationalContent = new Map();
    this.loadEducationalContent();
  }

  /**
   * Load all educational content and discoveries
   */
  loadEducationalContent() {
    // Food Web Concepts
    this.addEducationalContent({
      id: 'food_chains',
      title: 'Food Chains and Energy Flow',
      category: 'ecology',
      level: 'beginner',
      unlockTrigger: 'first_predator_prey',
      content: {
        summary: 'Energy flows through ecosystems in food chains, from producers to consumers.',
        details: [
          'Producers (plants) capture energy from the sun',
          'Primary consumers (herbivores) eat producers',
          'Secondary consumers (carnivores) eat primary consumers',
          'Each level transfers only about 10% of energy to the next',
        ],
        visualConcepts: [
          'arrows showing energy flow direction',
          'pyramid showing energy loss at each level',
          'sun as ultimate energy source',
        ],
        experiments: [
          'Remove a predator and watch prey population grow',
          'Remove producers and watch the whole system collapse',
          'Add more producers and see increased consumer populations',
        ],
      },
    });

    this.addEducationalContent({
      id: 'biodiversity',
      title: 'Biodiversity and Ecosystem Stability',
      category: 'ecology',
      level: 'intermediate',
      unlockTrigger: 'species_diversity_5',
      content: {
        summary: 'More diverse ecosystems are generally more stable and resilient.',
        details: [
          'Biodiversity includes species, genetic, and ecosystem diversity',
          'More species means more connections and stability',
          'Redundancy in roles helps ecosystems survive disruptions',
          'Keystone species have outsized impacts on ecosystem health',
        ],
        visualConcepts: [
          'web diagram showing species connections',
          'stability comparison between simple and complex systems',
          'resilience after disturbance events',
        ],
        experiments: [
          'Compare simple 3-species vs complex 8-species ecosystems',
          'Remove keystone species and observe cascading effects',
          'Test recovery after environmental challenges',
        ],
      },
    });

    // Symbiosis and Relationships
    this.addEducationalContent({
      id: 'symbiosis',
      title: 'Symbiotic Relationships',
      category: 'relationships',
      level: 'intermediate',
      unlockTrigger: 'first_mutualism',
      content: {
        summary: 'Different species can help, harm, or ignore each other in various relationships.',
        details: [
          'Mutualism: Both species benefit (bees and flowers)',
          'Commensalism: One benefits, other unaffected (birds nesting in trees)',
          'Parasitism: One benefits, other is harmed (ticks on mammals)',
          'Competition: Both species compete for same resources',
        ],
        visualConcepts: [
          'relationship symbols and arrows',
          'benefit/harm indicators for each species',
          'examples from different ecosystems',
        ],
        experiments: [
          'Add pollinators to see plant reproduction increase',
          'Observe competition when resources are limited',
          'Remove mutualistic partners and watch effects',
        ],
      },
    });

    // Environmental Factors
    this.addEducationalContent({
      id: 'limiting_factors',
      title: 'Limiting Factors in Ecosystems',
      category: 'environment',
      level: 'intermediate',
      unlockTrigger: 'population_crash',
      content: {
        summary: 'Environmental factors limit how many organisms can survive in an ecosystem.',
        details: [
          'Carrying capacity is the maximum population size an environment can support',
          'Limiting factors include food, water, shelter, and space',
          'Density-dependent factors affect populations differently as they grow',
          'Density-independent factors affect all individuals equally',
        ],
        visualConcepts: [
          'population growth curves showing carrying capacity',
          'resource availability over time',
          'competition intensifying with population growth',
        ],
        experiments: [
          'Watch populations stabilize at carrying capacity',
          'Reduce habitat size and see population limits',
          'Add resources and observe increased capacity',
        ],
      },
    });

    // Climate and Adaptation
    this.addEducationalContent({
      id: 'adaptation',
      title: 'Adaptation and Survival',
      category: 'evolution',
      level: 'advanced',
      unlockTrigger: 'environmental_challenge',
      content: {
        summary: 'Species develop traits that help them survive in their specific environments.',
        details: [
          'Physical adaptations help with survival (thick fur, sharp claws)',
          'Behavioral adaptations help with finding resources (migration, hunting)',
          'Physiological adaptations help with body functions (water retention)',
          'Adaptations take many generations to develop',
        ],
        visualConcepts: [
          'before/after comparisons showing adaptations',
          'environmental pressures driving change',
          'variation in traits within populations',
        ],
        experiments: [
          'Apply environmental stress and see which species survive',
          'Compare species success in different habitats',
          'Observe behavioral changes during challenges',
        ],
      },
    });

    // Conservation Concepts
    this.addEducationalContent({
      id: 'conservation',
      title: 'Conservation and Human Impact',
      category: 'conservation',
      level: 'advanced',
      unlockTrigger: 'pollution_challenge',
      content: {
        summary: 'Human activities affect ecosystems, but we can take action to protect them.',
        details: [
          'Habitat destruction is the main threat to biodiversity',
          'Pollution affects air, water, and soil quality',
          'Climate change alters temperature and weather patterns',
          'Conservation efforts can help protect and restore ecosystems',
        ],
        visualConcepts: [
          'human impact timeline',
          'protected areas and wildlife corridors',
          'restoration success stories',
        ],
        experiments: [
          'Apply pollution and observe ecosystem decline',
          'Test conservation strategies to improve health',
          'Create wildlife corridors connecting habitats',
        ],
      },
    });

    // Species-Specific Discoveries
    this.loadSpeciesDiscoveries();

    // Ecosystem Process Discoveries
    this.loadProcessDiscoveries();
  }

  /**
   * Load species-specific educational discoveries
   */
  loadSpeciesDiscoveries() {
    const speciesDiscoveries = [
      {
        id: 'predator_vision',
        title: 'Super Senses',
        category: 'adaptation',
        trigger: 'observe_hawk_hunting',
        content:
          'Hawks have incredible eyesight - they can see small prey from over 100 feet away! Their eyes have more color-detecting cells than human eyes.',
        funFact:
          'If humans had hawk vision, we could read a newspaper from across a football field!',
        connections: [
          'All predators have enhanced senses',
          'Prey animals have defense adaptations too',
        ],
      },
      {
        id: 'plant_communication',
        title: 'Plant Networks',
        category: 'symbiosis',
        trigger: 'forest_ecosystem_stable',
        content:
          'Trees in forests are connected by underground fungal networks! They share nutrients and even warning signals about insect attacks.',
        funFact:
          'Scientists call these networks the "wood wide web" - like the internet for trees!',
        connections: [
          'Cooperation exists everywhere in nature',
          'Individual success depends on community health',
        ],
      },
      {
        id: 'decomposer_power',
        title: 'Nature\'s Recyclers',
        category: 'ecology',
        trigger: 'add_bacteria',
        content:
          'Bacteria and other decomposers break down dead material and return nutrients to the soil. Without them, dead material would pile up everywhere!',
        funFact: 'A single teaspoon of soil contains more bacteria than there are people on Earth!',
        connections: [
          'Everything in nature gets recycled',
          'Decomposers are essential for all ecosystems',
        ],
      },
    ];

    for (const discovery of speciesDiscoveries) {
      this.addDiscovery(discovery);
    }
  }

  /**
   * Load process-based discoveries
   */
  loadProcessDiscoveries() {
    const processDiscoveries = [
      {
        id: 'population_cycles',
        title: 'Population Cycles',
        category: 'ecology',
        trigger: 'observe_population_oscillation',
        content:
          'Predator and prey populations rise and fall in cycles. When prey increases, predators have more food and increase too. But more predators means less prey, so prey populations fall.',
        funFact:
          'These cycles can be predicted mathematically - scientists use equations to model ecosystem changes!',
        connections: [
          'Everything in ecosystems is connected',
          'Changes ripple through the whole system',
        ],
      },
      {
        id: 'keystone_effect',
        title: 'Keystone Species',
        category: 'ecology',
        trigger: 'remove_top_predator',
        content:
          'Some species have much bigger impacts than their numbers suggest. Removing wolves from Yellowstone caused deer to overgraze, which affected rivers and bird populations!',
        funFact:
          'Wolves changed the shape of rivers by changing deer behavior - that\'s ecosystem engineering!',
        connections: [
          'Some species are more important than others',
          'Removing key species can collapse ecosystems',
        ],
      },
    ];

    for (const discovery of processDiscoveries) {
      this.addDiscovery(discovery);
    }
  }

  /**
   * Add educational content to the database
   * @param {Object} content - Educational content data
   */
  addEducationalContent(content) {
    this.educationalContent.set(content.id, content);
  }

  /**
   * Add a discovery to the database
   * @param {Object} discovery - Discovery data
   */
  addDiscovery(discovery) {
    this.discoveries.set(discovery.id, {
      ...discovery,
      discovered: false,
      discoveryDate: null,
    });
  }

  /**
   * Check if a discovery should be triggered
   * @param {string} triggerEvent - Event that might trigger discoveries
   * @param {Object} context - Additional context for the trigger
   * @returns {Array} Array of newly unlocked discoveries
   */
  checkDiscoveries(triggerEvent, context = {}) {
    const newDiscoveries = [];

    for (const [_id, discovery] of this.discoveries) {
      if (!discovery.discovered && discovery.trigger === triggerEvent) {
        if (this.evaluateTriggerCondition(discovery, context)) {
          discovery.discovered = true;
          discovery.discoveryDate = new Date();
          newDiscoveries.push(discovery);

          this.playerProgress.totalDiscoveries++;
          this.playerProgress.conceptsLearned.add(discovery.category);
        }
      }
    }

    // Check for educational content unlocks
    for (const [id, content] of this.educationalContent) {
      if (!this.unlockedContent.has(id) && content.unlockTrigger === triggerEvent) {
        if (this.evaluateTriggerCondition(content, context)) {
          this.unlockedContent.add(id);
          newDiscoveries.push({
            type: 'educational_content',
            ...content,
          });
        }
      }
    }

    return newDiscoveries;
  }

  /**
   * Evaluate if a trigger condition is met
   * @param {Object} item - Discovery or content item
   * @param {Object} context - Context data
   * @returns {boolean} Whether condition is met
   */
  evaluateTriggerCondition(item, context) {
    // Simple trigger conditions - could be expanded
    switch (item.trigger || item.unlockTrigger) {
    case 'first_predator_prey':
      return context.hasPreyRelationship === true;

    case 'species_diversity_5':
      return context.speciesCount >= 5;

    case 'first_mutualism':
      return context.hasMutualism === true;

    case 'population_crash':
      return context.populationCrashed === true;

    case 'environmental_challenge':
      return context.challengeActive === true;

    case 'pollution_challenge':
      return context.pollutionLevel > 0.3;

    default:
      return true; // Simple triggers without conditions
    }
  }

  /**
   * Record a species encounter
   * @param {string} speciesId - ID of the encountered species
   * @param {Object} context - Encounter context
   */
  recordSpeciesEncounter(speciesId, context = {}) {
    this.playerProgress.speciesEncountered.add(speciesId);

    // Check for species-specific discoveries
    const discoveries = this.checkDiscoveries(`encounter_${speciesId}`, context);

    return discoveries;
  }

  /**
   * Record an ecosystem exploration
   * @param {string} ecosystemType - Type of ecosystem
   * @param {Object} metrics - Ecosystem metrics
   */
  recordEcosystemExploration(ecosystemType, metrics = {}) {
    this.playerProgress.ecosystemsExplored.add(ecosystemType);

    const context = {
      ecosystemType,
      ...metrics,
    };

    const discoveries = this.checkDiscoveries(`explore_${ecosystemType}`, context);

    return discoveries;
  }

  /**
   * Record an experiment completion
   * @param {string} experimentId - ID of the experiment
   * @param {Object} results - Experiment results
   */
  recordExperiment(experimentId, results = {}) {
    this.playerProgress.experimentsCompleted.add(experimentId);

    const discoveries = this.checkDiscoveries(`experiment_${experimentId}`, results);

    return discoveries;
  }

  /**
   * Get educational content for a specific topic
   * @param {string} contentId - ID of the educational content
   * @returns {Object|null} Educational content or null
   */
  getEducationalContent(contentId) {
    if (!this.unlockedContent.has(contentId)) return null;

    return this.educationalContent.get(contentId);
  }

  /**
   * Get all unlocked educational content for a category
   * @param {string} category - Content category
   * @returns {Array} Array of unlocked content in category
   */
  getContentByCategory(category) {
    const content = [];

    for (const [id, item] of this.educationalContent) {
      if (this.unlockedContent.has(id) && item.category === category) {
        content.push({ id, ...item });
      }
    }

    return content.sort((a, b) => {
      const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      return levelOrder[a.level] - levelOrder[b.level];
    });
  }

  /**
   * Get all discovered facts and trivia
   * @returns {Array} Array of discovered facts
   */
  getDiscoveredFacts() {
    const facts = [];

    for (const discovery of this.discoveries.values()) {
      if (discovery.discovered) {
        facts.push({
          title: discovery.title,
          content: discovery.content,
          funFact: discovery.funFact,
          category: discovery.category,
          discoveryDate: discovery.discoveryDate,
        });
      }
    }

    return facts.sort((a, b) => b.discoveryDate - a.discoveryDate);
  }

  /**
   * Get contextual hints for current situation
   * @param {Object} gameState - Current game state
   * @returns {Array} Array of relevant hints
   */
  getContextualHints(gameState) {
    const hints = [];

    // Check for ecosystem imbalances
    if (gameState.ecosystemHealth < 50) {
      hints.push({
        type: 'warning',
        title: 'Ecosystem Stress Detected',
        message:
          'Your ecosystem health is low. Check if species have enough food and suitable habitat conditions.',
        suggestedActions: [
          'Add more producers',
          'Check environmental factors',
          'Look for missing decomposers',
        ],
      });
    }

    // Check for missing trophic levels
    const trophicLevels = new Set(gameState.species.map(s => s.trophicLevel));
    if (!trophicLevels.has(1)) {
      hints.push({
        type: 'suggestion',
        title: 'Missing Producers',
        message: 'Every ecosystem needs producers (plants) to capture energy from the sun.',
        suggestedActions: ['Add grass or trees', 'Consider the habitat type'],
      });
    }

    // Check for isolated species
    if (gameState.isolatedSpecies && gameState.isolatedSpecies.length > 0) {
      hints.push({
        type: 'educational',
        title: 'Isolated Species',
        message: `Some species (${gameState.isolatedSpecies.join(', ')}) have no food sources or relationships.`,
        suggestedActions: ['Add appropriate prey species', 'Create symbiotic relationships'],
      });
    }

    // Biodiversity suggestions
    if (gameState.species.length >= 5) {
      hints.push({
        type: 'achievement',
        title: 'Biodiversity Milestone!',
        message: 'You\'ve created a diverse ecosystem! More species usually means more stability.',
        educationalNote:
          'Real ecosystems with higher biodiversity are more resilient to changes and disruptions.',
      });
    }

    return hints;
  }

  /**
   * Generate a discovery report for completed levels
   * @param {Object} levelData - Data from completed level
   * @returns {Object} Discovery report
   */
  generateDiscoveryReport(levelData) {
    const report = {
      newDiscoveries: [],
      conceptsReinforced: [],
      experimentsPerformed: [],
      nextSteps: [],
    };

    // Analyze what was learned in this level
    const ecosystemHealth = levelData.finalEcosystemHealth;
    const speciesUsed = levelData.speciesUsed;
    const _challengesCompleted = levelData.challengesCompleted || [];

    // Generate personalized next steps
    if (ecosystemHealth > 80) {
      report.nextSteps.push('Try a more challenging habitat type');
      report.nextSteps.push('Experiment with adding apex predators');
    } else {
      report.nextSteps.push('Focus on balancing producer and consumer populations');
      report.nextSteps.push('Pay attention to environmental factors');
    }

    // Suggest related concepts to explore
    const categories = new Set();
    for (const species of speciesUsed) {
      if (species.category) categories.add(species.category);
    }

    for (const category of categories) {
      const relatedContent = this.getContentByCategory(category);
      if (relatedContent.length > 0) {
        report.conceptsReinforced.push(category);
      }
    }

    return report;
  }

  /**
   * Get player's learning progress statistics
   * @returns {Object} Progress statistics
   */
  getProgressStats() {
    return {
      totalDiscoveries: this.playerProgress.totalDiscoveries,
      speciesEncountered: this.playerProgress.speciesEncountered.size,
      ecosystemsExplored: this.playerProgress.ecosystemsExplored.size,
      conceptsLearned: this.playerProgress.conceptsLearned.size,
      experimentsCompleted: this.playerProgress.experimentsCompleted.size,
      unlockedContent: this.unlockedContent.size,

      // Learning milestones
      isEcologyNovice: this.playerProgress.totalDiscoveries >= 3,
      isEcosystemBuilder: this.playerProgress.ecosystemsExplored.size >= 2,
      isConservationista: this.playerProgress.conceptsLearned.has('conservation'),
      isResearcher: this.playerProgress.experimentsCompleted.size >= 5,
    };
  }

  /**
   * Reset progress (for new games)
   */
  resetProgress() {
    this.discoveries.forEach(discovery => {
      discovery.discovered = false;
      discovery.discoveryDate = null;
    });

    this.unlockedContent.clear();

    this.playerProgress = {
      totalDiscoveries: 0,
      ecosystemsExplored: new Set(),
      speciesEncountered: new Set(),
      conceptsLearned: new Set(),
      experimentsCompleted: new Set(),
    };
  }
}
