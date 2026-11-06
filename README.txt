LUXORIA SCENTS — LIVE WEBSITE + ADMIN CMS
=========================================

HOSTINGER INSTALLATION
1. In Hostinger hPanel, open Websites > Manage > File Manager.
2. Open public_html. Back up the current website before replacing files.
3. Upload this ZIP and extract it directly into public_html (not into an extra nested folder).
4. Confirm index.html, admin.html, api.php and setup.php are directly inside public_html.
5. Open https://YOUR-DOMAIN/setup.php
6. Create a new admin password (minimum 12 characters).
7. After setup succeeds, DELETE setup.php from public_html.
8. Open https://YOUR-DOMAIN/admin.html and sign in using the password you created.
9. Visit https://YOUR-DOMAIN/ to view the storefront.

LIVE CMS FEATURES
- Product add/edit/delete, product photo upload, price, description, category and stock.
- Blog add/edit/delete and image upload.
- Website image manager for homepage banner, About Us image and Our Story image.
- Announcement bar and page heading/intro/additional text editor for supported pages.
- Product, blog, page and content changes are stored on the hosting server and loaded by every visitor.
- Pleasure products are seeded as out of stock.
- Testimonial slider is on the homepage only. Its current entries are sample copy, not verified customer reviews.

IMPORTANT HOSTING REQUIREMENTS
- PHP 8.0+ recommended.
- PHP sessions and Fileinfo extension enabled.
- The /data folder and /assets/uploads folder must be writable by PHP (usually 755/775 depending on Hostinger setup).
- Keep HTTPS enabled. Do not share the admin password.
- Back up /data/store.json and /assets/uploads regularly.
- Do not delete api.php, config.php or the data folder.
- Delete setup.php immediately after creating the admin password.

IMPORTANT NOTES
- This package uses a small JSON-file store on the same Hostinger account; it does not require MySQL.
- The API stores content centrally, so edits from the dashboard appear on the public domain after refresh.
- Existing design and page layout are retained. Page heading/intro, products, blogs and selected key images are editable from the dashboard. Deep layout/code changes still require a developer.
- The checkout remains a WhatsApp enquiry flow; this does not add online card payments or automatic order processing.
- For larger stores or high traffic, migrate this JSON store to MySQL and add hardened deployment controls.
