import React, { memo } from "react";
import { Card, Button } from "antd";
import { PlayCircleOutlined, BarChartOutlined, UserOutlined, ExportOutlined } from "@ant-design/icons";
import Link from "next/link";
import styles from "../style.module.scss";

const QuickActionsCard: React.FC = memo(() => (
  <Card 
    className={styles.quickActionsCard} 
    title={<span className={styles.cardTitle}>Quick Actions</span>} 
    styles={{
      body: { padding: '10px 12px 8px 12px' }
    }}
  >
    <div className={styles.actionsContainer}>
      <Link href="/live-stat-tracker">
        <Button 
          type="primary" 
          icon={<PlayCircleOutlined />} 
          size="large" 
          className={styles.actionBtn} 
          block
        >
          Live Stats Tracker
        </Button>
      </Link>
      <Button 
        icon={<BarChartOutlined />} 
        size="large" 
        className={styles.actionBtnOutlined} 
        block
      >
        Analyze Last Game
      </Button>
      <Button 
        icon={<UserOutlined />} 
        size="large" 
        className={styles.actionBtnOutlined} 
        block
      >
        Player Development
      </Button>
      <Button 
        icon={<ExportOutlined />} 
        size="large" 
        className={styles.actionBtnOutlined} 
        block
      >
        Generate Report
      </Button>
    </div>
  </Card>
));

QuickActionsCard.displayName = 'QuickActionsCard';

export default QuickActionsCard; 