import React from 'react'

const Investor: React.FC<{ investor: { name: string; logo: string; website: string } }> = ({
  investor,
}) => (
  <li className="investor-wrapper">
    <a className="investor-link" href={investor.website} target="_blank" rel="noopener noreferrer">
      <img className="investor-image" loading="lazy" src={investor.logo} alt={investor.name} />
    </a>
  </li>
)

export default Investor
