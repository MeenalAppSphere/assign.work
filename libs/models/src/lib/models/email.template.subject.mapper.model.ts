import { EmailTemplatePathEnum, EmailSubjectEnum } from '../enums';

/**
 * email subject template mapper
 */
export const emailSubjectTemplateMapper = () => {
  const mapper = new Map<string, string>();

  /**
   * user
   */
  // reset password
  mapper.set(EmailSubjectEnum.resetPassword, EmailTemplatePathEnum.resetPassword);

  /**
   * project
   */
  // project invitation
  mapper.set(EmailSubjectEnum.projectInvitation, EmailTemplatePathEnum.projectInvitation);

  /**
   * task
   */

  // task creation
  mapper.set(EmailSubjectEnum.taskCreated, EmailTemplatePathEnum.taskCreated);
  // task update
  mapper.set(EmailSubjectEnum.taskUpdated, EmailTemplatePathEnum.taskUpdated);
  // task update
  mapper.set(EmailSubjectEnum.taskMoved, EmailTemplatePathEnum.taskMoved);
  // task assigned
  mapper.set(EmailSubjectEnum.taskAssigned, EmailTemplatePathEnum.taskAssigned);

  // task comment added
  mapper.set(EmailSubjectEnum.taskCommentAdded, EmailTemplatePathEnum.taskCommentAdded);

  // task comment updated
  mapper.set(EmailSubjectEnum.taskCommentUpdated, EmailTemplatePathEnum.taskCommentAdded);

  // task comment pinned
  mapper.set(EmailSubjectEnum.taskCommentPinned, EmailTemplatePathEnum.taskCommentAdded);

  // task comment un pinned
  mapper.set(EmailSubjectEnum.taskCommentUnPinned, EmailTemplatePathEnum.taskCommentAdded);
  /**
   * sprint
   */

  // sprint published
  mapper.set(EmailSubjectEnum.sprintPublished, EmailTemplatePathEnum.publishSprint);
  // sprint closed
  mapper.set(EmailSubjectEnum.sprintClosed, EmailTemplatePathEnum.closeSprint);

  return mapper;
};
