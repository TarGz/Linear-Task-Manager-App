const axios = require('axios');
require('dotenv').config();

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const LINEAR_API_URL = 'https://api.linear.app/graphql';

async function testLinearAPI() {
  if (!LINEAR_API_KEY) {
    console.error('❌ LINEAR_API_KEY not found in environment variables');
    console.log('Please add your Linear API key to the .env file');
    return;
  }

  console.log('🔄 Testing Linear API connection...');

  try {
    // Test query to get viewer info and some issues
    const query = `
      query {
        viewer {
          id
          name
          email
        }
        issues(first: 5) {
          nodes {
            id
            title
            description
            state {
              name
            }
            priority
            createdAt
            updatedAt
          }
        }
        teams {
          nodes {
            id
            name
          }
        }
      }
    `;

    const response = await axios.post(
      LINEAR_API_URL,
      { query },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': LINEAR_API_KEY
        }
      }
    );

    if (response.data.errors) {
      console.error('❌ GraphQL errors:', response.data.errors);
      return;
    }

    const { viewer, issues, teams } = response.data.data;

    console.log('\n✅ Successfully connected to Linear API!\n');
    console.log('👤 User Info:');
    console.log(`   Name: ${viewer.name}`);
    console.log(`   Email: ${viewer.email}`);
    console.log(`   ID: ${viewer.id}`);

    console.log('\n📋 Teams:');
    teams.nodes.forEach(team => {
      console.log(`   - ${team.name} (${team.id})`);
    });

    console.log('\n📝 Recent Issues:');
    if (issues.nodes.length === 0) {
      console.log('   No issues found');
    } else {
      issues.nodes.forEach(issue => {
        console.log(`\n   Title: ${issue.title}`);
        console.log(`   State: ${issue.state.name}`);
        console.log(`   Priority: ${issue.priority || 'None'}`);
        console.log(`   Created: ${new Date(issue.createdAt).toLocaleDateString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Error connecting to Linear API:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data);
    } else {
      console.error('   Message:', error.message);
    }
  }
}

testLinearAPI();