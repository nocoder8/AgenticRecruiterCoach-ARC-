function getRecruiterAIUsageMetrics() {
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1g-Sp4_Ic91eXT9LeVwDJjRiMa5Xqf4Oks3aV29fxXRw/edit';
  const SHEET_NAME = 'Active+Rejected';

  // Configuration
  const HISTORICAL_START = new Date('2025-05-01');
  const RECENT_DAYS = 14; // Number of days to consider "recent"
  // Recent period: Last 14 days from current date
  const RECENT_CUTOFF = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);

  const ELIGIBLE_STAGES = [
    'HIRING MANAGER SCREEN', 'ASSESSMENT', 'ONSITE INTERVIEW',
    'FINAL INTERVIEW', 'OFFER APPROVALS', 'OFFER EXTENDED',
    'OFFER DECLINED', 'PENDING START', 'HIRED'
  ];

  // Senior-level positions that should be excluded from AI screening
  const SENIOR_LEVEL_KEYWORDS = ['VP', 'VICE-PRESIDENT', 'CHIEF', 'C-LEVEL', 'EXECUTIVE'];
  
  // Function to check if position is senior-level
  const isSeniorLevelPosition = (title) => {
    if (!title) return false;
    const upperTitle = String(title).toUpperCase();
    return SENIOR_LEVEL_KEYWORDS.some(keyword => upperTitle.includes(keyword));
  };

  const sheet = SpreadsheetApp.openByUrl(SHEET_URL).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  const headers = data[1].map(String);
  const rows = data.slice(2); // data starts from Row 3

  const col = name => headers.indexOf(name);

  const metrics = {};
  let invalidRows = 0;
  let seniorLevelExclusions = 0;

  rows.forEach((row, index) => {
    const recruiter = String(row[col('Recruiter name')] || '').trim();
    const stage = String(row[col('Last_stage')] || '').trim().toUpperCase();
    const ai = String(row[col('Ai_interview')] || '').trim().toUpperCase();
    const ts = parseDateSafe(row[col('Application_ts')]);

    // Skip rows with invalid data
    if (!recruiter || recruiter === '' || recruiter === 'N/A' || recruiter === 'undefined') {
      invalidRows++;
      if (invalidRows <= 5) { // Log first 5 invalid rows for debugging
        Logger.log(`Skipping invalid row ${index + 3}: recruiter="${recruiter}", stage="${stage}", ai="${ai}"`);
      }
      return;
    }
    if (!ts) return;
    if (ts < HISTORICAL_START) return;
    if (!ELIGIBLE_STAGES.includes(stage)) return;
    
    // Skip senior-level positions (VP, Chief, etc.) - they expect white-glove treatment
    const position = String(row[col('Title')] || '');
    if (isSeniorLevelPosition(position)) {
      seniorLevelExclusions++;
      if (seniorLevelExclusions <= 5) { // Log first 5 senior-level exclusions for debugging
        Logger.log(`Skipping senior-level position row ${index + 3}: recruiter="${recruiter}", position="${position}"`);
      }
      return;
    }

    if (!metrics[recruiter]) {
      metrics[recruiter] = {
        historical: { eligible: 0, aiDone: 0 },
        recent: { eligible: 0, aiDone: 0 },
        skippedCandidates: []
      };
    }

    const r = metrics[recruiter];

    r.historical.eligible++;
    if (ai === 'Y') r.historical.aiDone++;

    if (ts >= RECENT_CUTOFF) {
      r.recent.eligible++;
      if (ai === 'Y') r.recent.aiDone++;
      
      // Only add to skipped candidates if they're from the recent period
      if (ai !== 'Y') {
        r.skippedCandidates.push({
          name: row[col('Name')] || 'N/A',
          stage,
          position: row[col('Title')] || 'N/A',
          company: row[col('Current_company')] || 'N/A',
          source: row[col('Source_name')] || 'N/A',
          applicationDate: row[col('Application_ts')] || null
        });
      }
    }
  });

  Object.values(metrics).forEach(r => {
    r.historical.percent = r.historical.eligible > 0
      ? parseFloat((r.historical.aiDone / r.historical.eligible * 100).toFixed(1)) : 0;

    r.recent.percent = r.recent.eligible > 0
      ? parseFloat((r.recent.aiDone / r.recent.eligible * 100).toFixed(1)) : 0;
  });

  Logger.log(`Data processing summary: ${rows.length} total rows, ${invalidRows} invalid rows skipped, ${seniorLevelExclusions} senior-level positions excluded, ${Object.keys(metrics).length} valid recruiters found`);
  Logger.log(JSON.stringify(metrics, null, 2));
  return metrics;
}

// 👇 Helper function goes in the same file
function parseDateSafe(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (typeof d === 'string') {
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

// 👇 Helper function to check if position is senior-level
function isSeniorLevelPosition(position) {
  if (!position) return false;
  const seniorKeywords = ['VP', 'VICE-PRESIDENT', 'CHIEF', 'C-LEVEL', 'EXECUTIVE', 'DIRECTOR'];
  return seniorKeywords.some(keyword => position.toUpperCase().includes(keyword));
}

