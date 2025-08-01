"use client";
import { CreditCardOutlined } from "@ant-design/icons";
import { Typography } from "antd";

const LKRM_DARK_BLUE = "#032a3f";

export default function ExpensesComingSoon() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: LKRM_DARK_BLUE }}>
      <CreditCardOutlined style={{ fontSize: 64, color: LKRM_DARK_BLUE, marginBottom: 24 }} />
      <Typography.Title level={2} style={{ color: LKRM_DARK_BLUE }}>Expenses - Coming Soon</Typography.Title>
      <Typography.Paragraph style={{ color: LKRM_DARK_BLUE }}>We're working hard to bring you this feature. Stay tuned!</Typography.Paragraph>
    </div>
  );
} 