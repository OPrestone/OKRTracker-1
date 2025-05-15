import { MailService } from '@sendgrid/mail';
import { tenantService } from './tenant-service';

class EmailService {
  private mailService: MailService;
  private fromEmail: string = 'noreply@okrplatform.com'; // Replace with your sender email
  
  constructor() {
    this.mailService = new MailService();
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY not found. Email sending will be disabled.');
    } else {
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
    }
    
    // Set APPLICATION_URL in environment if it doesn't exist
    if (!process.env.APPLICATION_URL) {
      process.env.APPLICATION_URL = 'http://localhost:5000';
      console.log(`APPLICATION_URL not set, defaulting to ${process.env.APPLICATION_URL}`);
    }
  }
  
  /**
   * Send an invitation email to a user invited to join a tenant
   */
  async sendTenantInvitationEmail(
    recipientEmail: string,
    tenantId: string,
    role: string,
    inviterName?: string
  ) {
    try {
      // Get the tenant details
      const tenant = await tenantService.getTenantById(tenantId);
      if (!tenant) {
        throw new Error(`Tenant with ID ${tenantId} not found`);
      }
      
      const inviterDisplay = inviterName || 'An administrator';
      const tenantName = tenant.display_name || tenant.name || 'your organization';
      
      // Email content
      const subject = `You've been invited to join ${tenantName} on OKR Platform`;
      const text = `
        Hello,
        
        ${inviterDisplay} has invited you to join ${tenantName} on OKR Platform as a ${role}.
        
        To accept this invitation, please visit:
        ${this.getApplicationUrl()}/auth?invitation=true&email=${encodeURIComponent(recipientEmail)}&tenant=${tenantId}
        
        If you don't have an account yet, you'll be able to create one when you follow the link.
        
        This invitation will expire in 7 days.
        
        Best regards,
        The OKR Platform Team
      `;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2563EB; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0;">OKR Platform Invitation</h1>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 20px;">
            <p>Hello,</p>
            <p>${inviterDisplay} has invited you to join <strong>${tenantName}</strong> on OKR Platform as a <strong>${role}</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.getApplicationUrl()}/auth?invitation=true&email=${encodeURIComponent(recipientEmail)}&tenant=${tenantId}" 
                 style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Accept Invitation
              </a>
            </div>
            <p>If you don't have an account yet, you'll be able to create one when you follow the link.</p>
            <p>This invitation will expire in 7 days.</p>
            <p>Best regards,<br>The OKR Platform Team</p>
          </div>
          <div style="text-align: center; color: #6B7280; font-size: 12px; margin-top: 20px;">
            <p>If you received this email by mistake, please ignore it.</p>
          </div>
        </div>
      `;
      
      if (!process.env.SENDGRID_API_KEY) {
        console.log('Email sending disabled. Would have sent:');
        console.log(`To: ${recipientEmail}`);
        console.log(`Subject: ${subject}`);
        console.log(`Text: ${text}`);
        return true;
      }
      
      await this.mailService.send({
        to: recipientEmail,
        from: this.fromEmail,
        subject,
        text,
        html
      });
      
      console.log(`Invitation email sent to ${recipientEmail} for tenant ${tenantName}`);
      return true;
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return false;
    }
  }
  
  /**
   * Send a new user account creation email with temporary password
   */
  async sendNewUserAccountEmail(
    recipientEmail: string,
    temporaryPassword: string,
    tenantId: string,
    role: string,
    inviterName?: string
  ) {
    try {
      // Get the tenant details
      const tenant = await tenantService.getTenantById(tenantId);
      if (!tenant) {
        throw new Error(`Tenant with ID ${tenantId} not found`);
      }
      
      const inviterDisplay = inviterName || 'An administrator';
      const tenantName = tenant.display_name || tenant.name || 'your organization';
      
      // Email content
      const subject = `Your new account on OKR Platform`;
      const text = `
        Hello,
        
        ${inviterDisplay} has created an account for you on OKR Platform to join ${tenantName} as a ${role}.
        
        Your temporary password is: ${temporaryPassword}
        
        Please log in at:
        ${this.getApplicationUrl()}/auth
        
        You will be asked to change your password after your first login.
        
        Best regards,
        The OKR Platform Team
      `;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2563EB; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0;">Your OKR Platform Account</h1>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 20px;">
            <p>Hello,</p>
            <p>${inviterDisplay} has created an account for you on OKR Platform to join <strong>${tenantName}</strong> as a <strong>${role}</strong>.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-weight: bold;">Your temporary password:</p>
              <p style="font-family: monospace; font-size: 18px; margin: 10px 0 0 0;">${temporaryPassword}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.getApplicationUrl()}/auth" 
                 style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Log In Now
              </a>
            </div>
            <p>You will be asked to change your password after your first login.</p>
            <p>Best regards,<br>The OKR Platform Team</p>
          </div>
          <div style="text-align: center; color: #6B7280; font-size: 12px; margin-top: 20px;">
            <p>If you received this email by mistake, please ignore it.</p>
          </div>
        </div>
      `;
      
      if (!process.env.SENDGRID_API_KEY) {
        console.log('Email sending disabled. Would have sent:');
        console.log(`To: ${recipientEmail}`);
        console.log(`Subject: ${subject}`);
        console.log(`Text: ${text}`);
        return true;
      }
      
      await this.mailService.send({
        to: recipientEmail,
        from: this.fromEmail,
        subject,
        text,
        html
      });
      
      console.log(`Account creation email sent to ${recipientEmail} for tenant ${tenantName}`);
      return true;
    } catch (error) {
      console.error('Error sending account creation email:', error);
      return false;
    }
  }

  /**
   * Get the base URL of the application
   */
  private getApplicationUrl(): string {
    return process.env.APPLICATION_URL || 'http://localhost:5000';
  }
}

export const emailService = new EmailService();