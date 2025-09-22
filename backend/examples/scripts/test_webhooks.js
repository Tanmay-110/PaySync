#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3002/api';
const WEBHOOK_EXAMPLES_PATH = path.join(__dirname, '../examples/webhook_examples.json');

async function sendWebhook(webhookData, webhookName) {
  try {
    console.log(`\n🚀 Sending ${webhookName} webhook...`);
    console.log('Payload:', JSON.stringify(webhookData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/webhook/payment`, webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Signature': 'test_signature' // For development
      },
      timeout: 10000
    });
    
    console.log(`✅ ${webhookName} webhook sent successfully!`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error(`❌ ${webhookName} webhook failed:`, error.response?.data || error.message);
    return null;
  }
}

async function testAllWebhooks() {
  try {
    console.log('🧪 Starting webhook tests...');
    console.log(`API URL: ${API_BASE_URL}`);
    
    // Load webhook examples
    const webhookExamples = JSON.parse(fs.readFileSync(WEBHOOK_EXAMPLES_PATH, 'utf8'));
    
    const results = [];
    
    // Send each webhook
    for (const [name, webhookData] of Object.entries(webhookExamples)) {
      const result = await sendWebhook(webhookData, name);
      results.push({ name, success: !!result, result });
      
      // Wait a bit between webhooks
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);
    
    // Detailed results
    console.log('\n📋 Detailed Results:');
    results.forEach(({ name, success, result }) => {
      const status = success ? '✅' : '❌';
      console.log(`${status} ${name}: ${success ? 'Success' : 'Failed'}`);
      if (success && result.payment_id) {
        console.log(`   Payment ID: ${result.payment_id}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

async function testSpecificWebhook(webhookName) {
  try {
    const webhookExamples = JSON.parse(fs.readFileSync(WEBHOOK_EXAMPLES_PATH, 'utf8'));
    
    if (!webhookExamples[webhookName]) {
      console.error(`❌ Webhook "${webhookName}" not found in examples`);
      console.log('Available webhooks:', Object.keys(webhookExamples).join(', '));
      process.exit(1);
    }
    
    const result = await sendWebhook(webhookExamples[webhookName], webhookName);
    
    if (result) {
      console.log('\n✅ Test completed successfully!');
    } else {
      console.log('\n❌ Test failed!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'all':
    testAllWebhooks();
    break;
  case 'single':
    const webhookName = args[1];
    if (!webhookName) {
      console.error('❌ Please specify a webhook name');
      console.log('Usage: node test_webhooks.js single <webhook_name>');
      process.exit(1);
    }
    testSpecificWebhook(webhookName);
    break;
  default:
    console.log('🧪 Webhook Testing Script');
    console.log('========================');
    console.log('');
    console.log('Usage:');
    console.log('  node test_webhooks.js all                    # Test all webhooks');
    console.log('  node test_webhooks.js single <webhook_name>  # Test specific webhook');
    console.log('');
    console.log('Available webhooks:');
    try {
      const webhookExamples = JSON.parse(fs.readFileSync(WEBHOOK_EXAMPLES_PATH, 'utf8'));
      Object.keys(webhookExamples).forEach(name => {
        console.log(`  - ${name}`);
      });
    } catch (error) {
      console.log('  (Unable to load webhook examples)');
    }
    console.log('');
    console.log('Environment Variables:');
    console.log('  API_URL - API base URL (default: http://localhost:3002/api)');
    break;
}
