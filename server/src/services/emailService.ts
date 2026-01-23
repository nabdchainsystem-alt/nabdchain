import { Resend } from 'resend';
import { emailLogger } from '../utils/logger';

// Initialize Resend client (only if API key is available)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Default sender (use your verified domain later, or Resend's test domain)
const DEFAULT_FROM = process.env.EMAIL_FROM || 'NABD <onboarding@resend.dev>';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export const emailService = {
  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return resend !== null;
  },

  /**
   * Send a single email
   */
  async send(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!resend) {
      emailLogger.warn('Email service not configured, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const emailPayload: {
        from: string;
        to: string[];
        subject: string;
        html?: string;
        text?: string;
        replyTo?: string;
      } = {
        from: options.from || DEFAULT_FROM,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
      };

      if (options.html) emailPayload.html = options.html;
      if (options.text) emailPayload.text = options.text;
      if (options.replyTo) emailPayload.replyTo = options.replyTo;

      const { data, error } = await resend.emails.send(emailPayload as Parameters<typeof resend.emails.send>[0]);

      if (error) {
        emailLogger.error('Email send error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (error) {
      emailLogger.error('Email send exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Send workspace invitation email
   */
  async sendInvitation(params: {
    to: string;
    inviterName: string;
    workspaceName: string;
    inviteLink: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.send({
      to: params.to,
      subject: `You're invited to join ${params.workspaceName} on NABD`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited!</h2>
          <p><strong>${params.inviterName}</strong> has invited you to join <strong>${params.workspaceName}</strong> on NABD.</p>
          <p style="margin: 30px 0;">
            <a href="${params.inviteLink}"
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Accept Invitation
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `${params.inviterName} has invited you to join ${params.workspaceName} on NABD. Accept the invitation here: ${params.inviteLink}`,
    });
  },

  /**
   * Send task assignment notification
   */
  async sendTaskAssigned(params: {
    to: string;
    assignerName: string;
    taskName: string;
    boardName: string;
    taskLink: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.send({
      to: params.to,
      subject: `New task assigned: ${params.taskName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Task Assigned</h2>
          <p><strong>${params.assignerName}</strong> assigned you a task in <strong>${params.boardName}</strong>:</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <strong>${params.taskName}</strong>
          </div>
          <p>
            <a href="${params.taskLink}"
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Task
            </a>
          </p>
        </div>
      `,
      text: `${params.assignerName} assigned you a task "${params.taskName}" in ${params.boardName}. View it here: ${params.taskLink}`,
    });
  },

  /**
   * Send task due reminder
   */
  async sendTaskDueReminder(params: {
    to: string;
    taskName: string;
    dueDate: string;
    boardName: string;
    taskLink: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.send({
      to: params.to,
      subject: `Reminder: "${params.taskName}" is due soon`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Task Due Reminder</h2>
          <p>Your task in <strong>${params.boardName}</strong> is due soon:</p>
          <div style="background: #FEF3C7; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <strong>${params.taskName}</strong>
            <br>
            <span style="color: #92400E;">Due: ${params.dueDate}</span>
          </div>
          <p>
            <a href="${params.taskLink}"
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Task
            </a>
          </p>
        </div>
      `,
      text: `Reminder: Your task "${params.taskName}" in ${params.boardName} is due ${params.dueDate}. View it here: ${params.taskLink}`,
    });
  },

  /**
   * Send welcome email to new user
   */
  async sendWelcome(params: {
    to: string;
    userName: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.send({
      to: params.to,
      subject: 'Welcome to NABD!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to NABD, ${params.userName}!</h1>
          <p>We're excited to have you on board. NABD helps you manage projects, collaborate with your team, and get things done.</p>
          <h3>Getting Started:</h3>
          <ul>
            <li>Create your first workspace</li>
            <li>Invite your team members</li>
            <li>Set up your first board</li>
          </ul>
          <p>If you have any questions, we're here to help!</p>
          <p>Best,<br>The NABD Team</p>
        </div>
      `,
      text: `Welcome to NABD, ${params.userName}! We're excited to have you on board. Get started by creating your first workspace and inviting your team.`,
    });
  },
};

export default emailService;
