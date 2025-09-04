import axios from 'axios';

const LINEAR_API_URL = 'https://api.linear.app/graphql';

class LinearAPI {
  constructor() {
    this.apiKey = localStorage.getItem('linearApiKey') || '';
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('linearApiKey', key);
  }

  getApiKey() {
    return this.apiKey;
  }

  clearApiKey() {
    this.apiKey = '';
    localStorage.removeItem('linearApiKey');
  }

  async query(graphqlQuery, variables = {}) {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }

    console.log('🔍 LINEAR API CALL:');
    console.log('Query:', graphqlQuery);
    console.log('Variables:', variables);

    try {
      const response = await axios.post(
        LINEAR_API_URL,
        {
          query: graphqlQuery,
          variables
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.apiKey
          }
        }
      );

      if (response.data.errors) {
        console.error('Linear API GraphQL Errors:', response.data.errors);
        console.error('Full error details:', JSON.stringify(response.data.errors, null, 2));
        throw new Error(response.data.errors[0].message);
      }

      return response.data.data;
    } catch (error) {
      console.error('Linear API Error:', error);
      if (error.response?.data) {
        console.error('Linear API Response Data:', error.response.data);
        if (error.response.data.errors) {
          console.error('GraphQL Errors:', JSON.stringify(error.response.data.errors, null, 2));
        }
      }
      throw error;
    }
  }

  async testConnection() {
    const query = `
      query {
        viewer {
          id
          name
          email
        }
      }
    `;
    return this.query(query);
  }

  async getProjects() {
    const query = `
      query {
        projects(first: 50) {
          nodes {
            id
            name
            description
            state
            icon
            createdAt
            updatedAt
            issues {
              nodes {
                id
                state {
                  type
                }
              }
            }
          }
        }
      }
    `;
    return this.query(query);
  }

  async getProjectIssues(projectId) {
    const query = `
      query($projectId: String!) {
        project(id: $projectId) {
          id
          name
          description
          state
          icon
          issues {
            nodes {
              id
              title
              description
              state {
                id
                name
                type
              }
              priority
              dueDate
              createdAt
              updatedAt
              assignee {
                id
                name
                avatarUrl
              }
            }
          }
        }
      }
    `;
    return this.query(query, { projectId });
  }

  async getAllIssues(options = {}) {
    const { includeArchived = false } = options;
    const includeArg = includeArchived ? ', includeArchived: true' : '';
    const query = `
      query {
        issues(first: 200${includeArg}) {
          nodes {
            id
            title
            description
            archivedAt
            state {
              id
              name
              type
            }
            priority
            dueDate
            createdAt
            updatedAt
            project {
              id
              name
            }
            assignee {
              id
              name
              avatarUrl
            }
          }
        }
      }
    `;
    return this.query(query);
  }

  async archiveIssue(id) {
    const mutation = `
      mutation($id: String!) {
        issueArchive(id: $id) {
          success
        }
      }
    `;
    return this.query(mutation, { id });
  }

  async unarchiveIssue(id) {
    const mutation = `
      mutation($id: String!) {
        issueUnarchive(id: $id) {
          success
        }
      }
    `;
    return this.query(mutation, { id });
  }

  async getIssue(id) {
    const query = `
      query($id: String!) {
        issue(id: $id) {
          id
          title
          description
          dueDate
          updatedAt
        }
      }
    `;
    return this.query(query, { id });
  }

  async getProjectsWithIssues() {
    const query = `
      query {
        projects(first: 50) {
          nodes {
            id
            name
            description
            state
            createdAt
            updatedAt
            labels {
              nodes {
                id
                name
                color
              }
            }
          }
        }
        issues(first: 200) {
          nodes {
            id
            title
            description
            state {
              id
              name
              type
            }
            priority
            dueDate
            createdAt
            updatedAt
            project {
              id
              name
            }
            assignee {
              id
              name
              avatarUrl
            }
            labels {
              nodes {
                id
                name
                color
              }
            }
          }
        }
      }
    `;
    return this.query(query);
  }

  async createIssue(input) {
    const mutation = `
      mutation($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            title
            description
            state {
              id
              name
            }
          }
        }
      }
    `;
    return this.query(mutation, { input });
  }

  async getTeams() {
    const query = `
      query {
        teams(first: 10) {
          nodes {
            id
            name
          }
        }
      }
    `;
    return this.query(query);
  }

  async updateIssue(id, input) {
    const mutation = `
      mutation($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue {
            id
            title
            description
            dueDate
            state {
              id
              name
              type
            }
            updatedAt
          }
        }
      }
    `;
    return this.query(mutation, { id, input });
  }

  async createProject(input) {
    console.log('Linear API createProject called with input:', input);
    const mutation = `
      mutation($input: ProjectCreateInput!) {
        projectCreate(input: $input) {
          success
          project {
            id
            name
            description
            state
          }
        }
      }
    `;
    const result = await this.query(mutation, { input });
    console.log('Linear API createProject result:', result);
    return result;
  }

  async updateProject(id, input) {
    const mutation = `
      mutation($id: String!, $input: ProjectUpdateInput!) {
        projectUpdate(id: $id, input: $input) {
          success
          project {
            id
            name
            description
            state
          }
        }
      }
    `;
    return this.query(mutation, { id, input });
  }

  async getWorkflowStates(teamId) {
    const query = `
      query($teamId: String!) {
        team(id: $teamId) {
          states {
            nodes {
              id
              name
              type
              position
            }
          }
        }
      }
    `;
    return this.query(query, { teamId });
  }

  async deleteProject(id) {
    const mutation = `
      mutation($id: String!) {
        projectDelete(id: $id) {
          success
        }
      }
    `;
    return this.query(mutation, { id });
  }

  async deleteIssue(id) {
    const mutation = `
      mutation($id: String!) {
        issueDelete(id: $id) {
          success
        }
      }
    `;
    return this.query(mutation, { id });
  }

  async getLabels() {
    const query = `
      query {
        issueLabels(first: 50) {
          nodes {
            id
            name
            color
            description
          }
        }
      }
    `;
    return this.query(query);
  }

  async createLabel(name, color = '#7C4DFF') {
    const mutation = `
      mutation($name: String!, $color: String!) {
        issueLabelCreate(input: { name: $name, color: $color }) {
          success
          issueLabel {
            id
            name
            color
          }
        }
      }
    `;
    return this.query(mutation, { name, color });
  }

  // Project labels
  async getProjectLabels() {
    const query = `
      query {
        projectLabels(first: 50) {
          nodes {
            id
            name
            color
            description
          }
        }
      }
    `;
    return this.query(query);
  }

  async createProjectLabel(name, color = '#7C4DFF') {
    const mutation = `
      mutation($name: String!, $color: String!) {
        projectLabelCreate(input: { name: $name, color: $color }) {
          success
          projectLabel {
            id
            name
            color
          }
        }
      }
    `;
    return this.query(mutation, { name, color });
  }

  async ensureWorkLabel() {
    try {
      console.log('🏷️ Getting existing labels...');
      const labelsData = await this.getLabels();
      console.log('🏷️ Available labels:', labelsData.issueLabels?.nodes);
      
      const existingLabel = labelsData.issueLabels?.nodes?.find(
        label => label.name === 'Work'
      );
      
      if (existingLabel) {
        console.log('✅ Found existing Work label:', existingLabel);
        return existingLabel;
      }
      
      console.log('❌ Work label not found, this should not happen! Please create a "Work" label in Linear first.');
      return null;
    } catch (error) {
      console.error('Error getting Work label:', error);
      return null;
    }
  }

  async ensureWorkProjectLabel() {
    try {
      console.log('🏷️ Getting existing project labels...');
      const labelsData = await this.getProjectLabels();
      console.log('🏷️ Available project labels:', labelsData.projectLabels?.nodes);

      const existingLabel = labelsData.projectLabels?.nodes?.find(
        label => label.name === 'Work'
      );

      if (existingLabel) {
        console.log('✅ Found existing Work project label:', existingLabel);
        return existingLabel;
      }

      console.log('❌ Work project label not found. Please create a "Work" project label in Linear.');
      return null;
    } catch (error) {
      console.error('Error getting Work project label:', error);
      return null;
    }
  }
}

export default new LinearAPI();
