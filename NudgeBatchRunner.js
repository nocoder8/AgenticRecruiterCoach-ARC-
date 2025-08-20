// Blacklist of recruiters to exclude from nudges
const excludedRecruiters = [
  'Samrudh J',
  'Deepak Sehgal', 
  'Guruprasad Hegde',
  'Pavan Kumar'
];

// Function to get recruiter emails from the sheet
function getRecruiterEmails() {
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1g-Sp4_Ic91eXT9LeVwDJjRiMa5Xqf4Oks3aV29fxXRw/edit';
  const SHEET_NAME = 'Active+Rejected';
  
  const sheet = SpreadsheetApp.openByUrl(SHEET_URL).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  const headers = data[1].map(String);
  const rows = data.slice(2); // data starts from Row 3
  
  const col = name => headers.indexOf(name);
  
  const recruiterEmails = {};
  
  rows.forEach((row, index) => {
    const recruiter = String(row[col('Recruiter name')] || '').trim();
    const email = String(row[col('Recruiter email')] || '').trim();
    
    if (recruiter && email && email !== 'N/A' && email !== 'undefined') {
      recruiterEmails[recruiter] = email;
    }
  });
  
  Logger.log(`📧 Found ${Object.keys(recruiterEmails).length} recruiter emails: ${JSON.stringify(recruiterEmails, null, 2)}`);
  return recruiterEmails;
}

function generateAllRecruiterNudges() {
  Logger.log("🚀 Starting batch nudge generation...");
  
  const metrics = getRecruiterAIUsageMetrics();
  const lastSentMap = getLastNudgeMap();
  const recruiterEmails = getRecruiterEmails();
  
  Logger.log(`📊 Found ${Object.keys(metrics).length} recruiters to process`);
  
  let emailsSent = 0;
  
  Object.keys(metrics).forEach(recruiter => {
    if (!recruiter || recruiter === 'undefined') {
      Logger.log(`⚠️ Skipping invalid recruiter name: "${recruiter}"`);
      return;
    }
    
    if (excludedRecruiters.includes(recruiter)) {
      Logger.log(`⏭️ Skipping excluded recruiter: ${recruiter}`);
      return;
    }
    
    const m = metrics[recruiter];
    if (!m) {
      Logger.log(`❌ No metrics found for recruiter: ${recruiter}`);
      return;
    }
    
    Logger.log(`\n👤 Processing ${recruiter}: recent=${m.recent.percent}%, historical=${m.historical.percent}%`);
    Logger.log(`   - Recent eligible: ${m.recent.eligible}, AI done: ${m.recent.aiDone}`);
    Logger.log(`   - Missed candidates: ${m.skippedCandidates.length}`);
    
    if (!shouldSendNudge(recruiter, m.recent.percent, lastSentMap, metrics)) {
      Logger.log(`   - ❌ Skipping ${recruiter}: does not meet criteria`);
      return;
    }
    
    Logger.log(`   - ✅ WILL SEND EMAIL to ${recruiter}`);
    emailsSent++;
    
    Logger.log(`📧 Sending nudge to ${recruiter}`);
    
    // Get recruiter's email
    const recruiterEmail = recruiterEmails[recruiter];
    if (!recruiterEmail) {
      Logger.log(`❌ No email found for ${recruiter}, skipping`);
      return;
    }
    
    // Create skipped candidates table for prompt
    const skipped = m.skippedCandidates.slice(0, 5).map(c => 
      `| ${c.name} | ${c.position} | ${c.stage} | ${c.source || 'N/A'} | ${c.applicationDate ? new Date(c.applicationDate).toLocaleDateString() : 'N/A'} |`
    ).join('\n');
    
    const skippedTable = `
| Name | Title | Last_stage | Source_name | Application_ts |
|------|-------|------------|-------------|----------------|
${skipped}
`;

    const prompt = getImprovedPrompt(recruiter, m, skippedTable);
    const message = getGPTResponse(prompt);
    
    const subject = "AI Interview Adoption Update";
    
    // Create HTML table for email
    const htmlTable = `
      <div style="overflow-x: auto; margin-top: 10px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; min-width: 400px;">
          <thead>
            <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
              <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6; font-weight: 600;">Name</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6; font-weight: 600;">Title</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #dee2e6; font-weight: 600;">Last Stage</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #dee2e6; font-weight: 600;">Source</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #dee2e6; font-weight: 600;">Applied</th>
            </tr>
          </thead>
          <tbody>
            ${m.skippedCandidates.slice(0, 5).map(c => `
              <tr>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${c.name}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${c.position}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${c.stage}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${c.source || 'N/A'}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${c.applicationDate ? new Date(c.applicationDate).toLocaleDateString() : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 300; line-height: 1.2;">AI Interview Adoption Update</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Your performance summary and opportunities</p>
        </div>
        
        <div style="padding: 20px;">
          <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 120px; text-align: center; background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 5px;">
              <div style="font-size: 24px; font-weight: bold; color: #667eea;">${m.historical.percent}%</div>
              <div style="font-size: 12px; color: #666; font-weight: 600;">Historical</div>
              <div style="font-size: 10px; color: #999;">${m.historical.aiDone} out of ${m.historical.eligible}</div>
            </div>
            <div style="flex: 1; min-width: 120px; text-align: center; background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 5px;">
              <div style="font-size: 24px; font-weight: bold; color: #28a745;">${m.recent.percent}%</div>
              <div style="font-size: 12px; color: #666; font-weight: 600;">Recent (14 Days)</div>
              <div style="font-size: 10px; color: #999;">${m.recent.aiDone} out of ${m.recent.eligible}</div>
            </div>
            <div style="text-align: center; flex: 1; min-width: 120px; margin: 5px;">
              <div style="font-size: 18px; font-weight: bold; color: #ff6b35; border: 2px solid #ff6b35; border-radius: 50%; width: 45px; height: 45px; line-height: 41px; margin: 0 auto 5px auto;">80%</div>
              <div style="font-size: 11px; color: #666; font-weight: 600;">Target Goal</div>
              <div style="font-size: 9px; color: #999;">AI Interview Rate</div>
            </div>
          </div>

          <div style="background-color: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <div style="line-height: 1.6; color: #444; font-size: 13px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="background-color: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px;">
            <h3 style="margin: 0 0 12px 0; color: #333; font-size: 14px;">📋 Missed Candidates (Last 14 Days)</h3>
            <p style="margin: 0 0 15px 0; color: #666; font-size: 12px;">Candidates who could have benefited from AI interviews:</p>
            ${htmlTable}
          </div>

          <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; font-size: 11px; margin: 0;">Goal: 80% AI interview adoption rate</p>
            <p style="color: #999; font-size: 10px; margin: 3px 0 0 0;">Generated by Agentic Recruiter Coach (ARC)</p>
          </div>
        </div>
      </div>
    `;

    MailApp.sendEmail(recruiterEmail, subject, htmlBody, {htmlBody: htmlBody, cc: "pkumar@eightfold.ai"});
    Logger.log(`✅ Sent nudge for ${recruiter}`);

    updateNudgeLog(recruiter);
  });
  
  Logger.log(`\n📊 SUMMARY: Processed ${Object.keys(metrics).length} recruiters`);
  Logger.log(`📧 Emails sent: ${emailsSent}`);
}

// ✅ Returns: { 'Akhila Kashyap': '2025-08-12', ... }
// Note: getLastNudgeMap() is now defined in NudgeDispatcher.js

// ✅ Updates or appends the recruiter's latest nudge date
function updateNudgeLog(recruiterName) {
  const sheetName = "Nudge_Log";
  const ss = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1g-Sp4_Ic91eXT9LeVwDJjRiMa5Xqf4Oks3aV29fxXRw/edit');
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.hideSheet();
    sheet.appendRow(["Recruiter Name", "Last Nudge Sent"]);
  }

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === recruiterName) {
      sheet.getRange(i + 1, 2).setValue(new Date());
      return;
    }
  }

  sheet.appendRow([recruiterName, new Date()]);
}

// ✅ Only nudge if usage < 80% AND last nudge was ≥ 7 days ago AND has recent activity
function shouldSendNudge(recruiterName, recentUsage, lastSentMap, metrics) {
  if (!recruiterName || recruiterName === 'undefined') {
    Logger.log(`⚠️ Invalid recruiter name in shouldSendNudge: "${recruiterName}"`);
    return false;
  }
  
  const lastSent = lastSentMap[recruiterName];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  
  // Get recruiter's data to check for recent activity
  const recruiterData = metrics[recruiterName];
  const hasRecentActivity = recruiterData && recruiterData.recent.eligible > 0;
  const hasMissedCandidates = recruiterData && recruiterData.skippedCandidates.length > 0;
  
  Logger.log(`Checking ${recruiterName}: usage=${recentUsage}%, lastSent=${lastSent}, sevenDaysAgo=${sevenDaysAgo}, hasRecentActivity=${hasRecentActivity}, hasMissedCandidates=${hasMissedCandidates}`);
  
  // Skip if no recent activity or no missed candidates
  if (!hasRecentActivity || !hasMissedCandidates) {
    Logger.log(`  - Skipping: no recent activity (${hasRecentActivity}) or no missed candidates (${hasMissedCandidates})`);
    return false;
  }
  
  // Check 7-day restriction
  const shouldSend = (!lastSent || lastSent < sevenDaysAgo) && recentUsage < 80;
  
  Logger.log(`  - Should send: ${shouldSend} (recentUsage: ${recentUsage}%, threshold: 80%)`);
  
  if (!shouldSend) {
    if (lastSent && lastSent >= sevenDaysAgo) {
      Logger.log(`  - Skipping: recently nudged (last sent: ${lastSent})`);
    }
    if (recentUsage >= 80) {
      Logger.log(`  - Skipping: usage too high (${recentUsage}% >= 80%)`);
    }
  }
  
  return shouldSend;
}

// 🕐 Set up daily trigger at 1 PM
function setupDailyTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'runDailyRecruiterNudges') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger for 1 PM daily
  ScriptApp.newTrigger('runDailyRecruiterNudges')
    .timeBased()
    .everyDays(1)
    .atHour(13) // 1 PM
    .create();
  
  Logger.log("✅ Daily trigger set up for 1 PM");
}

// ✅ Main trigger function for daily automated execution
function runDailyRecruiterNudges() {
  try {
    Logger.log("🌅 Starting daily recruiter nudge process...");
    
    // Check if it's weekend (skip sending emails on Saturday/Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      Logger.log("📅 Weekend detected - skipping email sending");
      return;
    }
    
    // Generate usage-based nudges only
    generateAllRecruiterNudges();
    Logger.log("✅ Daily nudge process completed successfully");
  } catch (error) {
    Logger.log(`❌ Error in daily nudge process: ${error.toString()}`);
    // Could add email notification here for errors
  }
}

// ✅ Manual trigger for testing the daily process
function testDailyProcess() {
  Logger.log("🧪 Testing daily process...");
  runDailyRecruiterNudges();
}

// Function to get improved prompt for GPT
function getImprovedPrompt(recruiter, m, skippedTable) {
  return `
Recruiter: ${recruiter}
Historical AI usage: ${m.historical.percent}% (${m.historical.aiDone}/${m.historical.eligible})
Recent AI usage (last 14 days): ${m.recent.percent}% (${m.recent.aiDone}/${m.recent.eligible})
Change: ${m.recent.percent - m.historical.percent >= 0 ? "+" : ""}${(m.recent.percent - m.historical.percent).toFixed(1)}%
Goal threshold: 80%

Missed candidates from last 14 days (AI interview not sent):
${skippedTable}

Write a professional, direct nudge (2–3 sentences) that:
1. If recent usage is BELOW 80%: Be direct about the gap and emphasize the missed opportunities
2. If recent usage is ABOVE 80% but historical is low: Acknowledge improvement but maintain focus on consistency
3. If both recent and historical are high: Celebrate the achievement
4. Always be constructive and provide clear next steps
5. Focus on the business impact and missed candidates
6. End with "Best, Pavan" (no other signatures or names)

Tone: Professional, direct, results-focused. Don't be overly appreciative of poor performance.
  `;
}

// 🚀 NEW FUNCTION: Test who would receive emails
function testEmailRecipients() {
  Logger.log("🧪 Testing who would receive emails...");
  
  const metrics = getRecruiterAIUsageMetrics();
  const lastSentMap = getLastNudgeMap();
  const recruiterEmails = getRecruiterEmails();
  
  Logger.log(`\n📊 Email Recipients Analysis:`);
  Logger.log(`Found ${Object.keys(metrics).length} recruiters with metrics`);
  Logger.log(`Found ${Object.keys(recruiterEmails).length} recruiter emails`);
  
  let wouldReceiveEmails = 0;
  let noEmailFound = 0;
  let excluded = 0;
  let noRecentActivity = 0;
  let usageTooHigh = 0;
  let recentlyNudged = 0;
  
  Object.keys(metrics).forEach(recruiter => {
    Logger.log(`\n👤 Analyzing ${recruiter}:`);
    
    // Check if excluded
    if (excludedRecruiters.includes(recruiter)) {
      Logger.log(`   - ❌ EXCLUDED (blacklisted)`);
      excluded++;
      return;
    }
    
    // Check if email exists
    const recruiterEmail = recruiterEmails[recruiter];
    if (!recruiterEmail) {
      Logger.log(`   - ❌ NO EMAIL FOUND`);
      noEmailFound++;
      return;
    }
    
    const m = metrics[recruiter];
    Logger.log(`   - 📧 Email: ${recruiterEmail}`);
    Logger.log(`   - 📈 Recent usage: ${m.recent.percent}% (${m.recent.aiDone}/${m.recent.eligible})`);
    Logger.log(`   - 📈 Historical usage: ${m.historical.percent}% (${m.historical.aiDone}/${m.historical.eligible})`);
    Logger.log(`   - 📋 Missed candidates: ${m.skippedCandidates.length}`);
    
    // Check recent activity
    if (m.recent.eligible === 0) {
      Logger.log(`   - ❌ NO RECENT ACTIVITY`);
      noRecentActivity++;
      return;
    }
    
    // Check missed candidates
    if (m.skippedCandidates.length === 0) {
      Logger.log(`   - ❌ NO MISSED CANDIDATES`);
      noRecentActivity++;
      return;
    }
    
    // Check usage threshold
    if (m.recent.percent >= 80) {
      Logger.log(`   - ❌ USAGE TOO HIGH (${m.recent.percent}% >= 80%)`);
      usageTooHigh++;
      return;
    }
    
    // Check 7-day restriction
    const lastSent = lastSentMap[recruiter];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    
    if (lastSent && lastSent >= sevenDaysAgo) {
      Logger.log(`   - ❌ RECENTLY NUDGED (last sent: ${lastSent})`);
      recentlyNudged++;
      return;
    }
    
    // Would receive email
    Logger.log(`   - ✅ WOULD RECEIVE EMAIL`);
    wouldReceiveEmails++;
  });
  
  Logger.log(`\n📊 SUMMARY:`);
  Logger.log(`- Would receive emails: ${wouldReceiveEmails}`);
  Logger.log(`- Excluded (blacklisted): ${excluded}`);
  Logger.log(`- No email found: ${noEmailFound}`);
  Logger.log(`- No recent activity: ${noRecentActivity}`);
  Logger.log(`- Usage too high (≥80%): ${usageTooHigh}`);
  Logger.log(`- Recently nudged: ${recentlyNudged}`);
  
  if (wouldReceiveEmails > 0) {
    Logger.log(`\n📧 Recruiters who would receive emails:`);
    Object.keys(metrics).forEach(recruiter => {
      if (excludedRecruiters.includes(recruiter)) return;
      
      const recruiterEmail = recruiterEmails[recruiter];
      if (!recruiterEmail) return;
      
      const m = metrics[recruiter];
      if (m.recent.eligible === 0 || m.skippedCandidates.length === 0) return;
      if (m.recent.percent >= 80) return;
      
      const lastSent = lastSentMap[recruiter];
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
      if (lastSent && lastSent >= sevenDaysAgo) return;
      
      Logger.log(`   - ${recruiter} (${recruiterEmail}) - ${m.recent.percent}% recent usage`);
    });
  }
}

// 🚀 NEW FUNCTION: Check trigger status and email flow
function checkTriggerAndEmailStatus() {
  Logger.log("🔍 Checking trigger status and email flow...");
  
  // Check if daily trigger is set up
  const triggers = ScriptApp.getProjectTriggers();
  let dailyTriggerFound = false;
  
  Logger.log(`\n📅 Current Triggers (${triggers.length} total):`);
  triggers.forEach((trigger, index) => {
    Logger.log(`${index + 1}. Function: ${trigger.getHandlerFunction()}`);
    Logger.log(`   - Type: ${trigger.getEventType()}`);
    Logger.log(`   - Source: ${trigger.getTriggerSource()}`);
    
    if (trigger.getHandlerFunction() === 'runDailyRecruiterNudges') {
      dailyTriggerFound = true;
      Logger.log(`   - ✅ DAILY TRIGGER FOUND`);
      
      if (trigger.getEventType() === ScriptApp.EventType.CLOCK) {
        Logger.log(`   - ⏰ Time-based trigger`);
        // Try to get time info
        try {
          Logger.log(`   - 📅 Runs daily at 1 PM`);
        } catch (e) {
          Logger.log(`   - ⚠️ Could not get time details`);
        }
      }
    }
  });
  
  if (!dailyTriggerFound) {
    Logger.log(`\n❌ NO DAILY TRIGGER FOUND!`);
    Logger.log(`💡 Run setupDailyTrigger() to create the daily trigger`);
  }
  
  // Test the email flow without sending emails
  Logger.log(`\n🧪 Testing email flow (without sending emails)...`);
  
  const metrics = getRecruiterAIUsageMetrics();
  const lastSentMap = getLastNudgeMap();
  const recruiterEmails = getRecruiterEmails();
  
  Logger.log(`📊 Data Status:`);
  Logger.log(`- Recruiters with metrics: ${Object.keys(metrics).length}`);
  Logger.log(`- Recruiters with emails: ${Object.keys(recruiterEmails).length}`);
  Logger.log(`- Recruiters with nudge history: ${Object.keys(lastSentMap).length}`);
  
  // Check if any recruiters would receive emails
  let eligibleRecruiters = 0;
  
  Object.keys(metrics).forEach(recruiter => {
    if (excludedRecruiters.includes(recruiter)) return;
    
    const recruiterEmail = recruiterEmails[recruiter];
    if (!recruiterEmail) return;
    
    const m = metrics[recruiter];
    if (m.recent.eligible === 0 || m.skippedCandidates.length === 0) return;
    if (m.recent.percent >= 80) return;
    
    const lastSent = lastSentMap[recruiter];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    if (lastSent && lastSent >= sevenDaysAgo) return;
    
    eligibleRecruiters++;
    Logger.log(`✅ ${recruiter} (${recruiterEmail}) - ${m.recent.percent}% usage`);
  });
  
  Logger.log(`\n📧 Email Status:`);
  Logger.log(`- Eligible recruiters for emails: ${eligibleRecruiters}`);
  
  if (eligibleRecruiters === 0) {
    Logger.log(`\n❌ NO RECRUITERS ELIGIBLE FOR EMAILS`);
    Logger.log(`Possible reasons:`);
    Logger.log(`- All recruiters have ≥80% usage`);
    Logger.log(`- All recruiters were recently nudged (within 7 days)`);
    Logger.log(`- No recent activity or missed candidates`);
    Logger.log(`- Missing email addresses`);
  }
  
  // Check if it's weekend
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
  
  Logger.log(`\n📅 Date Check:`);
  Logger.log(`- Today: ${today.toDateString()}`);
  Logger.log(`- Day of week: ${dayOfWeek} (0=Sunday, 6=Saturday)`);
  Logger.log(`- Is weekend: ${isWeekend}`);
  
  if (isWeekend) {
    Logger.log(`⚠️ WEEKEND DETECTED - No emails would be sent`);
  }
  
  return {
    dailyTriggerFound: dailyTriggerFound,
    eligibleRecruiters: eligibleRecruiters,
    isWeekend: isWeekend
  };
}

// 🚀 NEW FUNCTION: Manually test the daily process
function testDailyProcessManually() {
  Logger.log("🧪 Manually testing daily process...");
  
  const status = checkTriggerAndEmailStatus();
  
  if (!status.dailyTriggerFound) {
    Logger.log(`\n❌ Daily trigger not found. Setting up now...`);
    setupDailyTrigger();
    Logger.log(`✅ Daily trigger set up!`);
  }
  
  if (status.isWeekend) {
    Logger.log(`\n⚠️ It's weekend - normally no emails would be sent`);
    Logger.log(`But we'll test the process anyway...`);
  }
  
  Logger.log(`\n🚀 Running daily process manually...`);
  runDailyRecruiterNudges();
  
  Logger.log(`\n✅ Manual test completed!`);
}
