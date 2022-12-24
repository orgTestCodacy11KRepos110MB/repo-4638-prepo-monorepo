module.exports = [
  'intro',
  'basics',
  {
    type: 'category',
    label: 'Core Concepts ⚙️',
    items: [
      'concepts/actors',
      'concepts/prect',
      'concepts/markets',
      'concepts/rewards',
      'concepts/risk-minimisation',
    ],
  },
  'tokenomics',
  {
    type: 'category',
    label: 'Governance 🧑‍⚖️',
    link: { type: 'doc', id: 'governance' },
    items: ['governance/glossary', 'governance/process'],
  },
  {
    type: 'doc',
    id: 'investors',
    label: 'Investors 💸',
  },
  {
    type: 'doc',
    label: 'Partners 🤝',
    id: 'partners',
  },
  'roadmap',
  'simulator',
  'demo',
  'get-involved',
  'official-links',
  'faq',
]
