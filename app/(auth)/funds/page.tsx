'use client';

import React from 'react';
import { Card, Row, Col, Button, Typography, Space, Divider, Progress, Statistic, Tag, Avatar, List, Badge } from 'antd';
import { 
  DollarOutlined, 
  UserOutlined, 
  MailOutlined, 
  MessageOutlined, 
  TrophyOutlined, 
  CreditCardOutlined, 
  ReloadOutlined,
  TeamOutlined,
  HeartOutlined,
  StarOutlined,
  PhoneOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import styles from './style.module.scss';

const { Title, Paragraph, Text } = Typography;

const FundsPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('overview');

  const fundraisingStats = {
    totalRaised: 15420,
    goal: 25000,
    donors: 89,
    campaigns: 4,
    recurringDonors: 12
  };

  const recentDonations = [
    { name: 'Sarah Johnson', amount: 150, date: '2 hours ago', type: 'one-time' },
    { name: 'Mike Chen', amount: 75, date: '4 hours ago', type: 'recurring' },
    { name: 'Anonymous', amount: 200, date: '1 day ago', type: 'one-time' },
    { name: 'Lisa Rodriguez', amount: 50, date: '2 days ago', type: 'recurring' }
  ];

  const teamMembers = [
    { name: 'Alex Thompson', raised: 3200, goal: 5000, avatar: 'AT' },
    { name: 'Jordan Lee', raised: 2800, goal: 5000, avatar: 'JL' },
    { name: 'Casey Williams', raised: 2100, goal: 5000, avatar: 'CW' },
    { name: 'Taylor Brown', raised: 1800, goal: 5000, avatar: 'TB' }
  ];

  const sponsors = [
    { name: 'Local Auto Shop', amount: 2000, tier: 'Gold', status: 'active' },
    { name: 'Community Bank', amount: 1500, tier: 'Silver', status: 'active' },
    { name: 'Sports Equipment Co', amount: 1000, tier: 'Bronze', status: 'pending' }
  ];

  const renderOverview = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Total Raised"
              value={fundraisingStats.totalRaised}
              prefix="$"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Goal Progress"
              value={Math.round((fundraisingStats.totalRaised / fundraisingStats.goal) * 100)}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Total Donors"
              value={fundraisingStats.donors}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Recurring Donors"
              value={fundraisingStats.recurringDonors}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Fundraising Progress" className={styles.progressCard}>
        <Progress 
          percent={Math.round((fundraisingStats.totalRaised / fundraisingStats.goal) * 100)} 
          strokeColor="#52c41a"
          format={() => `$${fundraisingStats.totalRaised.toLocaleString()} / $${fundraisingStats.goal.toLocaleString()}`}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Donations" className={styles.recentCard}>
            <List
              dataSource={recentDonations}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<HeartOutlined />} style={{ backgroundColor: item.type === 'recurring' ? '#fa8c16' : '#52c41a' }} />}
                    title={item.name}
                    description={`$${item.amount} • ${item.date}`}
                  />
                  <Tag color={item.type === 'recurring' ? 'orange' : 'green'}>
                    {item.type === 'recurring' ? 'Monthly' : 'One-time'}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Team Fundraising" className={styles.teamCard}>
            <List
              dataSource={teamMembers}
              renderItem={(member) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar>{member.avatar}</Avatar>}
                    title={member.name}
                    description={`$${member.raised.toLocaleString()} raised`}
                  />
                  <div>
                    <Progress 
                      percent={Math.round((member.raised / member.goal) * 100)} 
                      size="small"
                      strokeColor="#1890ff"
                    />
                    <Text type="secondary">Goal: ${member.goal.toLocaleString()}</Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderDonationForm = () => (
    <div>
      <Card title="Create Donation Form" className={styles.formCard}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Form Builder" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Campaign Title</Text>
                  <input 
                    type="text" 
                    placeholder="Enter your campaign title"
                    className={styles.formInput}
                  />
                </div>
                <div>
                  <Text strong>Story/Description</Text>
                  <textarea 
                    placeholder="Tell your unique story and encourage donations..."
                    className={styles.formTextarea}
                    rows={4}
                  />
                </div>
                <div>
                  <Text strong>Goal Amount</Text>
                  <input 
                    type="number" 
                    placeholder="Enter your fundraising goal"
                    className={styles.formInput}
                  />
                </div>
                <div>
                  <Text strong>Campaign Image</Text>
                  <input 
                    type="file" 
                    accept="image/*"
                    className={styles.formInput}
                  />
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Form Preview" size="small">
              <div className={styles.formPreview}>
                <div className={styles.previewHeader}>
                  <Title level={4}>Sample Campaign</Title>
                  <Progress percent={65} strokeColor="#52c41a" />
                  <Text>$15,420 raised of $25,000 goal</Text>
                </div>
                <Paragraph>
                  Help us reach our goal! Your support makes a difference in our team's success...
                </Paragraph>
                <Button type="primary" size="large" block>
                  Donate Now
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );

  const renderPeerToPeer = () => (
    <div>
      <Card title="Peer-to-Peer Fundraising" className={styles.peerCard}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Team Member Pages" size="small">
              <List
                dataSource={teamMembers}
                renderItem={(member) => (
                  <List.Item
                    actions={[
                      <Button type="link" key="view">View Page</Button>,
                      <Button type="link" key="edit">Edit</Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar>{member.avatar}</Avatar>}
                      title={member.name}
                      description={`$${member.raised.toLocaleString()} raised`}
                    />
                    <Progress 
                      percent={Math.round((member.raised / member.goal) * 100)} 
                      size="small"
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Create Personal Page" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Player Name</Text>
                  <input 
                    type="text" 
                    placeholder="Enter player name"
                    className={styles.formInput}
                  />
                </div>
                <div>
                  <Text strong>Personal Message</Text>
                  <textarea 
                    placeholder="Write a personal message for your fundraising page..."
                    className={styles.formTextarea}
                    rows={3}
                  />
                </div>
                <div>
                  <Text strong>Individual Goal</Text>
                  <input 
                    type="number" 
                    placeholder="Enter personal fundraising goal"
                    className={styles.formInput}
                  />
                </div>
                <Button type="primary" block>
                  Create Personal Page
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );

  const renderCommunications = () => (
    <div>
      <Card title="Automated Communications" className={styles.commCard}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Email Campaigns" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Import Contacts</Text>
                  <input 
                    type="file" 
                    accept=".csv,.xlsx"
                    className={styles.formInput}
                  />
                </div>
                <div>
                  <Text strong>Email Template</Text>
                  <textarea 
                    placeholder="Write your email message..."
                    className={styles.formTextarea}
                    rows={4}
                  />
                </div>
                <div>
                  <Text strong>Schedule Send</Text>
                  <input 
                    type="datetime-local"
                    className={styles.formInput}
                  />
                </div>
                <Button type="primary" icon={<MailOutlined />} block>
                  Send Email Campaign
                </Button>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="SMS Campaigns" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>SMS Message</Text>
                  <textarea 
                    placeholder="Write your SMS message (160 characters max)..."
                    className={styles.formTextarea}
                    rows={3}
                    maxLength={160}
                  />
                </div>
                <div>
                  <Text strong>Phone Numbers</Text>
                  <textarea 
                    placeholder="Enter phone numbers (one per line)"
                    className={styles.formTextarea}
                    rows={3}
                  />
                </div>
                <div>
                  <Text strong>Send Time</Text>
                  <input 
                    type="datetime-local"
                    className={styles.formInput}
                  />
                </div>
                <Button type="primary" icon={<MessageOutlined />} block>
                  Send SMS Campaign
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );

  const renderSponsors = () => (
    <div>
      <Card title="Sponsor Management" className={styles.sponsorCard}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Current Sponsors" size="small">
              <List
                dataSource={sponsors}
                renderItem={(sponsor) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<TrophyOutlined />} style={{ backgroundColor: sponsor.tier === 'Gold' ? '#faad14' : sponsor.tier === 'Silver' ? '#bfbfbf' : '#d48806' }} />}
                      title={sponsor.name}
                      description={`$${sponsor.amount.toLocaleString()} • ${sponsor.tier} Tier`}
                    />
                    <Badge 
                      status={sponsor.status === 'active' ? 'success' : 'processing'} 
                      text={sponsor.status}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Add New Sponsor" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Sponsor Name</Text>
                  <input 
                    type="text" 
                    placeholder="Enter sponsor name"
                    className={styles.formInput}
                  />
                </div>
                <div>
                  <Text strong>Sponsorship Amount</Text>
                  <input 
                    type="number" 
                    placeholder="Enter sponsorship amount"
                    className={styles.formInput}
                  />
                </div>
                <div>
                  <Text strong>Sponsorship Tier</Text>
                  <select className={styles.formInput}>
                    <option value="">Select tier</option>
                    <option value="gold">Gold ($2000+)</option>
                    <option value="silver">Silver ($1000-1999)</option>
                    <option value="bronze">Bronze ($500-999)</option>
                  </select>
                </div>
                <div>
                  <Text strong>Contact Information</Text>
                  <input 
                    type="email" 
                    placeholder="Sponsor email"
                    className={styles.formInput}
                  />
                </div>
                <Button type="primary" block>
                  Add Sponsor
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );

  const renderPayments = () => (
    <div>
      <Card title="Payment Management" className={styles.paymentCard}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="One-Time Payments" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Payment Type</Text>
                  <select className={styles.formInput}>
                    <option value="">Select payment type</option>
                    <option value="registration">Registration Fee</option>
                    <option value="travel">Travel Expenses</option>
                    <option value="equipment">Equipment</option>
                    <option value="uniforms">Uniforms</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Text strong>Amount</Text>
                  <input 
                    type="number" 
                    placeholder="Enter amount"
                    className={styles.formInput}
                  />
                </div>
                <div>
                  <Text strong>Due Date</Text>
                  <input 
                    type="date"
                    className={styles.formInput}
                  />
                </div>
                <div>
                  <Text strong>Parent Email</Text>
                  <input 
                    type="email" 
                    placeholder="Enter parent email"
                    className={styles.formInput}
                  />
                </div>
                <Button type="primary" icon={<CreditCardOutlined />} block>
                  Send Payment Request
                </Button>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Recurring Donations" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Monthly Amount</Text>
                  <input 
                    type="number" 
                    placeholder="Enter monthly donation amount"
                    className={styles.formInput}
                  />
                </div>
                <div>
                  <Text strong>Donor Name</Text>
                  <input 
                    type="text" 
                    placeholder="Enter donor name"
                    className={styles.formInput}
                  />
                </div>
                <div>
                  <Text strong>Donor Email</Text>
                  <input 
                    type="email" 
                    placeholder="Enter donor email"
                    className={styles.formInput}
                  />
                </div>
                <div>
                  <Text strong>Payment Method</Text>
                  <select className={styles.formInput}>
                    <option value="">Select payment method</option>
                    <option value="credit">Credit Card</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
                <Button type="primary" icon={<ReloadOutlined />} block>
                  Set Up Recurring Donation
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <DollarOutlined /> },
    { key: 'donation-form', label: 'Donation Forms', icon: <GlobalOutlined /> },
    { key: 'peer-to-peer', label: 'Peer-to-Peer', icon: <TeamOutlined /> },
    { key: 'communications', label: 'Communications', icon: <MailOutlined /> },
    { key: 'sponsors', label: 'Sponsors', icon: <TrophyOutlined /> },
    { key: 'payments', label: 'Payments', icon: <CreditCardOutlined /> },
    { key: 'budgets', label: 'Budgets', icon: <CreditCardOutlined /> },
    { key: 'expenses', label: 'Expenses', icon: <CreditCardOutlined /> },
  ];

  const renderComingSoon = (title: string) => (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <CreditCardOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }} />
      <Title level={2}>{title} - Coming Soon</Title>
      <Paragraph>We're working hard to bring you this feature. Stay tuned!</Paragraph>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'donation-form':
        return renderDonationForm();
      case 'peer-to-peer':
        return renderPeerToPeer();
      case 'communications':
        return renderCommunications();
      case 'sponsors':
        return renderSponsors();
      case 'payments':
        return renderPayments();
      case 'budgets':
        return renderComingSoon('Budgets');
      case 'expenses':
        return renderComingSoon('Expenses');
      default:
        return renderOverview();
    }
  };

  return (
    <div className={styles.fundsContainer}>
      <div className={styles.header}>
        <Title level={2}>Fundraising Dashboard</Title>
        <Paragraph>
          Manage all your fundraising activities in one place. Create campaigns, track donations, and engage with your community.
        </Paragraph>
      </div>

      <div className={styles.tabContainer}>
        {tabs.map(tab => (
          <Button
            key={tab.key}
            type={activeTab === tab.key ? 'primary' : 'default'}
            icon={tab.icon}
            onClick={() => setActiveTab(tab.key)}
            className={styles.tabButton}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
};

export default FundsPage; 