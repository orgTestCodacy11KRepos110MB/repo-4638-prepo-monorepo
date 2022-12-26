function makeReworkItem(id) {
  return {
    type: 'doc',
    id,
    className: 'rework',
  }
}

function makeSectionTitle(text, icon) {
  return {
    type: 'html',
    value: `<p class="sidebar-section-title"><span>${icon}</span>${text}</p>`,
    defaultStyle: true,
    className: 'sidebar-section-title-wrapper',
  }
}

module.exports = [
  makeSectionTitle('Overview', '🏛'),
  makeReworkItem('governance/overview/glossary'),
  makeReworkItem('governance/overview/constitution'),
  makeReworkItem('governance/overview/structure'),
  makeReworkItem('governance/overview/voting-power'),
  makeReworkItem('governance/overview/get-involved'),

  makeSectionTitle('Actions', '🗳'),
  makeReworkItem('governance/actions/delegation'),
  makeReworkItem('governance/actions/elections'),
  makeReworkItem('governance/actions/referendums'),
  makeReworkItem('governance/actions/proposals'),
  makeReworkItem('governance/actions/voting'),

  makeSectionTitle('Standard Processes', '🔢'),
  makeReworkItem('governance/standard-processes/market-listing'),
  makeReworkItem('governance/standard-processes/market-migration'),
  makeReworkItem('governance/standard-processes/market-resolution'),
  makeReworkItem('governance/standard-processes/fee-parameters'),
  makeReworkItem('governance/standard-processes/fee-distribution'),
  makeReworkItem('governance/standard-processes/collateral-yield-strategies'),
  makeReworkItem('governance/standard-processes/liquidity-redirection'),
  makeReworkItem('governance/standard-processes/code-execution'),
  makeReworkItem('governance/standard-processes/grants'),
  makeReworkItem('governance/standard-processes/charity'),

  makeSectionTitle('Further Reading', '📚'),
  makeReworkItem('governance/further-reading/roadmap'),
  {
    type: 'category',
    label: 'Protections',
    className: 'rework',
    items: [
      makeReworkItem('governance/further-reading/protections/liability'),
      makeReworkItem('governance/further-reading/protections/automation'),
      makeReworkItem('governance/further-reading/protections/attack-mitigation'),
    ],
  },
  makeReworkItem('governance/further-reading/token-transferability'),
  makeReworkItem('governance/further-reading/treasury-management'),
  makeReworkItem('governance/further-reading/multisig-addresses'),
  makeReworkItem('governance/further-reading/external-resources'),
]
