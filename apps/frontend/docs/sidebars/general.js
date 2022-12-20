function makeReworkItem(id) {
  return {
    type: 'doc',
    id,
    className: 'rework',
  }
}

module.exports = [
  makeReworkItem('general/overview'),
  makeReworkItem('general/use-cases'),
  makeReworkItem('general/investors'),
  makeReworkItem('general/partners'),
  makeReworkItem('general/get-involved'),
  makeReworkItem('general/official-links'),
  {
    type: 'category',
    label: '💻 Platform',
    collapsed: false,
    collapsible: false,
    className: 'rework',
    items: [
      makeReworkItem('general/platform/markets'),
      makeReworkItem('general/platform/testnet'),
      makeReworkItem('general/platform/roadmap'),
      makeReworkItem('general/platform/faq'),
    ],
  },
]
