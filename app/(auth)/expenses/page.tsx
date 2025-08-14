"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, Col, DatePicker, Dropdown, Input, Row, Select, Space, Statistic, Table, Tag, Typography } from "antd";
import NewReceiptForm from "../budgets/[slug]/new-receipt/NewReceiptForm";
import { PlusOutlined, FilterOutlined, DownloadOutlined, FileTextOutlined, MoreOutlined } from "@ant-design/icons";
import style from "./style.module.scss";

type Expense = {
  id: string;
  date: string; // ISO string
  merchant: string;
  category: string;
  amount: number;
  method: string; // Card/Cash/etc (not shown in table per Figma)
  note?: string;
  event?: string;
  receipt?: boolean;
  receiptTitle: string;
  budget: string;
};

const { Title, Text } = Typography;

const categories = [
  "Travel & Transportation",
  "Food & Drink",
  "Lodging",
  "Equipment",
  "Fees",
  "Supplies",
  "Other",
];

const methods = ["Card", "Cash", "Reimbursed", "Invoice"];

const mockExpenses: Expense[] = [
  { id: "1", date: new Date("2025-02-12").toISOString(), merchant: "ProTools Supply", category: "Equipment", amount: 450, method: "Card", event: "Team Workout", receipt: true, receiptTitle: "New Tools Purchase", budget: "Equipment Budget" },
  { id: "2", date: new Date("2025-02-12").toISOString(), merchant: "SafeHands Inspec.", category: "Maintenance", amount: 600, method: "Card", event: "Team Workout", receipt: true, receiptTitle: "Routine Check", budget: "Equipment Budget" },
  { id: "3", date: new Date("2025-02-12").toISOString(), merchant: "Grand City Hotel", category: "Travel", amount: 600, method: "Invoice", event: "Team Workout", receipt: true, receiptTitle: "Hotel Stay", budget: "Equipment Budget" },
];

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<[string | null, string | null]>([null, null]);
  const [category, setCategory] = useState<string | undefined>();
  const [method, setMethod] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const data = useMemo(() => {
    return mockExpenses.filter((e) => {
      const matchesText = [e.merchant, e.category, e.method].some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const inCategory = category ? e.category === category : true;
      const inMethod = method ? e.method === method : true;
      const inRange = (() => {
        if (!range[0] && !range[1]) return true;
        const d = new Date(e.date).getTime();
        const a = range[0] ? new Date(range[0]).getTime() : -Infinity;
        const b = range[1] ? new Date(range[1]).getTime() : Infinity;
        return d >= a && d <= b;
      })();
      return matchesText && inCategory && inMethod && inRange;
    });
  }, [search, range, category, method]);

  const total = data.reduce((s, e) => s + e.amount, 0);

  const exportCsv = () => {
    const headers = ["Receipt","Merchant Name","Amount","Category","Date","Event","Budget"];
    const rows = data.map((e) => [
      e.receiptTitle,
      e.merchant,
      `$${e.amount.toFixed(2)}`,
      e.category,
      new Date(e.date).toLocaleDateString(),
      e.event || "",
      e.budget,
    ]);
    const csv = [headers, ...rows].map(r => r.map(val => `"${String(val).replaceAll('"','\"')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default as any;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const headers = [["Receipt","Merchant","Amount","Category","Date","Event","Budget"]];
      const rows = data.map(e => [
        e.receiptTitle,
        e.merchant,
        `$${e.amount.toFixed(2)}`,
        e.category,
        new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        e.event || '',
        e.budget,
      ]);
      doc.setFontSize(14);
      doc.text('Expenses', 40, 40);
      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 60,
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [15, 39, 65], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        didDrawPage: (data: any) => {
          doc.setFontSize(8);
          const pageStr = `Page ${doc.getNumberOfPages()}`;
          doc.text(pageStr, doc.internal.pageSize.getWidth() - 60, doc.internal.pageSize.getHeight() - 20);
        }
      });
      doc.save(`expenses-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export requires dependencies. Please try again after install completes.');
    }
  };

  const formatTableDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const actionMenu = { items: [
    { key: 'view', label: 'View' },
    { key: 'edit', label: 'Edit' },
    { key: 'delete', danger: true, label: 'Delete' },
  ]};

  const columns = [
    {
      title: "Receipt",
      dataIndex: "receiptTitle",
      key: "receiptTitle",
      width: 220,
      render: (_: any, record: Expense) => (
        <div className={style.receiptCell}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          <span className={style.ellipsis}>{record.receiptTitle}</span>
        </div>
      ),
    },
    { title: "Merchant Name", dataIndex: "merchant", key: "merchant", width: 220 },
    { title: "Amount", dataIndex: "amount", key: "amount", width: 120, align: "right", render: (n: number) => <span className={style.amountCell}>${n.toFixed(0)}</span> },
    { title: "Category", dataIndex: "category", key: "category", width: 160, render: (c: string) => (
      <Tag className={`${style.categoryTag} ${c === 'Travel' ? style.categoryTravel : c === 'Maintenance' ? style.categoryMaintenance : style.categoryEquipment}`}>{c}</Tag>
    ) },
    { title: "Date", dataIndex: "date", key: "date", width: 140, render: (v: string) => formatTableDate(v) },
    { title: "Event", dataIndex: "event", key: "event", width: 160, render: (e: string) => <a>{e}</a> },
    { title: "Budget", dataIndex: "budget", key: "budget", width: 180, render: (b: string) => <a>{b}</a> },
    { title: "Actions", key: "actions", align: "center", width: 80, render: () => (
      <Dropdown menu={actionMenu} trigger={["click"]}>
        <Button type="text" icon={<MoreOutlined />} />
      </Dropdown>
    )},
  ];

  return (
    <div className={style.container}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Row align="middle" justify="space-between">
            <Col>
              <Title level={3} style={{ margin: 0 }}>Expenses</Title>
              <Text type="secondary">Review, filter and add expenses</Text>
            </Col>
            <Col>
              <Space>
                <Button icon={<FilterOutlined />} onClick={() => setShowFilters((v) => !v)} aria-pressed={showFilters}>
                  Filters
                </Button>
                <Dropdown
                  menu={{
                    items: [
                      { key: 'csv', label: 'Export CSV', onClick: () => exportCsv() },
                      { key: 'pdf', label: 'Export PDF', onClick: () => exportPdf() },
                    ],
                  }}
                  trigger={["click"]}
                >
                  <Button icon={<DownloadOutlined />}>Export</Button>
                </Dropdown>
                <Link href="/receipts/new">
                  <Button type="primary" icon={<PlusOutlined />}>Add Receipt</Button>
                </Link>
              </Space>
            </Col>
          </Row>
        </Col>

        {showFilters && (
          <Col span={24}>
            <Card className={style.filters} styles={{ body: { padding: 12 } }}>
              <Row gutter={[12, 12]}>
                <Col span={8}><Input placeholder="Search merchant, category, method" value={search} onChange={(e) => setSearch(e.target.value)} allowClear /></Col>
                <Col span={8}><Select placeholder="Category" value={category} onChange={setCategory} options={categories.map(c => ({ value: c, label: c }))} allowClear style={{ width: '100%' }} /></Col>
                <Col span={4}><Select placeholder="Method" value={method} onChange={setMethod} options={methods.map(m => ({ value: m, label: m }))} allowClear style={{ width: '100%' }} /></Col>
                <Col span={4}><DatePicker.RangePicker onChange={(v) => setRange([v?.[0]?.toISOString() || null, v?.[1]?.toISOString() || null])} style={{ width: '100%' }} /></Col>
              </Row>
            </Card>
          </Col>
        )}

        {showFilters && (
          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card><Statistic title="Total" value={total} precision={2} prefix="$" /></Card>
              </Col>
              <Col span={6}>
                <Card><Statistic title="Transactions" value={data.length} /></Card>
              </Col>
              <Col span={6}>
                <Card><Statistic title="Avg / Transaction" value={data.length ? total / data.length : 0} precision={2} prefix="$" /></Card>
              </Col>
              <Col span={6}>
                <Card><Statistic title="Top Category" value={data.reduce((m: Record<string, number>, e) => (m[e.category] = (m[e.category] || 0) + e.amount, m), {} as Record<string, number>) && Object.entries(data.reduce((m: Record<string, number>, e) => (m[e.category] = (m[e.category] || 0) + e.amount, m), {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'} /></Card>
              </Col>
            </Row>
          </Col>
        )}

        <Col span={24}>
          <Card styles={{ body: { padding: 0 } }} className={style.tableCard}>
            <Table
              rowKey="id"
              columns={columns as any}
              dataSource={data}
              pagination={{ pageSize: 10 }}
              size="middle"
            />
          </Card>
        </Col>
      </Row>
      {/* Shared add receipt now available at /receipts/new */}
    </div>
  );
}


