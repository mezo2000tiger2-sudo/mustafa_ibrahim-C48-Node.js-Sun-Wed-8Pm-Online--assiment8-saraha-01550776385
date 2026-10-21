export function emailTemplate ({otp}){
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Confirm your email</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Your saharah confirmation code is ${otp}. It expires in 2 minutes.
    </div>
   
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;">
            <tr>
              <td style="padding:32px 32px 8px 32px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#111827;">
                saharah
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px;font-family:Helvetica,Arial,sans-serif;font-size:22px;line-height:30px;font-weight:700;color:#111827;">
                Confirm your email address
              </td>
            </tr>
            <tr>
            </tr>
            <tr>
              <td align="center" style="padding:24px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="background-color:#f3f4f6;border-radius:8px;padding:20px 0;font-family:'Courier New',Courier,monospace;font-size:36px;line-height:40px;font-weight:700;letter-spacing:10px;color:#111827;">
                      ${otp}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#6b7280;">
                This code expires in 2 minutes. If you didn't request it, you can ignore this email and no account will be created.
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
            <tr>
              <td align="center" style="padding:16px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:#9ca3af;">
                Sent by sahara
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`
}