// src/assistant/modes/flowEngine/renderers/macroRenderer.js
/**
 * Macro Calculator Renderer
 * Displays personalized macro recommendations with visual charts
 */

import { createElement } from '../../../ui/baseMethods';
import { registerRenderer, extractValue } from './index';

/**
 * Render macro calculator results
 */
function renderMacro(data, config) {
  const container = createElement(
    'div',
    {
      padding: '32px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      lineHeight: '1.6',
      color: '#1f2937',
    },
    { id: 'macro-content' }
  );

  // User Profile Header
  const profile = extractValue(data, 'save_profile');
  const metrics = extractValue(data, 'save_body_metrics');

  if (profile?.name) {
    const header = createElement(
      'div',
      {
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '2px solid #10b981',
      },
      {}
    );

    const greeting = createElement(
      'h1',
      {
        fontSize: '24px',
        fontWeight: 'bold',
        margin: '0 0 8px 0',
        color: '#1f2937',
      },
      { textContent: `${profile.name}'s Macro Plan` }
    );
    header.appendChild(greeting);

    if (metrics) {
      const statsRow = createElement(
        'div',
        {
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          fontSize: '14px',
          color: '#6b7280',
        },
        {}
      );

      if (metrics.weight) {
        const unit = metrics.weight_unit || 'lbs';
        statsRow.innerHTML += `<span>Weight: <strong>${metrics.weight} ${unit}</strong></span>`;
      }
      if (metrics.height_feet) {
        statsRow.innerHTML += `<span>Height: <strong>${metrics.height_feet}'${metrics.height_inches || 0}"</strong></span>`;
      } else if (metrics.height_cm) {
        statsRow.innerHTML += `<span>Height: <strong>${metrics.height_cm} cm</strong></span>`;
      }
      if (metrics.age) {
        statsRow.innerHTML += `<span>Age: <strong>${metrics.age}</strong></span>`;
      }

      header.appendChild(statsRow);
    }

    container.appendChild(header);
  }

  // Completion Results - AI Calculations
  const completion = data._completion;
  if (completion) {
    // Calories Card
    if (completion.calories) {
      const caloriesCard = createCard('Daily Calories', '#10b981');

      const calorieDisplay = createElement(
        'div',
        {
          textAlign: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '12px',
          color: '#fff',
          marginBottom: '16px',
        },
        {}
      );

      const targetCal = createElement(
        'div',
        {
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '4px',
        },
        { textContent: `${completion.calories.target?.toLocaleString() || '---'}` }
      );

      const calLabel = createElement(
        'div',
        {
          fontSize: '14px',
          opacity: '0.9',
        },
        { textContent: 'calories per day' }
      );

      calorieDisplay.appendChild(targetCal);
      calorieDisplay.appendChild(calLabel);
      caloriesCard.appendChild(calorieDisplay);

      // BMR and TDEE breakdown
      const breakdown = createElement(
        'div',
        {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '12px',
        },
        {}
      );

      if (completion.calories.bmr) {
        breakdown.appendChild(createStatBox('BMR', completion.calories.bmr, 'Base metabolism'));
      }
      if (completion.calories.tdee) {
        breakdown.appendChild(createStatBox('TDEE', completion.calories.tdee, 'Maintenance'));
      }

      caloriesCard.appendChild(breakdown);

      if (completion.calories.explanation) {
        const explanation = createElement(
          'p',
          {
            fontSize: '13px',
            color: '#6b7280',
            margin: '0',
            padding: '12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
          },
          { textContent: completion.calories.explanation }
        );
        caloriesCard.appendChild(explanation);
      }

      container.appendChild(caloriesCard);
    }

    // Macros Breakdown
    if (completion.macros) {
      const macrosCard = createCard('Your Macros', '#6366f1');

      const macrosGrid = createElement(
        'div',
        {
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '16px',
        },
        {}
      );

      // Protein
      if (completion.macros.protein) {
        macrosGrid.appendChild(
          createMacroBox('Protein', completion.macros.protein, '#ef4444')
        );
      }

      // Carbs
      if (completion.macros.carbs) {
        macrosGrid.appendChild(
          createMacroBox('Carbs', completion.macros.carbs, '#f59e0b')
        );
      }

      // Fats
      if (completion.macros.fats) {
        macrosGrid.appendChild(
          createMacroBox('Fats', completion.macros.fats, '#3b82f6')
        );
      }

      macrosCard.appendChild(macrosGrid);

      // Visual bar chart
      const barChart = createMacroBarChart(completion.macros);
      macrosCard.appendChild(barChart);

      container.appendChild(macrosCard);
    }

    // Meal Breakdown
    if (completion.meal_breakdown) {
      const mealCard = createCard('Meal Breakdown', '#f59e0b');

      const perMeal = completion.meal_breakdown.per_meal;
      if (perMeal) {
        const mealGrid = createElement(
          'div',
          {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '16px',
            textAlign: 'center',
          },
          {}
        );

        mealGrid.appendChild(createMealStat('Calories', perMeal.calories));
        mealGrid.appendChild(createMealStat('Protein', `${perMeal.protein}g`));
        mealGrid.appendChild(createMealStat('Carbs', `${perMeal.carbs}g`));
        mealGrid.appendChild(createMealStat('Fats', `${perMeal.fats}g`));

        const perMealLabel = createElement(
          'p',
          {
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'center',
            margin: '0 0 16px 0',
          },
          { textContent: `Per meal (${completion.meal_breakdown.meals_per_day || 4} meals/day)` }
        );

        mealCard.appendChild(mealGrid);
        mealCard.appendChild(perMealLabel);
      }

      // Timing suggestions
      if (completion.meal_breakdown.pre_workout || completion.meal_breakdown.post_workout) {
        const timingContainer = createElement(
          'div',
          {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          },
          {}
        );

        if (completion.meal_breakdown.pre_workout) {
          timingContainer.appendChild(
            createTimingTip('Pre-Workout', completion.meal_breakdown.pre_workout)
          );
        }
        if (completion.meal_breakdown.post_workout) {
          timingContainer.appendChild(
            createTimingTip('Post-Workout', completion.meal_breakdown.post_workout)
          );
        }

        mealCard.appendChild(timingContainer);
      }

      container.appendChild(mealCard);
    }

    // Food Suggestions
    if (completion.food_suggestions) {
      const foodCard = createCard('Food Suggestions', '#8b5cf6');

      const foodGrid = createElement(
        'div',
        {
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '16px',
        },
        {}
      );

      if (completion.food_suggestions.protein_sources?.length) {
        foodGrid.appendChild(
          createFoodList('Protein', completion.food_suggestions.protein_sources, '#ef4444')
        );
      }
      if (completion.food_suggestions.carb_sources?.length) {
        foodGrid.appendChild(
          createFoodList('Carbs', completion.food_suggestions.carb_sources, '#f59e0b')
        );
      }
      if (completion.food_suggestions.fat_sources?.length) {
        foodGrid.appendChild(
          createFoodList('Fats', completion.food_suggestions.fat_sources, '#3b82f6')
        );
      }

      foodCard.appendChild(foodGrid);

      // Meal ideas
      if (completion.food_suggestions.meal_ideas?.length) {
        const mealIdeasTitle = createElement(
          'h4',
          {
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            margin: '16px 0 8px 0',
          },
          { textContent: 'Meal Ideas' }
        );
        foodCard.appendChild(mealIdeasTitle);

        const mealIdeasList = createElement(
          'div',
          {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          },
          {}
        );

        completion.food_suggestions.meal_ideas.forEach((idea) => {
          const ideaTag = createElement(
            'span',
            {
              padding: '6px 12px',
              backgroundColor: '#f3e8ff',
              color: '#7c3aed',
              borderRadius: '16px',
              fontSize: '13px',
            },
            { textContent: idea }
          );
          mealIdeasList.appendChild(ideaTag);
        });

        foodCard.appendChild(mealIdeasList);
      }

      container.appendChild(foodCard);
    }

    // Weekly Tips
    if (completion.weekly_tips?.length) {
      const tipsCard = createCard('Weekly Tips', '#06b6d4');

      const tipsList = createElement('div', { display: 'flex', flexDirection: 'column', gap: '8px' }, {});

      completion.weekly_tips.forEach((tip, index) => {
        const tipItem = createElement(
          'div',
          {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px',
            backgroundColor: '#f0fdfa',
            borderRadius: '8px',
          },
          {}
        );

        const tipNum = createElement(
          'span',
          {
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#06b6d4',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            flexShrink: '0',
          },
          { textContent: `${index + 1}` }
        );

        const tipText = createElement(
          'span',
          {
            fontSize: '14px',
            color: '#374151',
          },
          { textContent: tip }
        );

        tipItem.appendChild(tipNum);
        tipItem.appendChild(tipText);
        tipsList.appendChild(tipItem);
      });

      tipsCard.appendChild(tipsList);
      container.appendChild(tipsCard);
    }

    // Adjustments
    if (completion.adjustments) {
      const adjustCard = createCard('Progress Adjustments', '#64748b');

      const adjustGrid = createElement(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        },
        {}
      );

      if (completion.adjustments.if_not_losing) {
        adjustGrid.appendChild(
          createAdjustmentTip('Not seeing results?', completion.adjustments.if_not_losing, '#f59e0b')
        );
      }
      if (completion.adjustments.if_too_fast) {
        adjustGrid.appendChild(
          createAdjustmentTip('Losing too fast?', completion.adjustments.if_too_fast, '#10b981')
        );
      }
      if (completion.adjustments.plateau_breaker) {
        adjustGrid.appendChild(
          createAdjustmentTip('Hit a plateau?', completion.adjustments.plateau_breaker, '#6366f1')
        );
      }

      adjustCard.appendChild(adjustGrid);
      container.appendChild(adjustCard);
    }
  }

  return container;
}

// Helper functions

function createCard(title, color) {
  const card = createElement(
    'div',
    {
      marginBottom: '24px',
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      borderTop: `4px solid ${color}`,
    },
    {}
  );

  const cardTitle = createElement(
    'h3',
    {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f2937',
      margin: '0 0 16px 0',
    },
    { textContent: title }
  );

  card.appendChild(cardTitle);
  return card;
}

function createStatBox(label, value, sublabel) {
  const box = createElement(
    'div',
    {
      padding: '12px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      textAlign: 'center',
    },
    {}
  );

  box.innerHTML = `
    <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">${label}</div>
    <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${value?.toLocaleString() || '--'}</div>
    <div style="font-size: 11px; color: #6b7280;">${sublabel}</div>
  `;

  return box;
}

function createMacroBox(label, macro, color) {
  const box = createElement(
    'div',
    {
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      textAlign: 'center',
      borderLeft: `4px solid ${color}`,
    },
    {}
  );

  box.innerHTML = `
    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${label}</div>
    <div style="font-size: 32px; font-weight: bold; color: ${color};">${macro.grams || '--'}g</div>
    <div style="font-size: 12px; color: #9ca3af;">${macro.calories || '--'} cal (${macro.percentage || '--'}%)</div>
  `;

  return box;
}

function createMacroBarChart(macros) {
  const container = createElement(
    'div',
    {
      display: 'flex',
      height: '24px',
      borderRadius: '12px',
      overflow: 'hidden',
      marginTop: '8px',
    },
    {}
  );

  const protein = macros.protein?.percentage || 30;
  const carbs = macros.carbs?.percentage || 40;
  const fats = macros.fats?.percentage || 30;

  container.innerHTML = `
    <div style="width: ${protein}%; background: #ef4444; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 600;">P ${protein}%</div>
    <div style="width: ${carbs}%; background: #f59e0b; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 600;">C ${carbs}%</div>
    <div style="width: ${fats}%; background: #3b82f6; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 600;">F ${fats}%</div>
  `;

  return container;
}

function createMealStat(label, value) {
  const stat = createElement('div', {}, {});
  stat.innerHTML = `
    <div style="font-size: 11px; color: #9ca3af; margin-bottom: 2px;">${label}</div>
    <div style="font-size: 18px; font-weight: 600; color: #1f2937;">${value}</div>
  `;
  return stat;
}

function createTimingTip(label, text) {
  const tip = createElement(
    'div',
    {
      display: 'flex',
      gap: '12px',
      padding: '12px',
      backgroundColor: '#fffbeb',
      borderRadius: '8px',
      alignItems: 'flex-start',
    },
    {}
  );

  tip.innerHTML = `
    <span style="font-weight: 600; color: #d97706; white-space: nowrap;">${label}:</span>
    <span style="color: #78350f; font-size: 14px;">${text}</span>
  `;

  return tip;
}

function createFoodList(category, foods, color) {
  const list = createElement(
    'div',
    {
      padding: '12px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
    },
    {}
  );

  const title = createElement(
    'div',
    {
      fontSize: '12px',
      fontWeight: '600',
      color: color,
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    { textContent: category }
  );

  const ul = createElement(
    'ul',
    {
      margin: '0',
      paddingLeft: '16px',
      fontSize: '13px',
      color: '#4b5563',
    },
    {}
  );

  foods.forEach((food) => {
    const li = createElement('li', { marginBottom: '4px' }, { textContent: food });
    ul.appendChild(li);
  });

  list.appendChild(title);
  list.appendChild(ul);
  return list;
}

function createAdjustmentTip(question, answer, color) {
  const tip = createElement(
    'div',
    {
      padding: '12px 16px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      borderLeft: `3px solid ${color}`,
    },
    {}
  );

  tip.innerHTML = `
    <div style="font-size: 13px; font-weight: 600; color: ${color}; margin-bottom: 4px;">${question}</div>
    <div style="font-size: 14px; color: #4b5563;">${answer}</div>
  `;

  return tip;
}

/**
 * Generate plain text macro plan
 */
function toPlainText(data) {
  const lines = [];

  const profile = data.save_profile?.[0] || data.save_profile || {};
  const metrics = data.save_body_metrics?.[0] || data.save_body_metrics || {};
  const completion = data._completion || {};

  lines.push(`MACRO PLAN FOR ${(profile.name || 'YOU').toUpperCase()}`);
  lines.push('='.repeat(40));
  lines.push('');

  if (metrics.weight) {
    lines.push(`Weight: ${metrics.weight} ${metrics.weight_unit || 'lbs'}`);
  }
  if (metrics.age) {
    lines.push(`Age: ${metrics.age}`);
  }
  lines.push('');

  if (completion.calories) {
    lines.push('DAILY CALORIES');
    lines.push('-'.repeat(20));
    lines.push(`Target: ${completion.calories.target} calories`);
    lines.push(`BMR: ${completion.calories.bmr}`);
    lines.push(`TDEE: ${completion.calories.tdee}`);
    if (completion.calories.explanation) {
      lines.push(`\n${completion.calories.explanation}`);
    }
    lines.push('');
  }

  if (completion.macros) {
    lines.push('MACROS');
    lines.push('-'.repeat(20));
    if (completion.macros.protein) {
      lines.push(`Protein: ${completion.macros.protein.grams}g (${completion.macros.protein.percentage}%)`);
    }
    if (completion.macros.carbs) {
      lines.push(`Carbs: ${completion.macros.carbs.grams}g (${completion.macros.carbs.percentage}%)`);
    }
    if (completion.macros.fats) {
      lines.push(`Fats: ${completion.macros.fats.grams}g (${completion.macros.fats.percentage}%)`);
    }
    lines.push('');
  }

  if (completion.meal_breakdown?.per_meal) {
    lines.push('PER MEAL');
    lines.push('-'.repeat(20));
    const pm = completion.meal_breakdown.per_meal;
    lines.push(`Calories: ${pm.calories}`);
    lines.push(`Protein: ${pm.protein}g | Carbs: ${pm.carbs}g | Fats: ${pm.fats}g`);
    lines.push('');
  }

  if (completion.weekly_tips?.length) {
    lines.push('WEEKLY TIPS');
    lines.push('-'.repeat(20));
    completion.weekly_tips.forEach((tip, i) => {
      lines.push(`${i + 1}. ${tip}`);
    });
  }

  return lines.join('\n');
}

/**
 * Generate HTML for export
 */
function toHTML(data) {
  const profile = data.save_profile?.[0] || data.save_profile || {};
  const metrics = data.save_body_metrics?.[0] || data.save_body_metrics || {};
  const completion = data._completion || {};

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Macro Plan - ${profile.name || 'Your Plan'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 40px;
      color: #1f2937;
      line-height: 1.6;
    }
    h1 { color: #10b981; border-bottom: 3px solid #10b981; padding-bottom: 16px; }
    h2 { color: #1f2937; margin-top: 32px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    .stats { display: flex; gap: 24px; margin-bottom: 24px; color: #6b7280; }
    .calorie-box { background: linear-gradient(135deg, #10b981, #059669); color: #fff; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px; }
    .calorie-box .number { font-size: 48px; font-weight: bold; }
    .macro-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .macro-box { padding: 16px; background: #f9fafb; border-radius: 8px; text-align: center; }
    .macro-box.protein { border-left: 4px solid #ef4444; }
    .macro-box.carbs { border-left: 4px solid #f59e0b; }
    .macro-box.fats { border-left: 4px solid #3b82f6; }
    .macro-box .grams { font-size: 28px; font-weight: bold; }
    .tip { background: #f0fdfa; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; }
    .food-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .food-list { background: #f9fafb; padding: 12px; border-radius: 8px; }
    .food-list h4 { margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; }
    .food-list ul { margin: 0; padding-left: 16px; }
  </style>
</head>
<body>
  <h1>Macro Plan for ${profile.name || 'You'}</h1>

  <div class="stats">
    ${metrics.weight ? `<span>Weight: <strong>${metrics.weight} ${metrics.weight_unit || 'lbs'}</strong></span>` : ''}
    ${metrics.age ? `<span>Age: <strong>${metrics.age}</strong></span>` : ''}
  </div>

  ${completion.calories ? `
  <div class="calorie-box">
    <div class="number">${completion.calories.target?.toLocaleString()}</div>
    <div>calories per day</div>
  </div>
  <p><strong>BMR:</strong> ${completion.calories.bmr} | <strong>TDEE:</strong> ${completion.calories.tdee}</p>
  ${completion.calories.explanation ? `<p style="color:#6b7280;font-style:italic;">${completion.calories.explanation}</p>` : ''}
  ` : ''}

  ${completion.macros ? `
  <h2>Your Macros</h2>
  <div class="macro-grid">
    <div class="macro-box protein">
      <div>Protein</div>
      <div class="grams" style="color:#ef4444;">${completion.macros.protein?.grams || '--'}g</div>
      <div style="font-size:12px;color:#6b7280;">${completion.macros.protein?.percentage || '--'}%</div>
    </div>
    <div class="macro-box carbs">
      <div>Carbs</div>
      <div class="grams" style="color:#f59e0b;">${completion.macros.carbs?.grams || '--'}g</div>
      <div style="font-size:12px;color:#6b7280;">${completion.macros.carbs?.percentage || '--'}%</div>
    </div>
    <div class="macro-box fats">
      <div>Fats</div>
      <div class="grams" style="color:#3b82f6;">${completion.macros.fats?.grams || '--'}g</div>
      <div style="font-size:12px;color:#6b7280;">${completion.macros.fats?.percentage || '--'}%</div>
    </div>
  </div>
  ` : ''}

  ${completion.meal_breakdown?.per_meal ? `
  <h2>Per Meal (${completion.meal_breakdown.meals_per_day || 4} meals/day)</h2>
  <p>
    <strong>Calories:</strong> ${completion.meal_breakdown.per_meal.calories} |
    <strong>Protein:</strong> ${completion.meal_breakdown.per_meal.protein}g |
    <strong>Carbs:</strong> ${completion.meal_breakdown.per_meal.carbs}g |
    <strong>Fats:</strong> ${completion.meal_breakdown.per_meal.fats}g
  </p>
  ` : ''}

  ${completion.weekly_tips?.length ? `
  <h2>Weekly Tips</h2>
  ${completion.weekly_tips.map((tip, i) => `<div class="tip"><strong>${i + 1}.</strong> ${tip}</div>`).join('')}
  ` : ''}

  ${completion.food_suggestions ? `
  <h2>Food Suggestions</h2>
  <div class="food-grid">
    ${completion.food_suggestions.protein_sources?.length ? `
    <div class="food-list">
      <h4 style="color:#ef4444;">Protein</h4>
      <ul>${completion.food_suggestions.protein_sources.map((f) => `<li>${f}</li>`).join('')}</ul>
    </div>
    ` : ''}
    ${completion.food_suggestions.carb_sources?.length ? `
    <div class="food-list">
      <h4 style="color:#f59e0b;">Carbs</h4>
      <ul>${completion.food_suggestions.carb_sources.map((f) => `<li>${f}</li>`).join('')}</ul>
    </div>
    ` : ''}
    ${completion.food_suggestions.fat_sources?.length ? `
    <div class="food-list">
      <h4 style="color:#3b82f6;">Fats</h4>
      <ul>${completion.food_suggestions.fat_sources.map((f) => `<li>${f}</li>`).join('')}</ul>
    </div>
    ` : ''}
  </div>
  ` : ''}
</body>
</html>
  `.trim();
}

// Register the macro renderer
registerRenderer('macro', {
  render: renderMacro,
  toPlainText,
  toHTML,
});

export { renderMacro, toPlainText, toHTML };
