export function generateEmailHtml({ intro, mainBody, footer, createdAt }) {
  // Format the timestamp
  const formattedDate = new Date(createdAt).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { font-family: Arial, sans-serif; background-color: #f7f7f7; margin:0; padding:0; }
      .container { max-width:600px; margin:30px auto; background:#fff; padding:20px; border-radius:8px; }
      .header { font-size:20px; font-weight:bold; color:#333; margin-bottom:15px; }
      .body-text { font-size:16px; color:#555; line-height:1.5; margin-bottom:20px; }
      .footer { font-size:14px; color:#999; margin-top:30px; text-align:center; }
      .date { font-size:12px; color:#aaa; margin-bottom:20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="date">Sent: ${formattedDate}</div>
      <div class="header">${intro}</div>
      <div class="body-text">${mainBody}</div>
      <div class="footer">${footer}</div>
    </div>
  </body>
  </html>
  `;
}
