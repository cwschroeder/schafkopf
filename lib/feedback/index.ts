/**
 * Feedback System - Public API
 */

// Types
export * from './types';

// Storage Operations
export {
  generateReportId,
  generateScreenshotId,
  createReport,
  getReport,
  updateReport,
  deleteReport,
  getAllReports,
  getReportsByUser,
  getNextFromQueue,
  getQueueLength,
  addToQueue,
  getUserFeedbackHistory,
  addPendingNotification,
  getPendingNotifications,
  markNotificationsAsRead,
  hasUserPendingNotifications,
  saveScreenshotMetadata,
  getScreenshotMetadata,
  getReportsForDuplicateCheck,
} from './storage';

// Context Collection
export {
  collectFeedbackContext,
  clearErrorBuffer,
  addErrorToBuffer,
} from './context-collector';

// AI Processing
export {
  analyzeReport,
  checkForDuplicates,
  processReport,
  generateGitHubIssueBody,
} from './ai-processing';

// GitHub Integration
export {
  createGitHubIssue,
  updateGitHubIssue,
  addIssueComment,
  getIssueStatus,
  getOpenFeedbackIssues,
  initializeLabels,
} from './github';
