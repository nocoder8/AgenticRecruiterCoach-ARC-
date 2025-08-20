function generateAndSendRecruiterNudge(recruiterName) {
  const metrics = getRecruiterAIUsageMetrics();

  if (!metrics[recruiterName]) {
    Logger.log(`No data found for ${recruiterName}`);
    return;
  }

  const m = metrics[recruiterName];
  const skipped = m.skippedCandidates
    .slice(0, 5) // limit to 5 for the prompt
    .map(c => {
      const applicationDate = c.applicationDate ? new Date(c.applicationDate).toLocaleDateString() : 'N/A';
      return `| ${c.name} | ${c.position} | ${c.stage} | ${c.source || 'N/A'} | ${applicationDate} |`;
    })
    .join('\n') || '| No candidates missed |';

  const skippedTable = `
| Name | Title | Last_stage | Source_name | Application_ts |
|------|-------|------------|-------------|----------------|
${skipped}
`;

  const prompt = `
You are an AI Productivity Coach for recruiters.

Here is performance data for: ${recruiterName}

**Historical AI usage:** ${m.historical.percent}% (${m.historical.aiDone} of ${m.historical.eligible})
**Recent AI usage (last 14 days):** ${m.recent.percent}% (${m.recent.aiDone} of ${m.recent.eligible})
**Change:** ${m.recent.percent - m.historical.percent >= 0 ? "+" : ""}${(m.recent.percent - m.historical.percent).toFixed(1)}%
**Goal threshold:** 80%

**Missed candidates from last 14 days (AI interview not sent):**
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

  const message = getGPTResponse(prompt);

  // Email it to YOU for review (hardcoded for now)
  const testRecipient = "pkumar@eightfold.ai"; // change if needed
  const subject = `🔁 TEST: Nudge for ${recruiterName}`;
  
  // Create HTML table for missed candidates
      const htmlTable = `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-family: Arial, sans-serif; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); min-width: 500px;">
          <thead>
            <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
              <th style="padding: 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; font-size: 12px;">Name</th>
              <th style="padding: 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; font-size: 12px;">Title</th>
              <th style="padding: 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; font-size: 12px;">Stage</th>
              <th style="padding: 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; font-size: 12px;">Source</th>
              <th style="padding: 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; font-size: 12px;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${m.skippedCandidates.slice(0, 5).map((c, index) => {
              const applicationDate = c.applicationDate ? new Date(c.applicationDate).toLocaleDateString() : 'N/A';
              const rowColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
              return `
                <tr style="background-color: ${rowColor};">
                  <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: 500; font-size: 11px;">${c.name}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-size: 11px;">${c.position}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">
                    <span style="background-color: #e3f2fd; color: #1976d2; padding: 3px 6px; border-radius: 8px; font-size: 10px; font-weight: 500;">${c.stage}</span>
                  </td>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-size: 11px;">${c.source || 'N/A'}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; color: #666; font-size: 11px;">${applicationDate}</td>
                </tr>
              `;
            }).join('') || `
              <tr>
                <td colspan="5" style="padding: 15px; text-align: center; color: #666; font-style: italic; font-size: 12px;">No candidates missed in the last 14 days</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    `;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 300; line-height: 1.2;">AI Interview Adoption Update</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${recruiterName}</p>
      </div>
      
      <div style="padding: 20px;">
        <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
          <h2 style="margin: 0 0 12px 0; color: #333; font-size: 16px;">📊 Performance Summary</h2>
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
              <div style="text-align: center; flex: 1; min-width: 120px; margin: 5px;">
                <div style="font-size: 20px; font-weight: bold; color: #667eea;">${m.historical.percent}%</div>
                <div style="font-size: 11px; color: #666;">Historical</div>
                <div style="font-size: 9px; color: #999;">${m.historical.aiDone} of ${m.historical.eligible}</div>
              </div>
              <div style="text-align: center; flex: 1; min-width: 120px; margin: 5px;">
                <div style="font-size: 20px; font-weight: bold; color: #28a745;">${m.recent.percent}%</div>
                <div style="font-size: 11px; color: #666;">Recent (14 days)</div>
                <div style="font-size: 9px; color: #999;">${m.recent.aiDone} of ${m.recent.eligible}</div>
                <div style="background-color: #e0e0e0; border-radius: 8px; height: 4px; margin: 6px auto 0 auto; width: 80%; position: relative;">
                  <div style="background: linear-gradient(90deg, ${m.recent.percent >= 80 ? '#28a745' : m.recent.percent >= 60 ? '#ffc107' : '#dc3545'} 0%, ${m.recent.percent >= 80 ? '#28a745' : m.recent.percent >= 60 ? '#ffc107' : '#dc3545'} ${Math.min(m.recent.percent, 100)}%, transparent ${Math.min(m.recent.percent, 100)}%); border-radius: 8px; height: 100%; width: 100%;"></div>
                </div>
                <div style="font-size: 8px; color: #999; margin-top: 2px;">${m.recent.percent >= 80 ? '✅ Goal Met!' : m.recent.percent >= 60 ? '🟡 Getting Close' : '🔴 Needs Work'}</div>
              </div>
              <div style="text-align: center; flex: 1; min-width: 120px; margin: 5px;">
                <div style="font-size: 20px; font-weight: bold; color: ${m.recent.percent - m.historical.percent >= 0 ? '#28a745' : '#dc3545'};">${m.recent.percent - m.historical.percent >= 0 ? '+' : ''}${(m.recent.percent - m.historical.percent).toFixed(1)}%</div>
                <div style="font-size: 11px; color: #666;">Change</div>
              </div>
              <div style="text-align: center; flex: 1; min-width: 120px; margin: 5px;">
                <div style="font-size: 18px; font-weight: bold; color: #ff6b35; border: 2px solid #ff6b35; border-radius: 50%; width: 45px; height: 45px; line-height: 41px; margin: 0 auto 5px auto;">80%</div>
                <div style="font-size: 11px; color: #666; font-weight: 600;">Target Goal</div>
                <div style="font-size: 9px; color: #999;">AI Interview Rate</div>
              </div>
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

  MailApp.sendEmail(testRecipient, subject, htmlBody, {htmlBody: htmlBody, cc: "pkumar@eightfold.ai"});
  Logger.log(`Test nudge sent for ${recruiterName}`);
  
  // Log the nudge was sent
  logNudgeSent(recruiterName);
}

// ✅ Returns: { 'Akhila Kashyap': '2025-08-12', ... }
function getLastNudgeMap() {
  const sheetName = "Nudge_Log";
  const ss = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1g-Sp4_Ic91eXT9LeVwDJjRiMa5Xqf4Oks3aV29fxXRw/edit');
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.hideSheet();
    sheet.appendRow(["Recruiter Name", "Last Nudge Sent"]);
  }

  const data = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < data.length; i++) {
    const name = data[i][0];
    const date = data[i][1];
    if (name && date) {
      map[name] = new Date(date);
    }
  }
  return map;
}

// ✅ Updates or appends the recruiter's latest nudge date
function logNudgeSent(recruiterName) {
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