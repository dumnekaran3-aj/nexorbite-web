// src/constants/digitalProduct.constants.js
//
// ⚠️ IMPORTANT: BRANCH_ASSET_SLOTS ka structure (slot names + required flags)
// backend ke dig.Product.model.js se HUBAHU match karta hai.
// Agar backend mein koi slot add/remove/required change ho, YAHAN BHI karna hoga —
// warna form aur backend validation (`buildAssetBundle`) mismatch ho jayega
// aur "Required asset missing" error aayega.

export const BRANCH_ASSET_SLOTS = {
  Mechanical: [
    { slot: 'theory_pdf', label: 'Theory / Manual PDF',    emoji: '📄', accept: '.pdf',                                    required: true  },
    { slot: 'cad_file',   label: 'CAD / Blueprint File',   emoji: '🧊', accept: '.step,.iges,.dwg,.f3d,.sldprt,.stl,.zip', required: true  },
    { slot: 'bom',        label: 'BOM (Bill of Materials)',emoji: '📋', accept: '.xlsx,.csv,.pdf',                        required: true  },
    { slot: 'video',      label: 'Assembly Video',         emoji: '🎥', accept: '.mp4,.mov',                              required: false },
    { slot: 'images',     label: 'Reference Images (ZIP)', emoji: '🖼️', accept: '.zip,.jpg,.png',                        required: false },
    { slot: 'simulation', label: 'Simulation / FEA Report',emoji: '📊', accept: '.pdf,.xlsx,.zip',                       required: false },
  ],
  Electrical: [
    { slot: 'theory_pdf', label: 'Theory PDF',               emoji: '📄', accept: '.pdf',                    required: true  },
    { slot: 'schematic',  label: 'Schematic / PCB Gerber',    emoji: '🔌', accept: '.zip,.kicad,.sch,.brd',   required: true  },
    { slot: 'firmware',   label: 'Firmware / Source Code',    emoji: '💻', accept: '.zip,.ino,.c,.cpp,.py',   required: false },
    { slot: 'video',      label: 'Demo / Test Video',         emoji: '🎥', accept: '.mp4,.mov',               required: false },
    { slot: 'simulation', label: 'Simulation (MATLAB/SPICE)', emoji: '📊', accept: '.slx,.m,.asc,.zip',       required: false },
  ],
  EEE: [
    { slot: 'theory_pdf', label: 'Theory PDF',                emoji: '📄', accept: '.pdf',              required: true  },
    { slot: 'schematic',  label: 'PCB Layout / Gerber',        emoji: '🔌', accept: '.zip,.kicad,.brd',  required: true  },
    { slot: 'code',       label: 'Embedded / PLC Code',        emoji: '💻', accept: '.zip,.c,.cpp,.py,.st', required: false },
    { slot: 'video',      label: 'Demo Video',                 emoji: '🎥', accept: '.mp4,.mov',         required: false },
    { slot: 'simulation', label: 'MATLAB / SCADA Simulation',  emoji: '📊', accept: '.slx,.m,.zip',      required: false },
  ],
  Civil: [
    { slot: 'theory_pdf', label: 'Theory / Report PDF',    emoji: '📄', accept: '.pdf',                required: true  },
    { slot: 'cad_file',   label: 'AutoCAD / Revit File',   emoji: '🏢', accept: '.dwg,.rvt,.rfa,.zip', required: true  },
    { slot: 'bom',        label: 'Estimation & Costing Sheet', emoji: '🧮', accept: '.xlsx,.csv,.pdf', required: false },
    { slot: 'video',      label: 'Walkthrough Video',      emoji: '🎥', accept: '.mp4,.mov',           required: false },
    { slot: 'simulation', label: 'STAAD / ETABS File',     emoji: '📊', accept: '.zip,.std',           required: false },
  ],
  CS: [
    { slot: 'theory_pdf',  label: 'Documentation PDF',   emoji: '📄', accept: '.pdf',             required: true  },
    { slot: 'code',        label: 'Source Code (ZIP)',   emoji: '💻', accept: '.zip',             required: true  },
    { slot: 'design_file', label: 'UI/UX Design File',   emoji: '🎨', accept: '.fig,.sketch,.zip',required: false },
    { slot: 'video',       label: 'Demo Video',          emoji: '🎥', accept: '.mp4,.mov',        required: false },
    { slot: 'db_schema',   label: 'DB Schema / ERD',     emoji: '🗄️', accept: '.sql,.pdf,.png,.zip', required: false },
  ],
  Common: [
    { slot: 'theory_pdf',   label: 'Main Document / Report',  emoji: '📄', accept: '.pdf',       required: true  },
    { slot: 'code',         label: 'Supporting Files (ZIP)',  emoji: '📁', accept: '.zip',        required: false },
    { slot: 'presentation', label: 'Presentation (PPT/PDF)',  emoji: '📽️', accept: '.pptx,.pdf',  required: false },
    { slot: 'video',        label: 'Explanation Video',       emoji: '🎥', accept: '.mp4,.mov',   required: false },
  ],
};

export const BRANCH_CATEGORIES = {
  Mechanical: ['CAD Files (.STEP/.IGES)', 'AutoCAD Files (.dwg)', 'SolidWorks Files', 'CATIA Files', 'FEA Simulation', 'BOM (Bill of Materials)', 'Blueprints', 'Technical Drawings', 'Product Design Report', 'Manufacturing Process Doc', 'Thermal Analysis', 'Fluid Dynamics Simulation', 'Notes'],
  Electrical: ['PCB Layout (Gerber)', 'Schematic Diagrams', 'Circuit Design', 'MATLAB Simulation', 'VHDL / Verilog Code', 'Embedded C Code', 'Arduino / ESP32 Project', 'Power System Design', 'Signal Processing Script', 'Control System Design', 'Lab Manual', 'Notes'],
  EEE:        ['PCB Layout (Gerber)', 'Power Electronics Design', 'Schematic Diagrams', 'MATLAB Simulation', 'PLC Programming', 'SCADA Design', 'Renewable Energy Design', 'Motor Drive Design', 'Embedded Systems Code', 'Lab Manual', 'Notes'],
  Civil:      ['AutoCAD Drawings (.dwg)', 'Structural Design', 'Blueprints / Floor Plans', 'STAAD Pro Files', 'Revit / BIM Files', 'Survey Data', 'Estimation & Costing Sheet', 'Environmental Impact Report', 'Road Design', 'Bridge Design', 'Soil Report Template', 'Notes'],
  CS:         ['API / Backend', 'Frontend / UI Kit', 'SaaS Template', 'ML / AI Model', 'Database Schema', 'DevOps Script', 'Mobile App Source', 'Chrome Extension', 'UI Design (Figma)', 'System Design Doc', 'DSA Sheet', 'Interview Prep', 'Open Source Project', 'Notes'],
  Common:     ['Project Report Template', 'Research Paper', 'Presentation (PPT)', 'Resume Template', 'SOP Template', 'Mini Project', 'Final Year Project', 'Internship Report', 'Lab Manual', 'Viva Questions', 'Previous Year Papers'],
};

export const BRANCHES = Object.keys(BRANCH_ASSET_SLOTS);

// Branch → accent colors (dot / pill-bg / border) — used for badges everywhere
export const BRANCH_COLORS = {
  Mechanical: { dot: '#f59e0b', pill: '#f59e0b18', border: '#f59e0b44' },
  Electrical: { dot: '#22d3ee', pill: '#22d3ee18', border: '#22d3ee44' },
  EEE:        { dot: '#ec4899', pill: '#ec489918', border: '#ec489944' },
  Civil:      { dot: '#84cc16', pill: '#84cc1618', border: '#84cc1644' },
  CS:         { dot: '#7c3aed', pill: '#7c3aed18', border: '#7c3aed44' },
  Common:     { dot: '#3b82f6', pill: '#3b82f618', border: '#3b82f644' },
};