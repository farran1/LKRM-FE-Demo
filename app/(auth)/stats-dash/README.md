# Stats-Dash Dashboard

## Overview
This directory contains the implementation for the /stats-dash statistics visualization dashboard. All components and modules should be logged in COMPONENT_LOG.md to prevent duplication and ensure maintainability.

## Structure
- `page.tsx`: Next.js route entry for /stats-dash
- `stats-dash.tsx`: Main dashboard component
- `components/`: All reusable dashboard components (charts, panels, navigation, etc.)
- `style.module.scss`: Dashboard-specific styles (extend from existing UI conventions)

## Guidelines
- **No Duplicate Components:** Always check COMPONENT_LOG.md and the components directory before creating new code.
- **Consistent Styling:** Follow the general styling and UI conventions of the existing project. Use Ant Design and SCSS modules as in other app sections.
- **Maintainability:** Write clean, modular, and well-documented code. Update this README and the component log as the dashboard evolves.

## How to Add a New Component
1. Check `components/` and `COMPONENT_LOG.md` to ensure the component does not already exist.
2. Create the new component in `components/`.
3. Add an entry to `COMPONENT_LOG.md`.
4. Follow existing style conventions and import `style.module.scss` as needed.

## Contact
For questions or contributions, contact the project maintainer. 