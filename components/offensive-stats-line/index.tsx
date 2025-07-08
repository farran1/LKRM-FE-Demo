import { memo } from "react"
import style from './style.module.scss'

const OffensiveStatsLine = () => {
  return (
    <div className={style.container}>
      <span />
      <span />
      <span />
    </div>
  )
}

export default memo(OffensiveStatsLine)