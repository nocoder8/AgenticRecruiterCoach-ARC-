# Agentic Recruiter Coach (ARC)

An automated Google Apps Script system that monitors recruiter AI interview adoption rates and sends personalized nudges to improve performance. Tracks historical vs recent (14-day) AI usage metrics from Google Sheets data, identifies candidates who missed AI interviews, and generates GPT-powered personalized emails with performance dashboards.

## 🎯 Project Overview

ARC is designed to increase AI interview adoption rates among recruiters by providing data-driven insights and automated coaching. The system targets an 80% AI interview adoption rate through intelligent monitoring, personalized feedback, and automated nudges.

## ✨ Key Features

### 📊 **Intelligent Metrics Tracking**
- **Historical Analysis**: Tracks AI usage from May 2025 onwards
- **Recent Performance**: 14-day rolling window analysis
- **Smart Filtering**: Excludes senior-level positions (VP, Chief, Executive)
- **Eligible Stages**: Focuses on relevant interview stages only

### 🤖 **AI-Powered Personalization**
- **GPT-4 Integration**: Generates contextual, personalized coaching messages
- **Performance-Based Messaging**: Different tones for different performance levels
- **Business Impact Focus**: Emphasizes missed opportunities and ROI

### ⚡ **Smart Automation**
- **Daily Triggers**: Automated execution at 1 PM daily
- **Weekend Exclusions**: No emails sent on Saturdays/Sundays
- **7-Day Cooldown**: Prevents spam with intelligent timing
- **Blacklist Management**: Exclude specific recruiters from nudges

### 📧 **Professional Email System**
- **Beautiful HTML Templates**: Modern, responsive email design
- **Performance Dashboards**: Visual metrics and progress indicators
- **Missed Candidates Table**: Detailed list of opportunities
- **Mobile-Friendly**: Optimized for all devices

## 🏗️ Architecture

### Core Components

```
ARC System
├── 📊 Data Processing (usageProcessor.js)
├── 🤖 AI Integration (gptAgent.js)
├── 📧 Email Generation (NudgeDispatcher.js)
├── ⚡ Batch Processing (NudgeBatchRunner.js)
└── 🧪 Testing Utilities (testGPT.js)
```

### Data Flow

1. **Data Extraction**: Pulls recruiter data from Google Sheets
2. **Metrics Calculation**: Processes historical vs recent performance
3. **Eligibility Check**: Filters based on criteria and cooldowns
4. **AI Generation**: Creates personalized coaching messages
5. **Email Delivery**: Sends professional HTML emails
6. **Logging**: Tracks all nudge activities

## 🚀 Quick Start

### Prerequisites

- Google Apps Script access
- OpenAI API key
- Google Sheets with recruiter data
- Email permissions

### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/nocoder8/AgenticRecruiterCoach-ARC-.git
   ```

2. **Create Google Apps Script Project**
   - Go to [script.google.com](https://script.google.com)
   - Create new project
   - Copy all `.js` files to the project

3. **Configure Environment**
   - Set OpenAI API key in Script Properties
   - Update Google Sheets URLs in code
   - Configure email recipients

4. **Set Up Triggers**
   ```javascript
   // Run this function once to set up daily automation
   setupDailyTrigger()
   ```

### Configuration

#### Environment Variables
```javascript
// Set in Script Properties
OPENAI_API_KEY = "your-openai-api-key"
```

#### Google Sheets Configuration
```javascript
// Update these URLs in usageProcessor.js
const SHEET_URL = 'your-google-sheets-url'
const SHEET_NAME = 'your-sheet-name'
```

## 📋 Usage

### Manual Execution

```javascript
// Test the entire system
testDailyProcessManually()

// Check who would receive emails
testEmailRecipients()

// Send individual nudge
generateAndSendRecruiterNudge("Recruiter Name")
```

### Automated Execution

The system runs automatically at 1 PM daily (excluding weekends) and:
- Analyzes recruiter performance
- Identifies candidates who missed AI interviews
- Generates personalized coaching messages
- Sends professional HTML emails
- Logs all activities

## 📊 Data Requirements

### Google Sheets Structure

Your Google Sheets should contain these columns:
- `Recruiter name`
- `Recruiter email`
- `Name` (candidate)
- `Title` (position)
- `Last_stage`
- `Ai_interview` (Y/N)
- `Application_ts`
- `Source_name`
- `Current_company`

### Data Filters

The system automatically filters:
- **Eligible Stages**: Hiring Manager Screen, Assessment, Onsite Interview, etc.
- **Senior Positions**: Excludes VP, Chief, Executive roles
- **Date Range**: From May 2025 onwards
- **Recent Activity**: Last 14 days for recent metrics

## 🎨 Email Templates

### Features
- **Responsive Design**: Works on all devices
- **Performance Metrics**: Visual dashboards with progress bars
- **Missed Candidates Table**: Detailed opportunity list
- **Professional Branding**: Eightfold.ai styling
- **Actionable Insights**: Clear next steps and goals

### Sample Email Structure
```
┌─────────────────────────────────────┐
│ AI Interview Adoption Update        │
├─────────────────────────────────────┤
│ 📊 Performance Summary              │
│ [Historical] [Recent] [Change] [Goal]│
├─────────────────────────────────────┤
│ 💬 Personalized Coaching Message    │
├─────────────────────────────────────┤
│ 📋 Missed Candidates Table          │
│ [Name] [Title] [Stage] [Source]     │
└─────────────────────────────────────┘
```

## 🔧 Customization

### Blacklist Management
```javascript
// Add/remove recruiters from blacklist in NudgeBatchRunner.js
const excludedRecruiters = [
  'Recruiter Name 1',
  'Recruiter Name 2'
];
```

### Performance Thresholds
```javascript
// Modify target goals in usageProcessor.js
const TARGET_GOAL = 80; // AI interview adoption rate
const RECENT_DAYS = 14; // Analysis window
```

### Email Scheduling
```javascript
// Change trigger time in NudgeBatchRunner.js
.atHour(13) // 1 PM - modify as needed
```

## 🧪 Testing

### Test Functions
```javascript
// Test GPT integration
testGPT()

// Test email recipients analysis
testEmailRecipients()

// Test trigger status
checkTriggerAndEmailStatus()

// Manual daily process test
testDailyProcessManually()
```

### Debugging
- Check Script Execution logs for detailed information
- Use `Logger.log()` outputs for troubleshooting
- Verify Google Sheets permissions and data format

## 📈 Performance Metrics

### Key Indicators
- **Historical Usage**: Long-term AI interview adoption
- **Recent Usage**: 14-day performance trend
- **Change Rate**: Performance improvement/decline
- **Missed Opportunities**: Candidates without AI interviews

### Success Criteria
- 80% AI interview adoption rate
- Reduced manual screening time
- Improved candidate experience
- Data-driven recruitment decisions

## 🔒 Security & Privacy

### Data Protection
- No sensitive data stored in code
- API keys managed through Script Properties
- Google Sheets access via secure URLs
- Email addresses handled securely

### Access Control
- Blacklist functionality for exclusions
- Configurable email recipients
- Audit trail through nudge logging

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

### Code Standards
- Follow Google Apps Script conventions
- Add comments for complex logic
- Use descriptive function names
- Include error handling

## 📞 Support

### Common Issues
- **API Key Errors**: Verify OpenAI API key in Script Properties
- **Sheet Access**: Check Google Sheets permissions
- **Email Delivery**: Verify email configuration
- **Trigger Issues**: Check Script App permissions

### Getting Help
- Check execution logs for error details
- Verify all configuration settings
- Test individual components
- Review Google Apps Script documentation

## 📄 License

This project is developed for Eightfold.ai internal use. Please contact the development team for external usage permissions.

## 🏆 Acknowledgments

- **OpenAI**: GPT-4 API for intelligent message generation
- **Google Apps Script**: Platform for automation
- **Eightfold.ai**: Recruitment platform integration
- **Development Team**: Continuous improvement and support

---

**Built with ❤️ for better recruitment outcomes**
