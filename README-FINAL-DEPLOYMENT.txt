LUXORIA SCENTS — FINAL EMAIL + AUTOMATIC ORDERS + ADMIN DASHBOARD
===================================================================

WHAT THIS PACKAGE DOES
- Keeps the existing storefront design, theme, pages, product catalogue, images and admin dashboard layout.
- Checkout sends the order email through the configured EmailJS service.
- After email succeeds, the order is saved automatically:
  * Local static preview: browser localStorage, visible in admin.html in the same browser and same origin.
  * Hostinger live website: api.php writes the order to data/store.json so the existing admin dashboard loads it for every admin login.
- Dashboard Orders & Sales shows order ID, customer name, email, phone, full address, city, postal code, products, quantities, payment preference, notes, total and date.
- Live orders also update stock, sold quantities, revenue, units sold and activity history.
- WhatsApp is not used for checkout.
- The existing Thank You popup remains.

EMAILJS SETTINGS (REQUIRED)
The package uses the EmailJS IDs already present in the project:
  Public key: _3kAiRsrEffoEs0Q2
  Service ID: service_qxxgkis
  Template ID: template_klo41mf

In the EmailJS dashboard:
1. Open template_klo41mf.
2. Set the recipient / To Email to luxoriascents@gmail.com.
3. Include {{message}} in the email body. Recommended subject: {{subject}}.
4. Optional template variables: {{name}}, {{email}}, {{phone}}, {{order_id}}, {{order_total}}, {{order_details}}, {{customer_name}}, {{customer_email}}, {{customer_phone}}.
5. Confirm the connected email service is verified and active. Test an email from EmailJS.

LOCAL TESTING — NO XAMPP
1. Extract the ZIP.
2. Open the extracted folder in VS Code.
3. Run the website with VS Code Live Server (or another static HTTP server). Do not open via file://.
4. Use the exact same hostname and port for storefront and admin, e.g. http://127.0.0.1:5500.
5. Submit a test order. EmailJS sends the email; the order is saved in that browser's localStorage.
6. Open /admin.html using the same hostname, port and browser. On localhost the admin opens in Local Preview mode and displays the test order.
7. Local Preview data is only in that browser. It does not sync to Hostinger or another device.

HOSTINGER LIVE DEPLOYMENT
1. Back up the existing public_html first.
2. Upload/extract this ZIP into public_html, keeping the folder structure (assets/, data/, etc.) directly under public_html.
3. The live dashboard requires the included PHP API. Hostinger PHP 8+ is used for shared order storage and CMS/dashboard persistence. This is separate from local static testing; XAMPP is not needed.
4. Open https://YOUR-DOMAIN/setup.php and create the admin password (12+ characters). Delete setup.php after setup.
5. Ensure data/ and assets/uploads/ are writable by PHP (typically 755/775 depending on Hostinger).
6. Sign in at /admin.html. Live orders are saved centrally in data/store.json and shown in Orders & Sales.
7. Configure EmailJS to allow the live domain if domain restrictions are enabled.

IMPORTANT LIMITATIONS
- A pure static HTML/CSS/JS site cannot store shared orders for all visitors or sync a shared dashboard across devices by itself. The live Hostinger dashboard uses the included PHP API and JSON store for that reason.
- Local Preview is intentionally browser-local and is only for testing without XAMPP/PHP.
- The EmailJS public key is client-side by design. Never add an EmailJS private key to website JavaScript.
- No online card payment processing is added.
