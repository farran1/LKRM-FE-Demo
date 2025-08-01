import React from "react";
import { Card } from "antd";
import styles from "../style.module.scss";

interface SummaryStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  valueColor?: string;
}

const SummaryStatCard: React.FC<SummaryStatCardProps> = ({ icon, label, value, valueColor }) => (
  <Card className={styles.summaryStatCard} variant="filled" style={{ width: '100%', height: '100%', overflow: 'hidden', wordBreak: 'break-word' }}>
    <div className={styles.statLabel}>{label}</div>
    <div className={styles.statContent}>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue} style={{ color: valueColor }}>{value}</span>
    </div>
  </Card>
);

export default SummaryStatCard; 