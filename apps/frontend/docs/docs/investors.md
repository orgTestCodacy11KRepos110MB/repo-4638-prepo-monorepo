import useBaseUrl from '@docusaurus/useBaseUrl';
import { institutionalInvestors } from '../src/lib/investors.js'
import Investor from '../src/components/Investor'

# Investors

prePO is backed by the following [institutional investors](#🏢-institutional-investors) and [angel investors](#👼-angel-investors).<br/>
For any investment inquiries, please contact us.

### 🏢&nbsp; Institutional Investors

<div className="cols-section">
  <ul>
  {institutionalInvestors.map((investor) => 
    <Investor 
      key={investor.name} 
      investor={{...investor, 
      logo: useBaseUrl(`/img/investors/institutional/${investor.logo}`)
      }} 
    />)}
  </ul>
</div>

### 👼&nbsp; Angel Investors
