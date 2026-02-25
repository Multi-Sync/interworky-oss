// Templates for both email and SMS
exports.templates = {
  patientAppointmentRequest: {
    email: {
      subject: '[Clinic Name]- Appointment Request Received',
      body: `
     <html>
      <body>
      <p>Dear [Patient Name],</p>
      <p>Thank you for requesting an appointment with [Clinic Name].</p>
      <p>We've received your request for [Appointment Type] on [Patient Requested Date/Time]. Our team will confirm your appointment shortly.</p>
      <p>If you have any questions, please contact us at <a href="tel:[Clinic Phone Number]">[Clinic Phone Number]</a>.</p>
      <p>Best regards,</p>
      <p>[Clinic Name]</p>
      </body>
    </html>
`,
    },
    sms: {
      body: `Dear [Patient Name], Thank you for requesting an appointment with [Clinic Name] on [Patient Requested Date/Time]. We’ll confirm shortly.  If you have any questions, please, contact us at [Clinic Phone Number].`,
    },
  },
  doctorAppointmentRequest: {
    email: {
      subject: 'New Appointment Request from [Patient Name]',
      body: `
      <html>
        <body>
        <p>Dear [Clinic Name] Team,</p>
        <p>A new appointment request has been submitted by [Patient Name] for [Appointment Type] on [Doctor Requested Date/Time].</p>
        <p>Please review and confirm the appointment soon on Interworky Dashboard.</p>
        <p>We are always available to answer any support questions at <a href="mailto:hello@interworky.com">hello@interworky.com</a></p>
        <p>Thank you,</p>
        <p>Interworky Support</p>
        </body>
      </html>
`,
    },
    sms: {
      body: `New appointment request from [Patient Name] for [Appointment Type] on [Doctor Requested Date/Time].`,
    },
  },
  patientAppointmentScheduled: {
    email: {
      subject: '[Clinic Name] - Your Appointment is Scheduled',
      body: `
        <html>
        <body>
          <p>Dear [Patient Name],</p>
          <p>Your appointment with [Clinic Name] has been scheduled for [Patient Confirmed Date/Time].</p>
          <p>We look forward to seeing you!</p>
          <p>If you need to reschedule, please contact us at <a href="tel:[Clinic Phone Number]">[Clinic Phone Number]</a>.</p>
          <p>Best regards,</p>
          <p>[Clinic Name]</p>
        </body>
        </html>
`,
    },
    sms: {
      body: `Dear [Patient Name], your appointment with [Clinic Name] is confirmed for [Patient Confirmed Date/Time].`,
    },
  },
  doctorAppointmentScheduled: {
    email: {
      subject: '[Clinic Name]- Appointment Scheduled with [Patient Name]',
      body: `
        <html>
          <body>
            <p>Dear [Clinic Name] Team,</p>
            <p>The appointment with [Patient Name] for [Appointment Type] has been scheduled on [Doctor Confirmed Date/Time].</p>
            <p>Please use the Interworky dashboard to update or reschedule the appointment.</p>
            <p>We are always available to answer any support questions at <a href="mailto:hello@interworky.com">hello@interworky.com</a></p>
            <p>Thank you,</p>
            <p>Interworky Support</p>
          </body>
        </html>
`,
    },
    sms: {
      body: `Appointment with [Patient Name] for [Appointment Type] confirmed on [Doctor Confirmed Date/Time].`,
    },
  },
  patientAppointmentUpdatedTime: {
    email: {
      subject: '[Clinic Name]- Your Appointment Time Has Been Updated',
      body: `
        <html>
          <body>
            <p>Dear [Patient Name],</p>
            <p>Please note that your appointment at [Clinic Name] has been rescheduled to [Patient New Date/Time].</p>
            <p>If you have any questions or need further assistance, please contact us at <a href="tel:[Clinic Phone Number]">[Clinic Phone Number]</a>.</p>
            <p>Best regards,</p>
            <p>[Clinic Name]</p>
          </body>
        </html>
`,
    },
    sms: {
      body: `Dear [Patient Name], your appointment with Dr. [Doctor Name] has been rescheduled to [Patient New Date/Time].`,
    },
  },
  doctorAppointmentUpdatedTime: {
    email: {
      subject: 'Updated Appointment Time for [Patient Name]',
      body: `
        <html>
          <body>
            <p>Dear [Clinic Name] Team,</p>
            <p>The appointment with [Patient Name] has been rescheduled. The new appointment time is [Doctor New Date/Time].</p>
            <p>Please adjust your schedule accordingly.</p>
            <p>We are always available to answer any support questions at <a href="mailto:hello@interworky.com">hello@interworky.com</a></p>
            <p>Thank you,</p>
            <p>Interworky Support</p>
          </body>
        </html>
`,
    },
    sms: {
      body: `Appointment for [Patient Name] has been rescheduled to [Doctor New Date/Time].`,
    },
  },
  doctorFeedbackPending: {
    email: {
      subject: 'You can request Feedback from [Patient Name]',
      body: `
        <html>
          <body>
            <p>Dear [Clinic Name] Team,</p>
            <p>Now, You can request feedback from [Patient Name] following their recent appointment on [Doctor Appointment Date].</p>
            <p>Patients' feedback can continually improve your practice by understanding the patient experience, and it has been proven to reduce negative reviews.</p>
            <p>We are always available to answer any support questions at <a href="mailto:hello@interworky.com">hello@interworky.com</a></p>
            <p>Best regards,</p>
            <p>Interworky Support</p>
          </body>
        </html>
`,
    },
    sms: {
      body: `You can now request feedback from [Patient Name] for their recent appointment on [Doctor Appointment Date].`,
    },
  },
  patientFeedbackRequest: {
    email: {
      subject: '[Clinic Name]- We Value Your Feedback!',
      body: `
        <html>
          <body>
            <p>Dear [Patient Name],</p>
            <p>Thank you for visiting [Clinic Name] on [Patient Appointment Date].</p>
            <p>We would love to hear about your experience! Please take a moment to share your experience <a href="[Link to Feedback Form]">here</a>.</p>
            <p>Best regards,</p>
            <p>[Clinic Name]</p>
          </body>
        </html>
`,
    },
    sms: {
      body: `Dear [Patient Name], we value your feedback! Please share your experience at [Clinic Name] [Link to Feedback Form].`,
    },
  },
  doctorFeedbackCollected: {
    email: {
      subject: 'Feedback Collected for [Patient Name]',
      body: `
        <html>
          <body>
            <p>Dear [Clinic Name] Team,</p>
            <p>Feedback has been successfully collected for [Patient Name] following their appointment on [Doctor Appointment Date].</p>
            <p>You can review the feedback on <a href="https://interworky.com/dashboard/surveys" target="_blank">Interworky Dashboard</a></p>
            <p>We are always available to answer any support questions at <a href="mailto:hello@interworky.com">hello@interworky.com</a></p>
            <p>Thank you,</p>
            <p>Interworky Support</p>
          </body>
        </html>
`,
    },
    sms: {
      body: `Feedback collected for [Patient Name] from their appointment on [Doctor Appointment Date], please review their feedback on Interworky Dashboard.`,
    },
  },
  patientThankYou: {
    email: {
      subject: '[Clinic Name]- Thank You for Your Feedback!',
      body: `
        <html>
          <body>
            <p>Dear [Patient Name],</p>
            <p>Thank you for providing your feedback regarding your recent appointment at [Clinic Name] on [Patient Appointment Date].</p>
            <p>Your input helps us improve our services.</p>
            <p>Best regards,</p>
            <p>[Clinic Name]</p>
          </body>
        </html>
`,
    },
    sms: {
      body: `Dear [Patient Name], thank you for your feedback on your appointment at [Clinic Name].`,
    },
  },
  patientAppointmentCancelled: {
    email: {
      subject: '[Clinic Name]- Your Appointment Has Been Cancelled',
      body: `
        <html>
          <body>
            <p>Dear [Patient Name],</p>
            <p>We regret to inform you that your appointment at [Clinic Name] on [Patient Appointment Date] has been cancelled.</p>
            <p>If you have any questions or need further assistance, please contact us at <a href="tel:[Clinic Phone Number]">[Clinic Phone Number]</a>.</p>
            <p>Best regards,</p>
            <p>[Clinic Name]</p>
          </body>
        </html>
`,
    },
    sms: {
      body: `Dear [Patient Name], your appointment with [Clinic Name] on [Patient Appointment Date] has been cancelled.`,
    },
  },
  doctorAppointmentCancelled: {
    email: {
      subject: 'Appointment Cancelled for [Patient Name]',
      body: `
        <html>
          <body>
            <p>Dear [Clinic Name] Team,</p>
            <p>The appointment with [Patient Name] for [Appointment Type] on [Doctor Appointment Date] has been cancelled.</p>
            <p>Please adjust your schedule accordingly.</p>
            <p>We are always available to answer any support questions at <a href="mailto:hello@interworky.com">hello@interworky.com</a></p>

            <p>Thank you,</p>
            <p>Interworky Support</p>
            </body>
            </html>
            `,
    },
    sms: {
      body: `Appointment with [Patient Name] for [Appointment Type] on [Doctor Appointment Date] has been cancelled.`,
    },
  },
};

exports.actionMap = {
  Requested: [
    {
      recipient: 'Doctor',
      channels: ['email', 'sms'],
      templateKey: 'doctorAppointmentRequest', // NewAppointmentTemplate
    },
    {
      recipient: 'Patient',
      channels: ['email', 'sms'],
      templateKey: 'patientAppointmentRequest', // AppointmentRequestTemplate
    },
  ],
  Scheduled: [
    {
      recipient: 'Doctor',
      channels: ['email'],
      templateKey: 'doctorAppointmentScheduled', // AppointmentConfirmationDoctorVersion
    },
    {
      recipient: 'Patient',
      channels: ['email', 'sms'],
      templateKey: 'patientAppointmentScheduled', // AppointmentConfirmationPatientVersion
    },
  ],
  Attended: [
    {
      recipient: 'Doctor',
      channels: ['email', 'sms'],
      templateKey: 'doctorFeedbackPending', // PostVisitSentNotificationTemplate
    },
  ],
  'Feedback Pending': [
    {
      recipient: 'Patient',
      channels: ['email', 'sms'],
      templateKey: 'patientFeedbackRequest', // PostSurveyTemplate
    },
  ],
  'Feedback Collected': [
    {
      recipient: 'Doctor',
      channels: ['email', 'sms'],
      templateKey: 'doctorFeedbackCollected', // NewFeedbackNotificationTemplate
    },
    {
      recipient: 'Patient',
      channels: ['email', 'sms'],
      templateKey: 'patientThankYou', // ThankYouTemplate
    },
  ],
  Cancelled: [
    {
      recipient: 'Doctor',
      channels: ['email', 'sms'],
      templateKey: 'doctorAppointmentCancelled', // AppointmentCancelledDoctorVersion
    },
    {
      recipient: 'Patient',
      channels: ['email', 'sms'],
      templateKey: 'patientAppointmentCancelled', // AppointmentCancelledPatientVersion
    },
  ],
  Rescheduled: [
    {
      recipient: 'Doctor',
      channels: ['email', 'sms'],
      templateKey: 'doctorAppointmentUpdatedTime', // AppointmentRescheduledDoctorVersion
    },
    {
      recipient: 'Patient',
      channels: ['email', 'sms'],
      templateKey: 'patientAppointmentUpdatedTime', // AppointmentRescheduledPatientVersion
    },
  ],
};
//todo base on post visit feedback if the rating is less than 4 we send negative review alert
