// src/assistant/modes/flowEngine/renderers/careerRenderer.js
/**
 * Career Plan Renderer
 * Displays user profile and career recommendations from AI analysis
 */

import { createElement } from '../../../ui/baseMethods';
import { registerRenderer, extractValue } from './index';

/**
 * Render career plan results from flow data and completion action results
 */
function renderCareer(data, config) {
  const container = createElement(
    'div',
    {
      padding: '32px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      lineHeight: '1.6',
      color: '#1f2937',
    },
    { id: 'career-content' }
  );

  // User Profile Section
  const profile = extractValue(data, 'save_profile');
  if (profile?.name) {
    const profileHeader = createElement(
      'div',
      {
        marginBottom: '32px',
        paddingBottom: '24px',
        borderBottom: '2px solid #6366f1',
      },
      {}
    );

    const greeting = createElement(
      'h1',
      {
        fontSize: '28px',
        fontWeight: 'bold',
        margin: '0 0 8px 0',
        color: '#1f2937',
      },
      { textContent: `Career Plan for ${profile.name}` }
    );

    profileHeader.appendChild(greeting);

    if (profile.location) {
      const location = createElement(
        'p',
        {
          fontSize: '14px',
          color: '#6b7280',
          margin: '0',
        },
        { textContent: `📍 ${profile.location}` }
      );
      profileHeader.appendChild(location);
    }

    container.appendChild(profileHeader);
  }

  // Profile Summary (from finalize_profile)
  const finalize = extractValue(data, 'finalize_profile');
  if (finalize?.summary) {
    const summarySection = createSection('Your Profile Summary', '📋');
    const summaryText = createElement(
      'p',
      {
        fontSize: '15px',
        color: '#374151',
        backgroundColor: '#f3f4f6',
        padding: '16px',
        borderRadius: '8px',
        margin: '0',
        fontStyle: 'italic',
      },
      { textContent: finalize.summary }
    );
    summarySection.appendChild(summaryText);
    container.appendChild(summarySection);
  }

  // Education Section
  const education = extractValue(data, 'save_education');
  if (education) {
    const eduSection = createSection('Education', '🎓');
    const eduContent = createElement('div', {}, {});

    if (education.highest_degree) {
      const degree = createElement(
        'p',
        {
          fontSize: '15px',
          margin: '0 0 8px 0',
        },
        { innerHTML: `<strong>Degree:</strong> ${education.highest_degree}` }
      );
      eduContent.appendChild(degree);
    }
    if (education.certifications) {
      const certs = createElement(
        'p',
        {
          fontSize: '15px',
          margin: '0 0 8px 0',
        },
        { innerHTML: `<strong>Certifications:</strong> ${education.certifications}` }
      );
      eduContent.appendChild(certs);
    }
    if (education.skills) {
      const skills = createElement(
        'p',
        {
          fontSize: '15px',
          margin: '0',
        },
        { innerHTML: `<strong>Skills:</strong> ${education.skills}` }
      );
      eduContent.appendChild(skills);
    }

    eduSection.appendChild(eduContent);
    container.appendChild(eduSection);
  }

  // Experience Section
  const experience = extractValue(data, 'save_experience');
  if (experience) {
    const expSection = createSection('Experience', '💼');
    const expContent = createElement('div', {}, {});

    if (experience.current_role) {
      const role = createElement(
        'p',
        {
          fontSize: '15px',
          margin: '0 0 8px 0',
        },
        { innerHTML: `<strong>Current Role:</strong> ${experience.current_role}` }
      );
      expContent.appendChild(role);
    }
    if (experience.industry) {
      const industry = createElement(
        'p',
        {
          fontSize: '15px',
          margin: '0 0 8px 0',
        },
        { innerHTML: `<strong>Industry:</strong> ${experience.industry}` }
      );
      expContent.appendChild(industry);
    }
    if (experience.years_experience) {
      const years = createElement(
        'p',
        {
          fontSize: '15px',
          margin: '0 0 8px 0',
        },
        { innerHTML: `<strong>Years of Experience:</strong> ${experience.years_experience}` }
      );
      expContent.appendChild(years);
    }
    if (experience.achievements) {
      const achievements = createElement(
        'p',
        {
          fontSize: '15px',
          margin: '0',
        },
        { innerHTML: `<strong>Key Achievements:</strong> ${experience.achievements}` }
      );
      expContent.appendChild(achievements);
    }

    expSection.appendChild(expContent);
    container.appendChild(expSection);
  }

  // Completion Results - AI Recommendations
  const completion = data._completion;
  if (completion) {
    // Divider for AI recommendations
    const divider = createElement(
      'div',
      {
        margin: '32px 0',
        padding: '16px',
        backgroundColor: '#eef2ff',
        borderRadius: '8px',
        textAlign: 'center',
      },
      {}
    );
    const dividerText = createElement(
      'span',
      {
        fontSize: '14px',
        fontWeight: '600',
        color: '#4f46e5',
      },
      { textContent: '✨ AI-Generated Career Recommendations' }
    );
    divider.appendChild(dividerText);
    container.appendChild(divider);

    // Job Opportunities
    if (completion.job_opportunities?.length > 0) {
      const jobsSection = createSection('Recommended Job Opportunities', '🎯');
      const jobsList = createElement(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        },
        {}
      );

      completion.job_opportunities.forEach((job) => {
        const jobCard = createElement(
          'div',
          {
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            borderLeft: '4px solid #6366f1',
          },
          {}
        );

        const jobTitle = createElement(
          'h4',
          {
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0 0 4px 0',
          },
          { textContent: job.title || job }
        );
        jobCard.appendChild(jobTitle);

        if (job.company_type) {
          const companyType = createElement(
            'p',
            {
              fontSize: '13px',
              color: '#6b7280',
              margin: '0 0 8px 0',
            },
            { textContent: `Company Type: ${job.company_type}` }
          );
          jobCard.appendChild(companyType);
        }

        if (job.why_good_fit) {
          const whyFit = createElement(
            'p',
            {
              fontSize: '14px',
              color: '#4b5563',
              margin: '0',
            },
            { textContent: job.why_good_fit }
          );
          jobCard.appendChild(whyFit);
        }

        jobsList.appendChild(jobCard);
      });

      jobsSection.appendChild(jobsList);
      container.appendChild(jobsSection);
    }

    // Career Paths
    if (completion.career_paths?.length > 0) {
      const pathsSection = createSection('Career Progression Paths', '🛤️');
      const pathsList = createElement(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        },
        {}
      );

      completion.career_paths.forEach((path, index) => {
        const pathCard = createElement(
          'div',
          {
            padding: '16px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            borderLeft: '4px solid #10b981',
          },
          {}
        );

        const pathTitle = createElement(
          'h4',
          {
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0 0 8px 0',
          },
          { textContent: `Path ${index + 1}: ${path.path || path}` }
        );
        pathCard.appendChild(pathTitle);

        if (path.steps) {
          const steps = createElement(
            'p',
            {
              fontSize: '14px',
              color: '#4b5563',
              margin: '0 0 4px 0',
            },
            { innerHTML: `<strong>Steps:</strong> ${path.steps}` }
          );
          pathCard.appendChild(steps);
        }

        if (path.timeline) {
          const timeline = createElement(
            'p',
            {
              fontSize: '13px',
              color: '#6b7280',
              margin: '0',
            },
            { innerHTML: `<strong>Timeline:</strong> ${path.timeline}` }
          );
          pathCard.appendChild(timeline);
        }

        pathsList.appendChild(pathCard);
      });

      pathsSection.appendChild(pathsList);
      container.appendChild(pathsSection);
    }

    // Skills to Develop
    if (completion.skills_to_develop?.length > 0) {
      const skillsSection = createSection('Skills to Develop', '📚');
      const skillsGrid = createElement(
        'div',
        {
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        },
        {}
      );

      completion.skills_to_develop.forEach((skill) => {
        const skillTag = createElement(
          'span',
          {
            padding: '8px 16px',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500',
          },
          { textContent: typeof skill === 'string' ? skill : skill.name || skill.skill }
        );
        skillsGrid.appendChild(skillTag);
      });

      skillsSection.appendChild(skillsGrid);
      container.appendChild(skillsSection);
    }

    // Industries
    if (completion.industries?.length > 0) {
      const industrySection = createSection('Growing Industries', '📈');
      const industryList = createElement(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        },
        {}
      );

      completion.industries.forEach((ind) => {
        const industryItem = createElement(
          'div',
          {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px',
            backgroundColor: '#fdf4ff',
            borderRadius: '8px',
          },
          {}
        );

        const name = createElement(
          'strong',
          {
            fontSize: '15px',
            color: '#1f2937',
            minWidth: '120px',
          },
          { textContent: ind.name || ind }
        );
        industryItem.appendChild(name);

        if (ind.growth_reason) {
          const reason = createElement(
            'span',
            {
              fontSize: '14px',
              color: '#6b7280',
            },
            { textContent: ind.growth_reason }
          );
          industryItem.appendChild(reason);
        }

        industryList.appendChild(industryItem);
      });

      industrySection.appendChild(industryList);
      container.appendChild(industrySection);
    }

    // Action Items
    if (completion.action_items?.length > 0) {
      const actionsSection = createSection('Next Steps', '✅');
      const actionsList = createElement(
        'ol',
        {
          margin: '0',
          paddingLeft: '20px',
        },
        {}
      );

      completion.action_items.forEach((action) => {
        const actionItem = createElement(
          'li',
          {
            fontSize: '15px',
            color: '#374151',
            marginBottom: '8px',
            paddingLeft: '8px',
          },
          { textContent: action }
        );
        actionsList.appendChild(actionItem);
      });

      actionsSection.appendChild(actionsList);
      container.appendChild(actionsSection);
    }
  }

  return container;
}

/**
 * Helper: Create a section with icon and title
 */
function createSection(title, icon) {
  const section = createElement('div', { marginBottom: '24px' }, {});

  const titleEl = createElement(
    'h2',
    {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    {}
  );
  titleEl.innerHTML = `${icon || ''} ${title}`;

  section.appendChild(titleEl);
  return section;
}

/**
 * Generate plain text career plan
 */
function toPlainText(data) {
  const lines = [];

  // Profile
  const profile = data.save_profile?.[0] || data.save_profile || {};
  if (profile.name) {
    lines.push(`CAREER PLAN FOR ${profile.name.toUpperCase()}`);
    lines.push('='.repeat(40));
    lines.push('');
  }

  // Summary
  const finalize = data.finalize_profile?.[0] || data.finalize_profile || {};
  if (finalize.summary) {
    lines.push('PROFILE SUMMARY');
    lines.push(finalize.summary);
    lines.push('');
  }

  // Education
  const education = data.save_education?.[0] || data.save_education || {};
  if (education.highest_degree) {
    lines.push('EDUCATION');
    lines.push(`  Degree: ${education.highest_degree}`);
    if (education.certifications) lines.push(`  Certifications: ${education.certifications}`);
    if (education.skills) lines.push(`  Skills: ${education.skills}`);
    lines.push('');
  }

  // Experience
  const experience = data.save_experience?.[0] || data.save_experience || {};
  if (experience.current_role) {
    lines.push('EXPERIENCE');
    lines.push(`  Current Role: ${experience.current_role}`);
    if (experience.industry) lines.push(`  Industry: ${experience.industry}`);
    if (experience.years_experience) lines.push(`  Years: ${experience.years_experience}`);
    lines.push('');
  }

  // AI Recommendations
  const completion = data._completion;
  if (completion) {
    lines.push('');
    lines.push('AI-GENERATED RECOMMENDATIONS');
    lines.push('='.repeat(40));
    lines.push('');

    if (completion.job_opportunities?.length) {
      lines.push('RECOMMENDED JOBS');
      completion.job_opportunities.forEach((job, i) => {
        lines.push(`  ${i + 1}. ${job.title || job}`);
        if (job.why_good_fit) lines.push(`     Why: ${job.why_good_fit}`);
      });
      lines.push('');
    }

    if (completion.career_paths?.length) {
      lines.push('CAREER PATHS');
      completion.career_paths.forEach((path, i) => {
        lines.push(`  ${i + 1}. ${path.path || path}`);
        if (path.steps) lines.push(`     Steps: ${path.steps}`);
      });
      lines.push('');
    }

    if (completion.skills_to_develop?.length) {
      lines.push('SKILLS TO DEVELOP');
      lines.push(`  ${completion.skills_to_develop.map((s) => (typeof s === 'string' ? s : s.name)).join(', ')}`);
      lines.push('');
    }

    if (completion.action_items?.length) {
      lines.push('NEXT STEPS');
      completion.action_items.forEach((action, i) => {
        lines.push(`  ${i + 1}. ${action}`);
      });
    }
  }

  return lines.join('\n');
}

/**
 * Generate HTML for export
 */
function toHTML(data) {
  const profile = data.save_profile?.[0] || data.save_profile || {};
  const education = data.save_education?.[0] || data.save_education || {};
  const experience = data.save_experience?.[0] || data.save_experience || {};
  const finalize = data.finalize_profile?.[0] || data.finalize_profile || {};
  const completion = data._completion || {};

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Career Plan - ${profile.name || 'Your Career'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 40px;
      color: #1f2937;
      line-height: 1.6;
    }
    h1 { color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 16px; }
    h2 { color: #1f2937; margin-top: 32px; }
    .section { margin-bottom: 24px; }
    .card { background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #6366f1; }
    .card h4 { margin: 0 0 8px 0; }
    .card p { margin: 0; color: #4b5563; }
    .skill-tag { display: inline-block; padding: 6px 14px; background: #fef3c7; color: #92400e; border-radius: 16px; margin: 4px; font-size: 14px; }
    .action-list { padding-left: 20px; }
    .action-list li { margin-bottom: 8px; }
    .ai-divider { background: #eef2ff; padding: 16px; text-align: center; border-radius: 8px; margin: 32px 0; color: #4f46e5; font-weight: 600; }
  </style>
</head>
<body>
  <h1>Career Plan for ${profile.name || 'You'}</h1>

  ${finalize.summary ? `<div class="section"><h2>Profile Summary</h2><p style="background:#f3f4f6;padding:16px;border-radius:8px;font-style:italic;">${finalize.summary}</p></div>` : ''}

  ${education.highest_degree ? `
  <div class="section">
    <h2>Education</h2>
    <p><strong>Degree:</strong> ${education.highest_degree}</p>
    ${education.certifications ? `<p><strong>Certifications:</strong> ${education.certifications}</p>` : ''}
    ${education.skills ? `<p><strong>Skills:</strong> ${education.skills}</p>` : ''}
  </div>
  ` : ''}

  ${experience.current_role ? `
  <div class="section">
    <h2>Experience</h2>
    <p><strong>Current Role:</strong> ${experience.current_role}</p>
    ${experience.industry ? `<p><strong>Industry:</strong> ${experience.industry}</p>` : ''}
    ${experience.years_experience ? `<p><strong>Years:</strong> ${experience.years_experience}</p>` : ''}
    ${experience.achievements ? `<p><strong>Achievements:</strong> ${experience.achievements}</p>` : ''}
  </div>
  ` : ''}

  ${completion.job_opportunities?.length ? `
  <div class="ai-divider">AI-Generated Career Recommendations</div>

  <div class="section">
    <h2>Recommended Job Opportunities</h2>
    ${completion.job_opportunities.map((job) => `
      <div class="card">
        <h4>${job.title || job}</h4>
        ${job.company_type ? `<p style="font-size:13px;color:#6b7280;">Company Type: ${job.company_type}</p>` : ''}
        ${job.why_good_fit ? `<p>${job.why_good_fit}</p>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${completion.career_paths?.length ? `
  <div class="section">
    <h2>Career Progression Paths</h2>
    ${completion.career_paths.map((path, i) => `
      <div class="card" style="border-left-color:#10b981;">
        <h4>Path ${i + 1}: ${path.path || path}</h4>
        ${path.steps ? `<p><strong>Steps:</strong> ${path.steps}</p>` : ''}
        ${path.timeline ? `<p style="font-size:13px;color:#6b7280;"><strong>Timeline:</strong> ${path.timeline}</p>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${completion.skills_to_develop?.length ? `
  <div class="section">
    <h2>Skills to Develop</h2>
    <div>
      ${completion.skills_to_develop.map((skill) => `<span class="skill-tag">${typeof skill === 'string' ? skill : skill.name}</span>`).join('')}
    </div>
  </div>
  ` : ''}

  ${completion.action_items?.length ? `
  <div class="section">
    <h2>Next Steps</h2>
    <ol class="action-list">
      ${completion.action_items.map((action) => `<li>${action}</li>`).join('')}
    </ol>
  </div>
  ` : ''}
</body>
</html>
  `.trim();
}

// Register the career renderer
registerRenderer('career', {
  render: renderCareer,
  toPlainText,
  toHTML,
});

export { renderCareer, toPlainText, toHTML };
