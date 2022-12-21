import React from 'react'
import { involveItems } from './involve-items'
import style from './involve.module.css'

const GetInvolved: React.FC = () => (
  <ul className={style.wrapper}>
    {involveItems.map(({ icon, name, link }) => {
      const content = (
        <div className={style.involveCard}>
          <p className={style.involveText}>
            <span>{icon}</span>
            {name}
          </p>
        </div>
      )
      return (
        <li key={name} className={style.involveWrapper}>
          {link ? (
            <a className={style.involveLink} href={link} target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          ) : (
            content
          )}
        </li>
      )
    })}
  </ul>
)

export default GetInvolved
