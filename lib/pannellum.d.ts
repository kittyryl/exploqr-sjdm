// Pannellum ships no type declarations; it's loaded as an untyped side-effect
// import that attaches `window.pannellum` (see components/Pano360Viewer.tsx,
// which types the resulting global itself rather than through this module).
declare module "pannellum/build/pannellum.js";
