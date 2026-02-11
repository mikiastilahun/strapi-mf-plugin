# Strapi Module Federation Page Builder

A visual page builder plugin for Strapi that enables composing pages from Module Federation remote components. This monorepo contains three applications that work together to provide a complete visual page building experience.

## Overview

This project demonstrates how to build a headless CMS-powered page builder using:

- **Strapi 5** - Headless CMS for content management
- **Module Federation** - Webpack/Rspack feature for sharing code between applications
- **Svelte** - Frontend framework for the layout renderer

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MF Remote Apps                                │
│  (External apps exposing Svelte components via Module Federation)   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ manifest.json
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      mf-demo-strapi                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    mf-plugin                                 │   │
│  │  - Fetches & parses component manifests                     │   │
│  │  - Visual drag-and-drop page builder                        │   │
│  │  - Stores layouts in Strapi collections                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Layout API
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     layout-renderer                                  │
│  - Fetches layouts from Strapi API                                  │
│  - Dynamically loads MF remotes at runtime                          │
│  - Renders Svelte components in a CSS Grid                          │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
.
├── mf-plugin/           # Strapi plugin for managing MF sources and page layouts
├── mf-demo-strapi/      # Demo Strapi application with the plugin installed
└── layout-renderer/     # Svelte frontend that renders layouts using MF components
```

## Applications

### 1. mf-plugin

The core Strapi plugin that provides:

- **MF Source Management**: Register and manage Module Federation remote applications
- **Component Discovery**: Automatically fetches and parses component manifests from remotes
- **Visual Page Builder**: Drag-and-drop interface for composing pages from MF components
- **Layout Storage**: Persists page layouts with grid configuration

#### Content Types

- `mf-source`: Stores Module Federation remote configurations (manifest URL, remote entry, scope, components)
- `page-layout`: Stores page layouts with grid configuration and component placements

### 2. mf-demo-strapi

A demo Strapi 5 application with the mf-plugin installed. Use this as a reference for integrating the plugin into your own Strapi application.

### 3. layout-renderer

A Svelte application that:

- Fetches page layouts from the Strapi API
- Dynamically loads Module Federation remotes at runtime
- Renders components in a CSS Grid layout
- Supports route-based pages via slug

## Prerequisites

- Node.js >= 20.0.0
- pnpm (recommended) or npm
- A Module Federation remote application exposing Svelte components with a manifest

## Setup

### 1. Install Dependencies

```bash
# Install mf-plugin dependencies
cd mf-plugin
pnpm install

# Install Strapi demo dependencies
cd ../mf-demo-strapi
pnpm install

# Install layout renderer dependencies
cd ../layout-renderer
npm install
```

### 2. Configure Environment

#### mf-demo-strapi

Copy the example environment file and configure it:

```bash
cd mf-demo-strapi
cp .env.example .env
```

Edit `.env` with your settings:

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS="your-app-key-1,your-app-key-2"
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

#### layout-renderer

Copy the example environment file:

```bash
cd layout-renderer
cp .env.example .env
```

Edit `.env`:

```env
STRAPI_URL=http://localhost:1337
```

### 3. Link the Plugin (Development)

For local development, use yalc to link the plugin:

```bash
# In mf-plugin directory
cd mf-plugin
pnpm build
npx yalc publish

# In mf-demo-strapi directory
cd ../mf-demo-strapi
npx yalc add mf-plugin
pnpm install
```

### 4. Start the Applications

#### Start Strapi (Terminal 1)

```bash
cd mf-demo-strapi
pnpm develop
```

Strapi will be available at `http://localhost:1337/admin`

#### Start Layout Renderer (Terminal 2)

```bash
cd layout-renderer
npm run dev
```

The renderer will be available at `http://localhost:3001`

## Usage

### 1. Set Up Strapi

1. Open Strapi admin at `http://localhost:1337/admin`
2. Create an admin account if first time
3. Navigate to **Settings > Users & Permissions > Roles > Public**
4. Enable the following permissions for `mf-plugin`:
   - `page-layout`: `find`, `findOne`, `findBySlug`
   - `mf-source`: `find`, `findOne`

### 2. Register an MF Source

1. In Strapi admin, go to **Plugins > Module-federation > Sources**
2. Click **Add Source**
3. Enter your MF remote's manifest URL (e.g., `http://localhost:3000/mf-manifest.json`)
4. The plugin will fetch and parse the component manifest automatically

### 3. Create a Page Layout

1. Go to **Plugins > Module-federation > Layouts**
2. Click **Create Layout**
3. Enter a name and slug for your page
4. Use the visual builder to:
   - Drag components from the palette onto the canvas
   - Configure component props in the properties panel
   - Adjust grid placement (column, row, span)
5. Save the layout

### 4. View the Rendered Page

Open the layout renderer at `http://localhost:3001/{slug}` where `{slug}` is the slug you configured for your layout.

## Creating Compatible MF Remotes

Your Module Federation remote application needs to expose a manifest at a known URL. The manifest should follow this structure:

```json
{
  "name": "my-remote",
  "remoteEntry": "http://localhost:3000/remoteEntry.js",
  "scope": "myRemote",
  "components": [
    {
      "name": "Button",
      "exposePath": "./Button",
      "displayName": "Button Component",
      "description": "A reusable button component",
      "category": "UI",
      "props": {
        "label": {
          "type": "string",
          "required": true,
          "default": "Click me"
        },
        "variant": {
          "type": "string",
          "options": ["primary", "secondary"],
          "default": "primary"
        }
      }
    }
  ]
}
```

### Rspack/Webpack Configuration

Your remote should be configured with Module Federation:

```javascript
// rspack.config.js or webpack.config.js
new ModuleFederationPlugin({
  name: "myRemote",
  filename: "remoteEntry.js",
  exposes: {
    "./Button": "./src/components/Button.svelte",
  },
  shared: {
    svelte: { singleton: true },
  },
});
```

## Testing the Plugin

### Unit Tests

```bash
cd mf-plugin
pnpm test
```

### Integration Testing

1. Start all three applications as described above
2. Register an MF source with valid manifest
3. Create a layout using the visual builder
4. Verify the layout renders correctly in the layout-renderer

### Manual Testing Checklist

- [ ] MF source registration fetches manifest correctly
- [ ] Components appear in the builder palette
- [ ] Drag and drop adds components to canvas
- [ ] Grid placement controls work (column, row, span)
- [ ] Component props can be configured
- [ ] Layout saves successfully
- [ ] Layout renderer fetches and displays the page
- [ ] MF components load dynamically in renderer

## API Reference

### Public API Endpoints

#### Get Layout by Slug

```
GET /api/mf-plugin/page-layouts/slug/:slug
```

Returns the layout configuration for rendering.

#### Get All MF Sources

```
GET /api/mf-plugin/mf-sources
```

Returns all registered MF sources with their components.

## Development

### Building the Plugin

```bash
cd mf-plugin
pnpm build
```

### Watch Mode (Auto-rebuild)

```bash
cd mf-plugin
pnpm watch
```

### Linking for Development

Use yalc for local development:

```bash
# After making changes to mf-plugin
cd mf-plugin
pnpm build
npx yalc push

# In mf-demo-strapi, restart the dev server
```

## Troubleshooting

### Common Issues

**"Container not found on window"**

- Ensure the MF remote's remoteEntry.js is accessible
- Check CORS headers on the remote server
- Verify the scope name matches between manifest and remote config

**Components not appearing in palette**

- Verify the manifest URL is accessible
- Check the manifest JSON structure matches expected format
- Look for errors in Strapi console when fetching manifest

**Layout not rendering**

- Ensure public API permissions are set correctly in Strapi
- Check browser console for CORS or network errors
- Verify the STRAPI_URL environment variable is correct

## License

MIT

## Author

Mikias Tilahun Abebe <mikiastilahun@gmail.com>
