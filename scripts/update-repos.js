const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

const GITHUB_USERNAME = 'iblamesagarr';
const MAX_REPOS = 6;

function getToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const token = execSync('gh auth token', { encoding: 'utf8' }).trim();
    if (token) return token;
  } catch (e) {}
  return null;
}

function fetchRepos() {
  const token = getToken();

  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Node-GitHub-Repo-Fetcher',
      'Accept': 'application/vnd.github.v3+json'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const options = {
      hostname: 'api.github.com',
      path: `/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=12`,
      headers
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (Array.isArray(json)) {
            resolve(json);
          } else {
            reject(new Error(json.message || 'Failed to fetch repos'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function getLanguageColor(lang) {
  const colors = {
    'TypeScript': '3178C6',
    'JavaScript': 'F7DF1E',
    'Python': '3776AB',
    'Kotlin': '7F52FF',
    'HTML': 'E34F26',
    'CSS': '1572B6',
    'Java': 'ED8B00',
    'C++': '00599C',
    'Shell': '89E051'
  };
  return colors[lang] || '58A6FF';
}

async function updateReadme() {
  try {
    console.log('Fetching repositories from GitHub API...');
    const repos = await fetchRepos();
    
    // Filter out profile repo, take top MAX_REPOS
    const filteredRepos = repos
      .filter(r => r.name !== GITHUB_USERNAME)
      .slice(0, MAX_REPOS);

    let markdown = '<table>\n';
    for (let i = 0; i < filteredRepos.length; i += 2) {
      markdown += '  <tr>\n';
      
      // Col 1
      const r1 = filteredRepos[i];
      const desc1 = r1.description || 'Full-stack software engineering project & digital application.';
      markdown += `    <td width="50%" valign="top">\n`;
      markdown += `      <h3>⚡ <a href="${r1.html_url}">${r1.name}</a></h3>\n`;
      markdown += `      <p>${desc1}</p>\n`;
      markdown += `      <p>\n`;
      if (r1.language) {
        markdown += `        <img src="https://img.shields.io/badge/${encodeURIComponent(r1.language)}-${getLanguageColor(r1.language)}?style=flat-square&logo=${encodeURIComponent(r1.language.toLowerCase())}&logoColor=white"/>\n`;
      }
      markdown += `        <img src="https://img.shields.io/badge/★_${r1.stargazers_count}-yellow?style=flat-square"/>\n`;
      markdown += `        <img src="https://img.shields.io/badge/Updated-${new Date(r1.pushed_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}-blue?style=flat-square"/>\n`;
      markdown += `      </p>\n`;
      markdown += `      <a href="${r1.html_url}">\n`;
      markdown += `        <img src="https://img.shields.io/badge/View%20Repo-181717?style=for-the-badge&logo=github&logoColor=white"/>\n`;
      markdown += `      </a>\n`;
      markdown += `    </td>\n`;

      // Col 2
      if (i + 1 < filteredRepos.length) {
        const r2 = filteredRepos[i + 1];
        const desc2 = r2.description || 'Full-stack software engineering project & digital application.';
        markdown += `    <td width="50%" valign="top">\n`;
        markdown += `      <h3>⚡ <a href="${r2.html_url}">${r2.name}</a></h3>\n`;
        markdown += `      <p>${desc2}</p>\n`;
        markdown += `      <p>\n`;
        if (r2.language) {
          markdown += `        <img src="https://img.shields.io/badge/${encodeURIComponent(r2.language)}-${getLanguageColor(r2.language)}?style=flat-square&logo=${encodeURIComponent(r2.language.toLowerCase())}&logoColor=white"/>\n`;
        }
        markdown += `        <img src="https://img.shields.io/badge/★_${r2.stargazers_count}-yellow?style=flat-square"/>\n`;
        markdown += `        <img src="https://img.shields.io/badge/Updated-${new Date(r2.pushed_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}-blue?style=flat-square"/>\n`;
        markdown += `      </p>\n`;
        markdown += `      <a href="${r2.html_url}">\n`;
        markdown += `        <img src="https://img.shields.io/badge/View%20Repo-181717?style=for-the-badge&logo=github&logoColor=white"/>\n`;
        markdown += `      </a>\n`;
        markdown += `    </td>\n`;
      } else {
        markdown += `    <td width="50%" valign="top"></td>\n`;
      }

      markdown += '  </tr>\n';
    }
    markdown += '</table>';

    const readmePath = './README.md';
    let content = fs.readFileSync(readmePath, 'utf8');

    const startTag = '<!-- RECENT_REPOS:START -->';
    const endTag = '<!-- RECENT_REPOS:END -->';

    const startIndex = content.indexOf(startTag);
    const endIndex = content.indexOf(endTag);

    if (startIndex !== -1 && endIndex !== -1) {
      const newContent = content.substring(0, startIndex + startTag.length) + '\n' + markdown + '\n' + content.substring(endIndex);
      fs.writeFileSync(readmePath, newContent, 'utf8');
      console.log('README.md successfully updated with latest repositories!');
    } else {
      console.warn('Markers <!-- RECENT_REPOS:START --> and <!-- RECENT_REPOS:END --> not found in README.md');
    }
  } catch (err) {
    console.error('Error updating README:', err);
    process.exit(1);
  }
}

updateReadme();
