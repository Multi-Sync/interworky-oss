// src/assistant/modes/flowEngine/renderers/resumeRenderer.js
/**
 * Professional Resume Renderer
 */

import { createElement } from '../../../ui/baseMethods';
import { registerRenderer, extractValue, extractAllValues, parseSummary } from './index';

/**
 * Render a professional resume from flow data
 */
function renderResume(data, config) {
  const container = createElement(
    'div',
    {
      padding: '48px',
      fontFamily: "'Georgia', 'Times New Roman', serif",
      lineHeight: '1.6',
      color: '#1f2937',
    },
    { id: 'resume-content' }
  );

  // Contact Header
  const contact = extractValue(data, 'save_contact_info');
  if (contact) {
    const header = createElement(
      'div',
      {
        textAlign: 'center',
        marginBottom: '32px',
        paddingBottom: '24px',
        borderBottom: '2px solid #1f2937',
      },
      {}
    );

    const name = createElement(
      'h1',
      {
        fontSize: '32px',
        fontWeight: 'bold',
        margin: '0 0 8px 0',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: '#111827',
      },
      { textContent: contact.fullName || 'Your Name' }
    );

    const contactInfo = createElement(
      'p',
      {
        fontSize: '14px',
        color: '#4b5563',
        margin: '0',
      },
      {}
    );

    const parts = [];
    if (contact.email) parts.push(contact.email);
    if (contact.phone) parts.push(contact.phone);
    if (contact.location) parts.push(contact.location);
    contactInfo.textContent = parts.join(' | ');

    header.appendChild(name);
    header.appendChild(contactInfo);
    container.appendChild(header);
  }

  // Professional Summary
  const summary = parseSummary(data);
  if (summary) {
    const summarySection = createSection('Professional Summary');
    const summaryText = createElement(
      'p',
      {
        fontSize: '14px',
        fontStyle: 'italic',
        color: '#374151',
        margin: '0',
        textAlign: 'justify',
      },
      { textContent: summary }
    );
    summarySection.appendChild(summaryText);
    container.appendChild(summarySection);
  }

  // Work Experience
  const workEntries = extractAllValues(data, 'save_work_experience');
  if (workEntries.length > 0) {
    const workSection = createSection('Professional Experience');

    workEntries.forEach((job) => {
      const entry = createElement('div', { marginBottom: '20px' }, {});

      const titleRow = createElement(
        'div',
        {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
        },
        {}
      );

      const jobTitle = createElement(
        'h3',
        {
          fontSize: '16px',
          fontWeight: 'bold',
          margin: '0',
          color: '#111827',
        },
        { textContent: job.title || 'Position' }
      );

      const dates = createElement(
        'span',
        {
          fontSize: '14px',
          color: '#6b7280',
        },
        { textContent: `${job.startDate || ''} - ${job.endDate || 'Present'}` }
      );

      titleRow.appendChild(jobTitle);
      titleRow.appendChild(dates);

      const company = createElement(
        'p',
        {
          fontSize: '14px',
          fontStyle: 'italic',
          color: '#4b5563',
          margin: '4px 0 8px 0',
        },
        { textContent: job.company || '' }
      );

      entry.appendChild(titleRow);
      entry.appendChild(company);

      // Responsibilities as bullet points
      if (job.responsibilities) {
        const respList = createElement(
          'ul',
          {
            margin: '8px 0 0 0',
            paddingLeft: '20px',
          },
          {}
        );

        const respItems = job.responsibilities.split(',').map((r) => r.trim());
        respItems.forEach((resp) => {
          if (resp) {
            const li = createElement(
              'li',
              {
                fontSize: '14px',
                color: '#374151',
                marginBottom: '4px',
              },
              { textContent: resp }
            );
            respList.appendChild(li);
          }
        });
        entry.appendChild(respList);
      }

      workSection.appendChild(entry);
    });

    container.appendChild(workSection);
  }

  // Education
  const eduEntries = extractAllValues(data, 'save_education');
  if (eduEntries.length > 0) {
    const eduSection = createSection('Education');

    eduEntries.forEach((edu) => {
      const entry = createElement('div', { marginBottom: '16px' }, {});

      const titleRow = createElement(
        'div',
        {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
        },
        {}
      );

      const degree = createElement(
        'h3',
        {
          fontSize: '16px',
          fontWeight: 'bold',
          margin: '0',
          color: '#111827',
        },
        { textContent: `${edu.degree || 'Degree'} in ${edu.field || 'Field'}` }
      );

      const year = createElement(
        'span',
        {
          fontSize: '14px',
          color: '#6b7280',
        },
        { textContent: edu.graduationYear ? String(edu.graduationYear) : '' }
      );

      titleRow.appendChild(degree);
      titleRow.appendChild(year);

      const institution = createElement(
        'p',
        {
          fontSize: '14px',
          fontStyle: 'italic',
          color: '#4b5563',
          margin: '4px 0 0 0',
        },
        { textContent: edu.institution || '' }
      );

      entry.appendChild(titleRow);
      entry.appendChild(institution);

      if (edu.gpa) {
        const gpa = createElement(
          'p',
          {
            fontSize: '13px',
            color: '#6b7280',
            margin: '4px 0 0 0',
          },
          { textContent: `GPA: ${edu.gpa}` }
        );
        entry.appendChild(gpa);
      }

      eduSection.appendChild(entry);
    });

    container.appendChild(eduSection);
  }

  // Skills
  const skillsEntries = extractAllValues(data, 'save_skills');
  if (skillsEntries.length > 0) {
    const skillsSection = createSection('Skills');
    const skills = skillsEntries[0] || {};

    const skillsGrid = createElement(
      'div',
      {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      },
      {}
    );

    if (skills.technical) {
      const techSkills = createSkillCategory('Technical Skills', skills.technical);
      skillsGrid.appendChild(techSkills);
    }

    if (skills.soft) {
      const softSkills = createSkillCategory('Soft Skills', skills.soft);
      skillsGrid.appendChild(softSkills);
    }

    if (skills.languages) {
      const langSkills = createSkillCategory('Languages', skills.languages);
      skillsGrid.appendChild(langSkills);
    }

    skillsSection.appendChild(skillsGrid);

    if (skills.certifications) {
      const certTitle = createElement(
        'h4',
        {
          fontSize: '14px',
          fontWeight: 'bold',
          marginTop: '16px',
          marginBottom: '8px',
          color: '#374151',
        },
        { textContent: 'Certifications' }
      );
      const certText = createElement(
        'p',
        {
          fontSize: '14px',
          color: '#4b5563',
          margin: '0',
        },
        { textContent: skills.certifications }
      );
      skillsSection.appendChild(certTitle);
      skillsSection.appendChild(certText);
    }

    container.appendChild(skillsSection);
  }

  return container;
}

/**
 * Helper: Create a section with title
 */
function createSection(title) {
  const section = createElement('div', { marginBottom: '28px' }, {});

  const titleEl = createElement(
    'h2',
    {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#111827',
      borderBottom: '1px solid #d1d5db',
      paddingBottom: '8px',
      marginBottom: '16px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    { textContent: title }
  );

  section.appendChild(titleEl);
  return section;
}

/**
 * Helper: Create skill category
 */
function createSkillCategory(title, skills) {
  const container = createElement('div', {}, {});

  const titleEl = createElement(
    'h4',
    {
      fontSize: '14px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: '#374151',
    },
    { textContent: title }
  );

  const skillsList = createElement(
    'p',
    {
      fontSize: '14px',
      color: '#4b5563',
      margin: '0',
    },
    { textContent: skills }
  );

  container.appendChild(titleEl);
  container.appendChild(skillsList);
  return container;
}

/**
 * Generate plain text resume
 */
function toPlainText(data) {
  const lines = [];

  // Contact
  const contact = data.save_contact_info?.[0] || data.save_contact_info || {};
  if (contact.fullName) {
    lines.push(contact.fullName.toUpperCase());
    lines.push('='.repeat(contact.fullName.length));
    const contactParts = [];
    if (contact.email) contactParts.push(contact.email);
    if (contact.phone) contactParts.push(contact.phone);
    if (contact.location) contactParts.push(contact.location);
    if (contactParts.length) lines.push(contactParts.join(' | '));
    lines.push('');
  }

  // Summary
  const summary = parseSummary(data);
  if (summary) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push('-'.repeat(20));
    lines.push(summary);
    lines.push('');
  }

  // Work Experience
  const work = data.save_work_experience || [];
  const workArr = Array.isArray(work) ? work : [work];
  if (workArr.length > 0 && workArr[0]) {
    lines.push('PROFESSIONAL EXPERIENCE');
    lines.push('-'.repeat(23));
    workArr.forEach((job) => {
      lines.push(`${job.title} at ${job.company}`);
      lines.push(`${job.startDate} - ${job.endDate || 'Present'}`);
      if (job.responsibilities) {
        job.responsibilities.split(',').forEach((r) => {
          if (r.trim()) lines.push(`  • ${r.trim()}`);
        });
      }
      lines.push('');
    });
  }

  // Education
  const edu = data.save_education || [];
  const eduArr = Array.isArray(edu) ? edu : [edu];
  if (eduArr.length > 0 && eduArr[0]) {
    lines.push('EDUCATION');
    lines.push('-'.repeat(9));
    eduArr.forEach((e) => {
      lines.push(`${e.degree} in ${e.field}`);
      lines.push(`${e.institution}${e.graduationYear ? `, ${e.graduationYear}` : ''}`);
      lines.push('');
    });
  }

  // Skills
  const skills = data.save_skills?.[0] || data.save_skills || {};
  if (skills.technical || skills.soft) {
    lines.push('SKILLS');
    lines.push('-'.repeat(6));
    if (skills.technical) lines.push(`Technical: ${skills.technical}`);
    if (skills.soft) lines.push(`Soft Skills: ${skills.soft}`);
    if (skills.languages) lines.push(`Languages: ${skills.languages}`);
    if (skills.certifications) lines.push(`Certifications: ${skills.certifications}`);
  }

  return lines.join('\n');
}

/**
 * Generate HTML for export
 */
function toHTML(data) {
  const contact = data.save_contact_info?.[0] || data.save_contact_info || {};
  const summary = parseSummary(data);
  const workArr = Array.isArray(data.save_work_experience)
    ? data.save_work_experience
    : [data.save_work_experience].filter(Boolean);
  const eduArr = Array.isArray(data.save_education)
    ? data.save_education
    : [data.save_education].filter(Boolean);
  const skills = data.save_skills?.[0] || data.save_skills || {};

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${contact.fullName || 'Resume'}</title>
  <style>
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 40px;
      color: #1f2937;
      line-height: 1.6;
    }
    h1 {
      text-align: center;
      font-size: 28px;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .contact {
      text-align: center;
      color: #4b5563;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 2px solid #1f2937;
    }
    h2 {
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 2px;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 8px;
      margin-top: 24px;
    }
    .entry { margin-bottom: 16px; }
    .entry-header { display: flex; justify-content: space-between; }
    .entry-title { font-weight: bold; }
    .entry-date { color: #6b7280; }
    .entry-subtitle { font-style: italic; color: #4b5563; }
    ul { margin: 8px 0; padding-left: 20px; }
    li { margin-bottom: 4px; }
    .summary { font-style: italic; text-align: justify; }
    .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .skill-category h4 { margin: 0 0 4px 0; font-size: 14px; }
    .skill-category p { margin: 0; color: #4b5563; }
  </style>
</head>
<body>
  <h1>${contact.fullName || 'Your Name'}</h1>
  <p class="contact">${[contact.email, contact.phone, contact.location].filter(Boolean).join(' | ')}</p>

  ${summary ? `<h2>Professional Summary</h2><p class="summary">${summary}</p>` : ''}

  ${workArr.length > 0 ? `
  <h2>Professional Experience</h2>
  ${workArr.map((job) => `
    <div class="entry">
      <div class="entry-header">
        <span class="entry-title">${job.title}</span>
        <span class="entry-date">${job.startDate} - ${job.endDate || 'Present'}</span>
      </div>
      <div class="entry-subtitle">${job.company}</div>
      ${job.responsibilities ? `<ul>${job.responsibilities.split(',').map((r) => `<li>${r.trim()}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('')}
  ` : ''}

  ${eduArr.length > 0 ? `
  <h2>Education</h2>
  ${eduArr.map((e) => `
    <div class="entry">
      <div class="entry-header">
        <span class="entry-title">${e.degree} in ${e.field}</span>
        <span class="entry-date">${e.graduationYear || ''}</span>
      </div>
      <div class="entry-subtitle">${e.institution}</div>
    </div>
  `).join('')}
  ` : ''}

  ${skills.technical || skills.soft ? `
  <h2>Skills</h2>
  <div class="skills-grid">
    ${skills.technical ? `<div class="skill-category"><h4>Technical</h4><p>${skills.technical}</p></div>` : ''}
    ${skills.soft ? `<div class="skill-category"><h4>Soft Skills</h4><p>${skills.soft}</p></div>` : ''}
  </div>
  ${skills.certifications ? `<p style="margin-top: 12px;"><strong>Certifications:</strong> ${skills.certifications}</p>` : ''}
  ` : ''}
</body>
</html>
  `.trim();
}

// Register the resume renderer
registerRenderer('resume', {
  render: renderResume,
  toPlainText,
  toHTML,
});

export { renderResume, toPlainText, toHTML };
