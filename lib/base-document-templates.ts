/** Base L1–L4 document template names, used when creating a new company or seeding. */
export const BASE_DOCUMENT_TEMPLATES: { levelOrder: number; names: string[] }[] = [
  {
    levelOrder: 1,
    names: [
      'L1-01_QMS Diagram (PowerPoint)',
      'L1-02_Quality Overview (Word)',
      'L1-03_SWOT Analysis (PowerPoint)',
    ],
  },
  {
    levelOrder: 2,
    names: [
      'L2-01_Internal Audits',
      'L2-02_Documented Information',
      'L2-03_Non-Conformance',
      'L2-04_Corrective Actions',
      'L2-05_Sales',
      'L2-06_Machining',
      'L2-07_Final Inspection',
      'L2-08_Purchasing',
      'L2-09_Calibration',
    ],
  },
  {
    levelOrder: 3,
    names: [
      'L3-01_Supplier Evaluation (Word)',
      'L3-02_Organizational Knowledge (Word)',
      'L3-03_Job Description CEO (Word)',
      'L3-04_Job Description Manager (Word)',
      'L3-05_Job Description Assistant (Word)',
      'L3-06_Risk Analysis FMEA (Excel)',
    ],
  },
  {
    levelOrder: 4,
    names: [
      'L4-01_Master List of Documents',
      'L4-02_Master List of Records',
      'L4-03_Internal Audit Checklist',
      'L4-04_Internal Audit Schedule',
      'L4-05_Internal Audit Report',
      'L4-06_Management Review Agenda',
      'L4-07_Non-Conformance Report',
      'L4-08_Corrective Action Request',
      'L4-09_Corrective Action Log',
      'L4-10_Supplier Evaluation Form',
      'L4-11_Approved Supplier List',
      'L4-12_Customer Survey',
      'L4-13_Calibration Log',
      'L4-14_DIR Inspection',
      'L4-15_Training Log',
      'Records Folder',
    ],
  },
];
