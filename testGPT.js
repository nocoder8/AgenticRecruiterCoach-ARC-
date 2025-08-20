function testGPTSimplePrompt() {
  const prompt = "Write a short, friendly Slack message to a recruiter reminding them to use AI interviews more often.";
  const reply = getGPTResponse(prompt);
  Logger.log("GPT reply:\n" + reply);
}
function testRecruiterUsageMetrics() {
  const data = getRecruiterAIUsageMetrics();
  Logger.log(Object.keys(data)); // should print recruiter names
}
function testGenerateNudge() {
  generateAndSendRecruiterNudge('Nicole Brungo');
}