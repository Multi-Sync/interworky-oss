/**
 * Seed script for flows
 * Run with: node src/modules/flow/seeds/seed-flows.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Flow = require('../flow.model');

// Import all flow configs
const resumeBuilderFlow = require('./resume-builder.json');
const careerPlanFlow = require('./career-plan.json');
const macroCalculatorFlow = require('./macro-calculator.json');
const aiRoastMeFlow = require('./ai-roast-me.json');
const whatsMyVibeFlow = require('./whats-my-vibe.json');
const salaryRealityCheckFlow = require('./salary-reality-check.json');
const startupIdeaValidatorFlow = require('./startup-idea-validator.json');
const datingProfileFixerFlow = require('./dating-profile-fixer.json');

const MONGODB_URI = process.env.MONGODB_URL || 'mongodb://localhost:27017/interworky_core';

// All flows to seed
const flows = [
  { id: 'resume-builder', data: resumeBuilderFlow },
  { id: 'career-plan', data: careerPlanFlow },
  { id: 'macro-calculator', data: macroCalculatorFlow },
  { id: 'ai-roast-me', data: aiRoastMeFlow },
  { id: 'whats-my-vibe', data: whatsMyVibeFlow },
  { id: 'salary-reality-check', data: salaryRealityCheckFlow },
  { id: 'startup-idea-validator', data: startupIdeaValidatorFlow },
  { id: 'dating-profile-fixer', data: datingProfileFixerFlow },
];

async function seedFlows() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed all flows
    for (const flow of flows) {
      console.log(`\nSeeding ${flow.id} flow...`);

      const existingFlow = await Flow.findOne({ flow_id: flow.id });
      if (existingFlow) {
        console.log(`Updating existing ${flow.id} flow...`);
        await Flow.updateOne({ flow_id: flow.id }, flow.data);
        console.log('Flow updated successfully');
      } else {
        console.log(`Creating new ${flow.id} flow...`);
        await Flow.create(flow.data);
        console.log('Flow created successfully');
      }
    }

    // List all flows
    const allFlows = await Flow.find({}).select('flow_id name is_active is_public');
    console.log('\nAll flows in database:');
    allFlows.forEach((f) => {
      console.log(`  - ${f.flow_id}: ${f.name} (active: ${f.is_active}, public: ${f.is_public})`);
    });

    console.log('\nSeeding complete!');
  } catch (error) {
    console.error('Error seeding flows:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedFlows();
