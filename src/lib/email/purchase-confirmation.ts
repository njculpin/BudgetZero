import { sendEmail } from './index';

export interface PurchaseConfirmationData {
  to: string;
  saleId: string;
  totalCents: number;
  currency: string;
  items: Array<{
    productTitle: string;
    variantTitle: string;
    quantity: number;
    priceCents: number;
  }>;
  purchaseUrl: string;
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
            <strong>${item.productTitle}</strong><br>
            <span style="color: #6b7280; font-size: 14px;">${item.variantTitle}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${data.currency.toUpperCase()} ${(item.priceCents / 100).toFixed(2)}
          </td>
        </tr>
      `
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9fafb; border-radius: 8px; padding: 32px; margin-bottom: 24px;">
    <h1 style="margin: 0 0 8px 0; font-size: 28px; color: #111827;">Order Confirmed!</h1>
    <p style="margin: 0; color: #6b7280; font-size: 16px;">Order #${data.saleId.slice(0, 8)}</p>
  </div>

  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
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
          <td colspan="2" style="padding: 16px 12px 0 12px; text-align: right; font-weight: 600;">Total:</td>
          <td style="padding: 16px 12px 0 12px; text-align: right; font-weight: 600; font-size: 18px;">
            ${data.currency.toUpperCase()} ${(data.totalCents / 100).toFixed(2)}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div style="text-align: center; margin-bottom: 24px;">
    <a href="${data.purchaseUrl}" style="display: inline-block; background-color: #0070f3; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
      View Order & Download
    </a>
  </div>

  <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 14px; color: #6b7280;">
      Your digital downloads are ready! Click the button above to access your purchase and download your files.
    </p>
  </div>

  <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0; font-size: 14px; color: #9ca3af;">
      Thanks for supporting indie game creators!<br>
      Game Loopers
    </p>
  </div>
</body>
</html>
    `;

    const result = await sendEmail({
      from: 'Game Loopers <orders@gameloopers.com>',
      to: data.to,
      subject: `Order Confirmed - Game Loopers`,
      html,
    });

    if (result.success) {
      console.log(`Purchase confirmation email sent to ${data.to} for sale ${data.saleId}`);
    }

    return result.success;
  } catch (error) {
    console.error('Error sending purchase confirmation email:', error);
    return false;
  }
}
