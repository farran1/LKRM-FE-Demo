'use client';

import { Button, Col, Flex, Modal, Row, Skeleton, Tooltip } from 'antd';
import { memo, useEffect, useState } from 'react';
import CloseIcon from '@/components/icon/close.svg';
import CalendarIcon from '@/components/icon/calendar.svg';
import MapIcon from '@/components/icon/map-pin.svg';
import UserIcon from '@/components/icon/users-round.svg';
import api from '@/services/api';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { EditFilled, CloseOutlined } from '@ant-design/icons';

interface EventDetailModalProps {
  isShowModal: boolean;
  onClose: () => void;
  event: any;
  openEdit?: () => void;
}

function EventDetailModal({ isShowModal, onClose, event, openEdit }: EventDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [players, setPlayers] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!event) {
      return;
    }
    fetchPlayer();
  }, [event]);

  const fetchPlayer = async () => {
    setPlayerLoading(true);
    try {
      const res = await api.get(`/api/events/${event.id}/players`);
      setPlayers(res.data.data);
    } catch (error) {
      console.error('Error fetching players:', error);
      setPlayers([]);
    }
    setPlayerLoading(false);
  };

  const openEventLanding = () => {
    router.push('/events/' + event.id);
  };

  return (
    <Modal
      closeIcon={<CloseOutlined style={{ color: '#fff', fontSize: 22 }} />}
      open={isShowModal}
      footer={null}
      destroyOnHidden
      maskClosable={true}
      onCancel={onClose}
      width={900}
      styles={{
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        },
        content: {
          backgroundColor: '#073853',
          borderRadius: '12px',
          color: '#ffffff'
        },
        body: {
          fontSize: '12px',
          padding: '24px'
        }
      }}
    >
      {loading && <Skeleton active />}
      {!loading && (
        <>
          <Flex 
            justify="space-between" 
            align="flex-start" 
            style={{ marginBottom: 16 }}
          >
            <Flex gap={8} align="center">
              <div style={{ 
                fontWeight: 600, 
                fontSize: '20px',
                color: '#ffffff'
              }}>
                {event?.name}
              </div>
              {openEdit && (
                <Tooltip title="Edit Event">
                  <EditFilled 
                    style={{ 
                      fontSize: '20px',
                      cursor: 'pointer',
                      color: '#ffffff'
                    }}
                    onClick={openEdit}
                  />
                </Tooltip>
              )}
            </Flex>
          </Flex>
          <Row gutter={24}>
            {/* Left Column */}
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ 
                  fontWeight: 600, 
                  marginBottom: '10px',
                  color: '#ffffff'
                }}>
                  <span 
                    style={{ 
                      backgroundColor: event?.eventType?.color || '#1D75D0', 
                      color: event?.eventType?.txtColor || '#ffffff',
                      padding: '1px 1px',
                      borderRadius: '3px',
                      fontSize: '12px',
                      marginRight: '8px',
                      fontWeight: 'normal'
                    }}
                  >
                    {event?.eventType?.name || 'Event'}
                  </span>
                  <span>
                    {event?.isRepeat ? 'Weekly' : 'Only'} on {dayjs(event?.startTime).format('dddd')}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '5px',
                  color: '#ffffff'
                }}>
                  <CalendarIcon style={{ marginRight: '4px' }} />
                  <span>{dayjs(event?.startTime).format('MMM D, h:mm A')}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '16px',
                  color: '#ffffff'
                }}>
                  <MapIcon style={{ marginRight: '4px' }} />
                  <span>{event?.venue}</span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <Flex 
                    justify="space-between" 
                    align="center" 
                    style={{ marginBottom: '12px' }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      fontSize: '14px',
                      color: '#1D75D0'
                    }}>
                      <UserIcon style={{ marginRight: '10px' }} />
                      <span>{players.length} Players</span>
                    </div>
                    {players.length > 0 && (
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        0 yes, 0 no, {players.length} awaiting
                      </div>
                    )}
                  </Flex>
                  {playerLoading && <Skeleton active />}
                  {players.map((item: any) => (
                    <Row key={item.id} style={{ color: '#ffffff', marginBottom: '4px' }}>
                      <Col span={8}>👤 {item.name}</Col>
                      <Col span={6}>Going</Col>
                      <Col span={10} style={{ textAlign: 'right' }}>
                        {item.position?.name}
                      </Col>
                    </Row>
                  ))}
                </div>
              </div>
            </Col>
            {/* Right Column */}
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 600, 
                  marginBottom: '12px',
                  color: '#ffffff'
                }}>
                  Budget
                </div>
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                  padding: '8px 12px', 
                  borderRadius: '8px',
                  color: '#ffffff',
                  marginBottom: 16
                }}>
                  Empty
                </div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 600, 
                  marginBottom: '12px',
                  color: '#ffffff'
                }}>
                  Task
                </div>
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                  padding: '8px 12px', 
                  borderRadius: '8px',
                  color: '#ffffff',
                  marginBottom: 16
                }}>
                  Empty
                </div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 600, 
                  marginBottom: '12px',
                  color: '#ffffff'
                }}>
                  Expenses
                </div>
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                  padding: '8px 12px', 
                  borderRadius: '8px',
                  color: '#ffffff',
                  marginBottom: 32
                }}>
                  Empty
                </div>
              </div>
            </Col>
          </Row>
          <Button 
            type="primary" 
            block 
            onClick={openEventLanding}
            style={{
              backgroundColor: '#1D75D0',
              borderColor: '#1D75D0',
              height: '40px',
              fontWeight: 600,
              marginTop: 8
            }}
          >
            View Full Screen
          </Button>
        </>
      )}
    </Modal>
  );
}

export default memo(EventDetailModal); 