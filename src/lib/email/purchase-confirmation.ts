import { sendEmail } from './index';

export interface PurchaseConfirmationData {
  to: string;
  saleId: string;
  totalCents: number;
  currency: string;
  items: Array<{
    productTitle: string;
    quantity: number;
    priceCents: number;
  }>;
  purchaseUrl: string;
  customerName?: string;
}

/**
 * Send purchase confirmation email
 */
export async function sendPurchaseConfirmation(
  data: PurchaseConfirmationData
): Promise<boolean> {
  try {
    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong>${item.productTitle}</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${data.currency.toUpperCase()} ${(item.priceCents / 100).toFixed(2)}
          </td>
        </tr>
      `
      )
      .join('');

    const greeting = data.customerName ? `Hi ${data.customerName}` : 'Hi';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #0070f3 0%, #0052cc 100%); border-radius: 8px; padding: 32px; margin-bottom: 24px; text-align: center;">
    <h1 style="margin: 0 0 8px 0; font-size: 28px; color: #ffffff;">🎉 Order Confirmed!</h1>
    <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Order #${data.saleId.slice(0, 8).toUpperCase()}</p>
  </div>

  <div style="padding: 0 8px; margin-bottom: 24px;">
    <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">
      ${greeting},
    </p>
    <p style="margin: 0; font-size: 16px; color: #374151;">
      Thanks for your purchase! Your digital downloads are ready and waiting for you.
    </p>
  </div>

  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #111827;">Order Summary</h2>

    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600; font-size: 14px;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600; font-size: 14px;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600; font-size: 14px;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 16px 12px 0 12px; text-align: right; font-weight: 600; font-size: 16px;">Total:</td>
          <td style="padding: 16px 12px 0 12px; text-align: right; font-weight: 700; font-size: 20px; color: #0070f3;">
            ${data.currency.toUpperCase()} ${(data.totalCents / 100).toFixed(2)}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div style="text-align: center; margin-bottom: 32px;">
    <a href="${data.purchaseUrl}" style="display: inline-block; background-color: #0070f3; color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 112, 243, 0.2);">
      Download Your Files
    </a>
  </div>

  <div style="background-color: #eff6ff; border-left: 4px solid #0070f3; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
    <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1e40af; font-weight: 600;">📥 Access Your Downloads</h3>
    <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.6;">
      Your digital files are available immediately. Click the button above to view your order and download your purchases. Your files will remain available in your account forever.
    </p>
  </div>

  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827; font-weight: 600;">What's Next?</h3>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #6b7280; line-height: 1.8;">
      <li>Your files are instantly available for download</li>
      <li>You can re-download your purchases anytime from your account</li>
      <li>Check out the creator profiles to see their other work</li>
    </ul>
  </div>

  <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 14px; color: #92400e;">
      <strong>💡 Need help?</strong> Having issues with your download? Reply to this email or visit our support page. We're here to help!
    </p>
  </div>

  <div style="text-align: center; padding: 24px 0; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
      Thanks for supporting indie tabletop game creators!
    </p>
    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0070f3;">
      Game Loopers
    </p>
    <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
      A social commerce platform for tabletop game creators
    </p>
  </div>
</body>
</html>
    `;

    const text = `
${greeting},

Thanks for your purchase! Your digital downloads are ready and waiting for you.

ORDER CONFIRMED
Order #${data.saleId.slice(0, 8).toUpperCase()}

ORDER SUMMARY
${data.items.map(item => `${item.productTitle}\nQuantity: ${item.quantity} × ${data.currency.toUpperCase()} ${(item.priceCents / item.quantity / 100).toFixed(2)} = ${data.currency.toUpperCase()} ${(item.priceCents / 100).toFixed(2)}`).join('\n\n')}

Total: ${data.currency.toUpperCase()} ${(data.totalCents / 100).toFixed(2)}

DOWNLOAD YOUR FILES
${data.purchaseUrl}

Your digital files are available immediately. Your files will remain available in your account forever.

What's Next?
- Your files are instantly available for download
- You can re-download your purchases anytime from your account
- Check out the creator profiles to see their other work

Need help? Having issues with your download? Reply to this email and we'll be happy to help!

Thanks for supporting indie tabletop game creators!
Game Loopers - A social commerce platform for tabletop game creators
    `.trim();

    const result = await sendEmail({
      from: 'Game Loopers <orders@gameloopers.com>',
      to: data.to,
      subject: `🎉 Order Confirmed - Game Loopers (#${data.saleId.slice(0, 8).toUpperCase()})`,
      html,
      text,
    });

    return result.success;
  } catch (error) {
    console.error('Error sending purchase confirmation email:', error);
    return false;
  }
}
