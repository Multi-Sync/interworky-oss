require('dotenv').config();
const axios = require('axios');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Capability Executor Service
 * Handles execution of different capability types (HTTP, email, etc.)
 */
class CapabilityExecutor {
  /**
   * Main execution method that routes to appropriate handler based on capability_type
   * @param {Object} capability - The capability object from database
   * @param {Object} params - The parameters to use for execution
   * @returns {Promise<Object>} - Execution result
   */
  async execute(capability, params) {
    const capabilityType = capability.capability_type || 'http';

    switch (capabilityType) {
      case 'http':
        return await this.executeHttpCapability(capability, params);
      case 'email':
        return await this.executeEmailCapability(capability, params);
      default:
        throw new Error(`Unsupported capability type: ${capabilityType}`);
    }
  }

  /**
   * Execute HTTP capability - makes HTTP request to external endpoint
   * @param {Object} capability - The capability configuration
   * @param {Object} params - Dynamic parameters from user
   * @returns {Promise<Object>} - HTTP response
   */
  async executeHttpCapability(capability, params) {
    const { method_endpoint, method_verb, dynamic_params, fixed_params } = capability;

    // Build payload combining dynamic and fixed params
    const payload = this.buildPayload(dynamic_params, fixed_params, params);

    try {
      const response = await axios({
        method: method_verb,
        url: method_endpoint,
        data: method_verb !== 'GET' ? payload : undefined,
        params: method_verb === 'GET' ? payload : undefined,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      return {
        success: true,
        type: 'http',
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('HTTP capability execution error:', error.message);
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  /**
   * Execute email capability - sends email via SendGrid
   * @param {Object} capability - The capability configuration
   * @param {Object} params - Dynamic parameters from user
   * @returns {Promise<Object>} - Email sending result
   */
  async executeEmailCapability(capability, params) {
    const { email_config, dynamic_params, method_description, method_name } = capability;

    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('SendGrid from email not configured');
    }

    // Interpolate template variables in subject
    const subject = this.interpolateTemplate(email_config.subject, params);

    // Build email body from dynamic params
    const emailBody = this.buildEmailBody(capability, params);

    try {
      const msg = {
        to: email_config.to,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: email_config.from_name || 'Interworky Assistant',
        },
        subject: subject,
        html: emailBody,
      };

      const result = await sgMail.send(msg);

      return {
        success: true,
        type: 'email',
        message: 'Email sent successfully',
        to: email_config.to,
        subject: subject,
        statusCode: result[0].statusCode,
      };
    } catch (error) {
      console.error('Email capability execution error:', error.message);
      if (error.response) {
        console.error('SendGrid error response:', error.response.body);
      }
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  /**
   * Build payload from dynamic and fixed parameters
   * @param {Array} dynamicParams - Dynamic parameter definitions
   * @param {Array} fixedParams - Fixed parameter definitions
   * @param {Object} params - Actual parameter values
   * @returns {Object} - Combined payload
   */
  buildPayload(dynamicParams = [], fixedParams = [], params = {}) {
    const payload = {};

    // Add dynamic parameters
    dynamicParams.forEach(param => {
      if (params[param.field_name] !== undefined) {
        payload[param.field_name] = params[param.field_name];
      }
    });

    // Add fixed parameters
    fixedParams.forEach(param => {
      payload[param.field_name] = param.field_value;
    });

    return payload;
  }

  /**
   * Replace template variables in a string with actual values
   * Example: "New request from {{user_name}}" with params {user_name: "John"} => "New request from John"
   * @param {string} template - Template string with {{variable}} placeholders
   * @param {Object} params - Parameter values
   * @returns {string} - Interpolated string
   */
  interpolateTemplate(template, params) {
    if (!template) return '';

    let result = template;
    Object.entries(params).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, value);
    });

    return result;
  }

  /**
   * Build HTML email body from capability and parameters
   * @param {Object} capability - Capability configuration
   * @param {Object} params - Parameter values
   * @returns {string} - HTML email body
   */
  buildEmailBody(capability, params) {
    const { email_config, dynamic_params, method_description, method_name } = capability;
    const templateType = email_config.template_type || 'simple';

    if (templateType === 'simple') {
      return this.buildSimpleEmailTemplate(capability, params);
    } else if (templateType === 'detailed') {
      return this.buildDetailedEmailTemplate(capability, params);
    }

    return this.buildSimpleEmailTemplate(capability, params);
  }

  /**
   * Build simple email template
   * @param {Object} capability - Capability configuration
   * @param {Object} params - Parameter values
   * @returns {string} - HTML email
   */
  buildSimpleEmailTemplate(capability, params) {
    const { method_description, method_name, dynamic_params } = capability;

    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #058A7C;">${method_name.split('_').join(' ')}</h2>
        <p style="color: #666;">${method_description}</p>
        <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
        <h3 style="color: #333;">Details:</h3>
        <ul style="list-style: none; padding: 0;">
    `;

    dynamic_params.forEach(param => {
      const value = params[param.field_name] || 'N/A';
      html += `
        <li style="margin: 10px 0; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
          <strong style="color: #058A7C;">${param.field_description}:</strong>
          <span style="color: #333;">${value}</span>
        </li>
      `;
    });

    html += `
        </ul>
        <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This email was sent automatically by Interworky Assistant
        </p>
      </div>
    `;

    return html;
  }

  /**
   * Build detailed email template with better styling
   * @param {Object} capability - Capability configuration
   * @param {Object} params - Parameter values
   * @returns {string} - HTML email
   */
  buildDetailedEmailTemplate(capability, params) {
    const { method_description, method_name, dynamic_params } = capability;
    const timestamp = new Date().toLocaleString();

    let html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #058A7C 0%, #047A6E 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${method_name.split('_').join(' ')}</h1>
        </div>

        <div style="padding: 30px; background-color: #ffffff;">
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #058A7C; margin-bottom: 25px;">
            <p style="margin: 0; color: #555; font-size: 14px;">${method_description}</p>
          </div>

          <h2 style="color: #333; font-size: 18px; margin-bottom: 20px; border-bottom: 2px solid #058A7C; padding-bottom: 10px;">
            Submission Details
          </h2>

          <table style="width: 100%; border-collapse: collapse;">
    `;

    dynamic_params.forEach(param => {
      const value = params[param.field_name] || 'N/A';
      html += `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; width: 40%; font-weight: 600; color: #058A7C;">
            ${param.field_description}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #333;">
            ${value}
          </td>
        </tr>
      `;
    });

    html += `
          </table>

          <div style="margin-top: 25px; padding: 15px; background-color: #f0f7f6; border-radius: 6px;">
            <p style="margin: 0; color: #666; font-size: 13px;">
              <strong>Received:</strong> ${timestamp}
            </p>
          </div>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0; color: #999; font-size: 12px;">
            This email was sent automatically by <strong style="color: #058A7C;">Interworky Assistant</strong>
          </p>
        </div>
      </div>
    `;

    return html;
  }
}

module.exports = new CapabilityExecutor();
