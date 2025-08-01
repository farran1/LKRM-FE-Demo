import React from "react";
import { Card } from "antd";
import styles from "../style.module.scss";

interface BaseDashboardCardProps {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  overflow?: "scroll" | "clipped";
  minW?: number;
  minH?: number;
  className?: string;
  children: React.ReactNode;
}

export default function BaseDashboardCard({
  title,
  extra,
  overflow = "scroll",
  className = "",
  children,
}: BaseDashboardCardProps) {
  return (
    <Card
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
      styles={{ body: { flex: 1, display: "flex", flexDirection: "column", padding: 0 } }}
      title={title ? <div className={styles.dashboardCardTitle}>{title}</div> : undefined}
      extra={extra}
      variant="borderless"
      className={styles.dashboardCardWrapper + (className ? ` ${className}` : "")}
    >
      <div
        className={
          overflow === "scroll"
            ? styles.dashboardCardContent
            : styles.dashboardCardContent + " " + styles["dashboardCardContent--clipped"]
        }
      >
        {children}
      </div>
    </Card>
  );
} 
 