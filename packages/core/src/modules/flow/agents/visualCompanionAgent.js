/**
 * Visual Companion Agent
 * Generates dynamic visuals that display the DATA being collected during voice sessions
 * Shows the user's information forming into a beautiful result in real-time
 *
 * Uses OpenAI Agents SDK with fast model for low latency
 * Integrates with Pexels API for subtle background imagery
 */

const { Agent, run, user } = require('@openai/agents');
const { z } = require('zod');

// Pexels API configuration
const PEXELS_API_KEY = 'UOZl42WyEFaQeUkLcq9I4d85wy2oO3KLMIIiiNCot81o7sUzMcaX5ncs';
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

/**
 * Fetch an image URL from Pexels based on keywords
 */
async function fetchPexelsImage(query, size = 'medium') {
  try {
    const response = await fetch(
      `${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(5, data.photos.length));
      return data.photos[randomIndex].src[size] || data.photos[randomIndex].src.medium;
    }
    return null;
  } catch (error) {
    console.error('[VisualCompanion] Pexels fetch error:', error.message);
    return null;
  }
}

// Background image keywords per flow (subtle, not the focus)
const FLOW_BACKGROUND_KEYWORDS = {
  'resume-builder': 'minimal abstract gradient professional',
  'career-plan': 'horizon path abstract minimal',
  'macro-calculator': 'healthy lifestyle abstract minimal',
  'ai-roast-me': 'fire flames abstract dark',
  'whats-my-vibe': 'aesthetic gradient colors abstract',
  'salary-reality-check': 'finance abstract minimal clean',
  'startup-idea-validator': 'startup innovation abstract minimal',
  'dating-profile-fixer': 'romantic sunset abstract minimal',
};

// Output schema for visual companion
const visualSchema = z.object({
  html: z
    .string()
    .describe(
      'Complete HTML that visualizes the collected data beautifully. Show actual user data (names, education, skills, etc.) in a formatted, animated layout. Use the background image subtly. The data should be the FOCUS, not the image.'
    ),
  transition: z
    .string()
    .describe('Transition type: "fade", "slide-up", "scale"'),
  data_shown: z
    .string()
    .describe('Brief description of what data is being visualized'),
});

// Flow-specific visualization templates
const FLOW_VISUALIZATION_GUIDES = {
  'resume-builder': {
    type: 'Resume Preview',
    dataFields: ['fullName', 'email', 'phone', 'location', 'degree', 'institution', 'field', 'graduationYear', 'title', 'company', 'technical', 'soft'],
    visualStyle: `
      Show data as a resume card being built:
      - Header: Name large, contact info smaller below
      - Sections: Education, Experience, Skills as separate blocks
      - Use cards with subtle shadows
      - Animate new sections sliding/fading in
      - Skills as pill/tag badges
      - Use #3b82f6 as accent color
    `,
    emptyState: 'Show an elegant empty resume template with placeholder lines',
  },
  'career-plan': {
    type: 'Career Roadmap',
    dataFields: ['name', 'currentRole', 'targetRole', 'skills', 'timeline', 'goals'],
    visualStyle: `
      Show as a journey/path visualization:
      - Current position on left, target on right
      - Steps/milestones in between
      - Skills as floating badges along the path
      - Use #8b5cf6 as accent color
    `,
    emptyState: 'Show a subtle path graphic waiting for destinations',
  },
  'macro-calculator': {
    type: 'Nutrition Dashboard',
    dataFields: ['weight', 'height', 'age', 'activityLevel', 'goal', 'calories', 'protein', 'carbs', 'fat'],
    visualStyle: `
      Show as health/fitness cards:
      - Body stats in a clean card
      - Macro breakdown as pie chart or progress bars
      - Goal prominently displayed
      - Use #22c55e as accent color
    `,
    emptyState: 'Show empty macro circles ready to be filled',
  },
  'ai-roast-me': {
    type: 'Roast Profile',
    dataFields: ['name', 'job', 'personality', 'hobbies', 'roastLevel'],
    visualStyle: `
      Show with comedic flair:
      - Name with flame emojis
      - Roast-able traits listed dramatically
      - Dark background with fire accents
      - Use #ef4444 as accent color
    `,
    emptyState: 'Show a "target acquired" style graphic',
  },
  'whats-my-vibe': {
    type: 'Vibe Profile',
    dataFields: ['name', 'aesthetic', 'colors', 'music', 'energy', 'style'],
    visualStyle: `
      Show as aesthetic mood board:
      - Name with vibe emoji
      - Color palette as swatches
      - Aesthetic keywords as dreamy floating tags
      - Use soft gradients and pastels
    `,
    emptyState: 'Show subtle color orbs floating',
  },
  'salary-reality-check': {
    type: 'Salary Analysis',
    dataFields: ['role', 'experience', 'location', 'currentSalary', 'targetSalary', 'skills'],
    visualStyle: `
      Show as financial dashboard:
      - Role and experience prominently
      - Salary as large number with range bar
      - Skills as value-add badges
      - Use greens for positive, professional blues
    `,
    emptyState: 'Show subtle salary range placeholder',
  },
  'startup-idea-validator': {
    type: 'Pitch Deck Card',
    dataFields: ['name', 'idea', 'problem', 'solution', 'market', 'competitors', 'model'],
    visualStyle: `
      Show as investor pitch card:
      - Idea name as title
      - Problem/Solution as two panels
      - Market size if mentioned
      - Use #6366f1 as accent color
    `,
    emptyState: 'Show "Your Pitch" placeholder card',
  },
  'dating-profile-fixer': {
    type: 'Dating Profile Preview',
    dataFields: ['name', 'age', 'bio', 'interests', 'lookingFor', 'dealbreakers'],
    visualStyle: `
      Show as dating app profile card:
      - Name and age prominently
      - Bio text styled nicely
      - Interests as heart-tagged badges
      - Use #ec4899 as accent color
    `,
    emptyState: 'Show a profile card outline with heart accents',
  },
};

// Agent instructions focused on DATA VISUALIZATION
const visualCompanionInstructions = `You visualize the DATA being collected during a voice conversation. Your job is to show the user their information forming into a beautiful result IN REAL-TIME.

## YOUR CORE MISSION

Take the collected data and display it beautifully. This is NOT about mood or atmosphere - it's about showing the user THEIR DATA in a visually appealing way as the conversation progresses.

## WHAT YOU CREATE

You create a live preview of the user's result being built:
- For a resume flow: Show their resume forming (name, education, experience appearing)
- For a vibe check: Show their vibe profile building (colors, aesthetic, traits appearing)
- For a salary check: Show their salary analysis forming (role, range, skills)

## DATA VISUALIZATION PRINCIPLES

### 1. SHOW ACTUAL DATA
If user said their name is "John Doe", show "John Doe" - not a placeholder.
If they went to Stanford, show "Stanford" - not generic education icon.

### 2. BUILD PROGRESSIVELY
- Early conversation: Show what's collected so far, placeholders for the rest
- Mid conversation: More sections filled in, structure visible
- Late conversation: Nearly complete preview

### 3. HIGHLIGHT NEW DATA
When new data arrives, make it visually prominent:
- Fade/slide animation for new sections
- Subtle glow on just-added content
- The newest data should catch the eye

### 4. EMPTY STATES
When a section has no data yet, show elegant placeholders:
- Subtle dashed outlines
- "Awaiting..." text in muted color
- Skeleton-like shapes

## HTML STRUCTURE TEMPLATE

\`\`\`html
<div style="position: relative; width: 100%; height: 100%; overflow: hidden; padding: 16px; box-sizing: border-box;">
  <!-- Subtle background image (low opacity, blurred) -->
  <img src="[BACKGROUND_URL]" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.15; filter: blur(8px);" />

  <!-- Dark overlay for readability -->
  <div style="position: absolute; inset: 0; background: linear-gradient(135deg, rgba(28,25,23,0.95), rgba(28,25,23,0.85));"></div>

  <!-- DATA CONTENT - This is the FOCUS -->
  <div style="position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; gap: 12px;">

    <!-- Header with collected name/title -->
    <div style="text-align: center;">
      <h2 style="color: #fafaf9; font-size: 20px; margin: 0;">John Doe</h2>
      <p style="color: #a8a29e; font-size: 12px; margin: 4px 0 0;">Software Engineer</p>
    </div>

    <!-- Data sections -->
    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 12px; opacity: 0; animation: slideIn 0.5s ease forwards;">
      <h3 style="color: [THEME_COLOR]; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Education</h3>
      <p style="color: #fafaf9; font-size: 14px; margin: 0;">Stanford University</p>
      <p style="color: #a8a29e; font-size: 12px; margin: 2px 0 0;">Computer Science, 2020</p>
    </div>

    <!-- Empty state example -->
    <div style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; padding: 12px;">
      <h3 style="color: #57534e; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Experience</h3>
      <p style="color: #44403c; font-size: 12px; margin: 0;">Awaiting details...</p>
    </div>

  </div>

  <style>
    @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</div>
\`\`\`

## VISUAL STYLING RULES

1. **Background**: Use provided image at very low opacity (0.1-0.2) with blur, covered by dark gradient
2. **Cards**: Semi-transparent backgrounds (rgba(255,255,255,0.05)), rounded corners
3. **Typography**:
   - Names/titles: #fafaf9, larger
   - Labels: Theme color, uppercase, small
   - Values: #fafaf9, medium
   - Muted: #a8a29e or #78716c
4. **Animations**: Subtle slide/fade for new content (0.3-0.5s)
5. **Empty states**: Dashed borders, muted text "Awaiting..."

## WHAT NOT TO DO

❌ Don't show generic mood imagery as the focus
❌ Don't use placeholder text when you have real data
❌ Don't make it look like a loading screen
❌ Don't show data as a boring list - make it beautiful
❌ Don't ignore the empty sections - show elegant placeholders
❌ Don't make animations jarring or too fast

## EXAMPLES BY DATA STATE

### Early (just name collected):
- Big name in center
- Empty cards below for upcoming sections
- Feels like a canvas waiting to be filled

### Mid (name + education + some experience):
- Name header
- Education card filled in with animation
- Experience card starting to populate
- Skills still empty placeholder

### Late (most data collected):
- Full preview of result
- All sections populated
- Polish/glow effects
- "Almost complete" feeling

Remember: You're showing the user their own data beautifully formatted, not creating abstract art.
`;

const visualCompanionAgent = new Agent({
  name: 'VisualCompanionAgent',
  instructions: visualCompanionInstructions,
  model: 'gpt-4o-mini',
  outputType: visualSchema,
});

/**
 * Parse collected data into a structured format for the prompt
 */
function formatCollectedData(collectedData) {
  if (!collectedData || Object.keys(collectedData).length === 0) {
    return 'No data collected yet.';
  }

  const sections = [];

  for (const [toolName, data] of Object.entries(collectedData)) {
    if (!data) continue;

    // Handle both single objects and arrays
    const dataArray = Array.isArray(data) ? data : [data];

    for (const item of dataArray) {
      if (typeof item === 'object') {
        const fields = Object.entries(item)
          .filter(([k, v]) => v !== null && v !== undefined && v !== '')
          .map(([k, v]) => `  - ${k}: "${v}"`)
          .join('\n');

        if (fields) {
          sections.push(`**${toolName}**:\n${fields}`);
        }
      } else if (item) {
        sections.push(`**${toolName}**: "${item}"`);
      }
    }
  }

  return sections.length > 0 ? sections.join('\n\n') : 'No data collected yet.';
}

/**
 * Determine what phase of data collection we're in
 */
function getDataPhase(collectedData) {
  const dataCount = Object.keys(collectedData || {}).length;
  if (dataCount === 0) return 'empty';
  if (dataCount <= 2) return 'early';
  if (dataCount <= 4) return 'mid';
  return 'late';
}

/**
 * Generate a visual companion for the current conversation state
 */
async function generateVisual({
  flowId,
  flowConfig,
  currentAgent,
  conversationHistory = [],
  collectedData = {},
  turnNumber = 1,
  lastUserMessage = '',
  lastAssistantMessage = '',
}) {
  const vizGuide = FLOW_VISUALIZATION_GUIDES[flowId] || FLOW_VISUALIZATION_GUIDES['resume-builder'];
  const themeColor = flowConfig?.output_schema?.theme_color || '#3b82f6';
  const dataPhase = getDataPhase(collectedData);
  const formattedData = formatCollectedData(collectedData);

  // Fetch subtle background image
  const bgKeywords = FLOW_BACKGROUND_KEYWORDS[flowId] || 'abstract minimal gradient';
  let backgroundUrl = null;
  try {
    backgroundUrl = await fetchPexelsImage(bgKeywords, 'large');
  } catch (error) {
    console.error('[VisualCompanion] Failed to fetch background:', error);
  }

  const prompt = `
## FLOW TYPE: ${vizGuide.type}
## THEME COLOR: ${themeColor}
## DATA PHASE: ${dataPhase.toUpperCase()}

## VISUALIZATION STYLE FOR THIS FLOW
${vizGuide.visualStyle}

## EMPTY STATE (when no data for a section)
${vizGuide.emptyState}

## BACKGROUND IMAGE
${backgroundUrl ? `Use this as a subtle background (opacity 0.1-0.2, blurred): ${backgroundUrl}` : 'No background image - use subtle gradient only'}

## COLLECTED DATA TO VISUALIZE
${formattedData}

## CURRENT AGENT: ${currentAgent || 'Assistant'}
## LAST USER MESSAGE: "${lastUserMessage || '(none)'}"

## YOUR TASK

Create an HTML visual that:
1. Shows ALL the collected data above in a beautiful ${vizGuide.type} format
2. Uses elegant empty states for sections not yet filled
3. Highlights the most recently collected data with animation
4. Uses ${themeColor} as the accent color
5. Has the background image very subtle (if available)
6. Makes the DATA the focus, not the background

${dataPhase === 'empty' ? 'Show the empty state template - waiting for data.' : ''}
${dataPhase === 'early' ? 'Show what we have prominently, with clear placeholders for what\'s coming.' : ''}
${dataPhase === 'mid' ? 'Show a nicely filling preview - structure is clear, some sections complete.' : ''}
${dataPhase === 'late' ? 'Show a nearly complete preview - polish it, make it feel ready.' : ''}

Remember: Display the ACTUAL DATA provided above. If name is "John", show "John". If school is "MIT", show "MIT".
`;

  try {
    const result = await run(visualCompanionAgent, [user(prompt)], {
      stream: false,
      maxTurns: 1,
    });

    // Extract output
    let output = result.finalOutput;

    if (!output) {
      const currentStep = result.currentStep || result._currentStep || result.state?._currentStep;
      if (currentStep?.output) {
        output = typeof currentStep.output === 'string' ? JSON.parse(currentStep.output) : currentStep.output;
      }
    }

    if (!output && result.generatedItems) {
      for (let i = result.generatedItems.length - 1; i >= 0; i--) {
        const item = result.generatedItems[i];
        if (item.type === 'message_output_item' && item.rawItem?.content?.[0]?.text) {
          try {
            output = JSON.parse(item.rawItem.content[0].text);
            break;
          } catch (e) {
            console.warn('[VisualCompanion] Failed to parse generated item as JSON:', e);
          }
        }
      }
    }

    if (output) {
      return {
        html: output.html,
        transition: output.transition || 'fade',
        data_shown: output.data_shown || 'collected data',
        phase: dataPhase,
        background_url: backgroundUrl,
        success: true,
      };
    }

    return generateFallbackVisual(flowId, flowConfig, dataPhase, collectedData, backgroundUrl);

  } catch (error) {
    console.error('[VisualCompanionAgent] Error:', error);
    return generateFallbackVisual(flowId, flowConfig, dataPhase, collectedData, backgroundUrl);
  }
}

/**
 * Generate a fallback visual that shows the data
 */
function generateFallbackVisual(flowId, flowConfig, dataPhase, collectedData, backgroundUrl) {
  const themeColor = flowConfig?.output_schema?.theme_color || '#3b82f6';
  const flowName = flowConfig?.name || 'Experience';

  // Build data display from collected data
  let dataHtml = '';
  if (collectedData && Object.keys(collectedData).length > 0) {
    for (const [tool, data] of Object.entries(collectedData)) {
      if (!data) continue;
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (typeof item === 'object') {
          const entries = Object.entries(item).filter(([k, v]) => v);
          if (entries.length > 0) {
            dataHtml += `
              <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 12px; animation: slideIn 0.4s ease forwards;">
                <h3 style="color: ${themeColor}; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">${tool.replace(/_/g, ' ')}</h3>
                ${entries.map(([k, v]) => `<p style="color: #fafaf9; font-size: 13px; margin: 4px 0;"><span style="color: #78716c;">${k}:</span> ${v}</p>`).join('')}
              </div>
            `;
          }
        }
      }
    }
  }

  if (!dataHtml) {
    dataHtml = `
      <div style="text-align: center; color: #57534e; padding: 40px 20px;">
        <div style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;">📝</div>
        <p style="margin: 0; font-size: 14px;">Waiting for your information...</p>
      </div>
    `;
  }

  const bgHtml = backgroundUrl
    ? `<img src="${backgroundUrl}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.1; filter: blur(10px);" />`
    : '';

  return {
    html: `
      <div style="position: relative; width: 100%; height: 100%; overflow: auto; padding: 16px; box-sizing: border-box;">
        ${bgHtml}
        <div style="position: absolute; inset: 0; background: linear-gradient(135deg, rgba(28,25,23,0.95), rgba(28,25,23,0.9));"></div>
        <div style="position: relative; z-index: 1; display: flex; flex-direction: column; gap: 12px;">
          <h2 style="color: #fafaf9; font-size: 16px; text-align: center; margin: 0 0 8px; font-weight: 500;">${flowName}</h2>
          ${dataHtml}
        </div>
        <style>
          @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        </style>
      </div>
    `,
    transition: 'fade',
    data_shown: 'collected data fallback',
    phase: dataPhase,
    background_url: backgroundUrl,
    success: true,
    fallback: true,
  };
}

module.exports = {
  visualCompanionAgent,
  visualSchema,
  generateVisual,
  generateFallbackVisual,
  fetchPexelsImage,
  FLOW_VISUALIZATION_GUIDES,
  FLOW_BACKGROUND_KEYWORDS,
};
