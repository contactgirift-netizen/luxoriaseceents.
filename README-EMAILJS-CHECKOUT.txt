LUXORIA SCENTS — EMAILJS CHECKOUT UPDATE
=========================================

WHAT CHANGED
- Checkout no longer opens WhatsApp.
- The existing checkout form sends the order details through EmailJS from the browser.
- On successful EmailJS delivery, the customer sees the Luxoria Thank You popup.
- On failure, the customer sees an error popup and the cart is retained.
- Existing product images, catalogue, page design, CSS, and admin files are retained.

IMPORTANT EMAILJS SETUP (REQUIRED)
This package uses the EmailJS service and template IDs already present in the website:
  Public key: _3kAiRsrEffoEs0Q2
  Service ID: service_qxxgkis
  Template ID: template_klo41mf

In the EmailJS dashboard:
1. Open the email template `template_klo41mf`.
2. Set the template's recipient / To Email to: luxoriascents@gmail.com
3. Ensure the template body includes at least {{message}}.
   Recommended subject: {{subject}}
   Optional fields: {{name}}, {{email}}, {{phone}}, {{order_id}}, {{order_total}}, {{order_details}}
4. Save the template and send a test email from EmailJS.
5. Ensure the connected email service is verified and active.

RUNNING LOCALLY
- You can preview the website using VS Code Live Server or another static web server.
- Internet access is required because EmailJS is an online email service.
- Opening files offline or blocking the EmailJS CDN will prevent email sending.
- No XAMPP, PHP mail server, or MySQL is needed for the checkout email.

HOSTINGER
- Upload the updated files while preserving your existing site.
- The checkout email flow is browser-side and works on the live domain too, once EmailJS allows that domain and the template is configured.
- Keep the EmailJS public key only in the frontend; never put private keys in JavaScript.

IMPORTANT LIMITATION ABOUT THE ADMIN DASHBOARD
The existing admin dashboard and live shared CMS use the website's existing PHP API (`api.php`) and server-side storage. Those original files are intentionally retained to avoid changing the dashboard. A purely static HTML/CSS/JS host cannot provide shared persistent dashboard orders or shared inventory across devices without a backend or an external database service. The EmailJS checkout email itself does not require PHP.
