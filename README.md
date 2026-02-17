# WP Ranked List Blocks

Semantically marked-up ranked list (listicle) blocks for WordPress. Outputs schema.org ItemList JSON-LD so content is structured for search and AI ingestion.

## What it does

- **Ranked List Item** block: add ordered list items with title, subtitle, description, image, optional hero image, link, and schema type (Product, Place, Book, etc.).
- Position is derived from block order (no manual numbering).
- When a post has two or more items, the plugin outputs `ItemList` JSON-LD in the head with `ListItem` entries and type-specific schema (e.g. `Product`, `Place`, `LocalBusiness`).

## Requirements

- WordPress 6.0+
- PHP 8.1+

## Installation

1. Upload the plugin folder to `wp-content/plugins/` (folder name should be `wp-ranked-list-blocks`), or install via ZIP.
2. Activate **WP Ranked List Blocks** in the WordPress admin.
3. Add the **Ranked List Item** block from the block inserter (Widgets or embed in a template).

## Development

```bash
npm install
npm run build
```

## Author

Chris Gee — [withchrisgee.com](https://withchrisgee.com)
