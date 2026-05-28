const fs = require('fs');

let content = fs.readFileSync('src/lib/seed.ts', 'utf8');
let sortOrder = 0;
let lastGoal = '';

content = content.replace(/\{ id: "[^"]+", goal_id: "[^"]+", title: "[^"]+", is_complete: (true|false)(?:, sort_order: \d+)? \}/g, (match) => {
  const goalMatch = match.match(/goal_id: "([^"]+)"/);
  if (goalMatch) {
    const goal = goalMatch[1];
    if (goal !== lastGoal) {
      sortOrder = 0;
      lastGoal = goal;
    }
    const core = match.replace(/, sort_order: \d+/, '').replace(/ \}$/, '');
    const replacement = `${core}, sort_order: ${sortOrder} }`;
    sortOrder++;
    return replacement;
  }
  return match;
});

fs.writeFileSync('src/lib/seed.ts', content);
