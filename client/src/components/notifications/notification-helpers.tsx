import { useNotifications } from './notification-provider';

export function useNotificationHelpers() {
  const { addNotification } = useNotifications();

  const notifySuccess = (title: string, message?: string, actionUrl?: string, actionLabel?: string) => {
    return addNotification({
      type: 'success',
      title,
      message,
      actionUrl,
      actionLabel,
      dismissible: true,
      duration: 5000,
    });
  };

  const notifyError = (title: string, message?: string, persistent = false) => {
    return addNotification({
      type: 'error',
      title,
      message,
      dismissible: true,
      duration: persistent ? 0 : 8000,
    });
  };

  const notifyWarning = (title: string, message?: string, actionUrl?: string, actionLabel?: string) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      actionUrl,
      actionLabel,
      dismissible: true,
      duration: 6000,
    });
  };

  const notifyInfo = (title: string, message?: string, actionUrl?: string, actionLabel?: string) => {
    return addNotification({
      type: 'info',
      title,
      message,
      actionUrl,
      actionLabel,
      dismissible: true,
      duration: 4000,
    });
  };

  // Specific notification functions for common use cases
  const notifyObjectiveCreated = (objectiveTitle: string, objectiveId: string) => {
    return notifySuccess(
      'Objective Created',
      `"${objectiveTitle}" has been successfully created.`,
      `/objectives/${objectiveId}`,
      'View Objective'
    );
  };

  const notifyKeyResultAdded = (keyResultTitle: string, objectiveId: string) => {
    return notifySuccess(
      'Key Result Added',
      `"${keyResultTitle}" has been added to the objective.`,
      `/objectives/${objectiveId}`,
      'View Objective'
    );
  };

  const notifyTeamMemberAdded = (memberName: string, teamId: string) => {
    return notifySuccess(
      'Team Member Added',
      `${memberName} has been successfully added to the team.`,
      `/teams/${teamId}`,
      'View Team'
    );
  };

  const notifyMeetingScheduled = (meetingTitle: string, meetingId: string) => {
    return notifyInfo(
      'Meeting Scheduled',
      `"${meetingTitle}" has been scheduled.`,
      `/meetings/${meetingId}`,
      'View Meeting'
    );
  };

  const notifyDeadlineApproaching = (taskTitle: string, daysLeft: number, taskUrl?: string) => {
    return notifyWarning(
      'Deadline Approaching',
      `"${taskTitle}" is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
      taskUrl,
      'View Details'
    );
  };

  const notifySystemUpdate = (updateTitle: string, description?: string) => {
    return notifyInfo(
      updateTitle,
      description,
      undefined,
      undefined
    );
  };

  return {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyObjectiveCreated,
    notifyKeyResultAdded,
    notifyTeamMemberAdded,
    notifyMeetingScheduled,
    notifyDeadlineApproaching,
    notifySystemUpdate,
  };
}