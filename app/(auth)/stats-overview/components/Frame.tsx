'use client';
import React, { useState } from "react";
import { Col, Row } from "antd";
import DropdownFilter from "./DropdownFilter";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";

const timeframeOptions = [
  { key: "last7", label: "Last 7 Days" },
  { key: "season", label: "Season" },
  { key: "custom", label: "Custom" },
];
const eventsOptions = [
  { key: "all", label: "All" },
  { key: "games", label: "Games" },
  { key: "practices", label: "Practices" },
];
const playersOptions = [
  { key: "all", label: "All" },
  { key: "starters", label: "Starters" },
  { key: "bench", label: "Bench" },
];

interface FrameProps {
  timeframe: string;
  setTimeframe: React.Dispatch<React.SetStateAction<string>>;
  events: string;
  setEvents: React.Dispatch<React.SetStateAction<string>>;
  players: string;
  setPlayers: React.Dispatch<React.SetStateAction<string>>;
  showCustomDateRange?: boolean;
  customDateRange?: [Dayjs | null, Dayjs | null];
  setCustomDateRange?: (dates: [Dayjs | null, Dayjs | null]) => void;
}

export const Frame = ({ timeframe, setTimeframe, events, setEvents, players, setPlayers, showCustomDateRange, customDateRange, setCustomDateRange }: FrameProps) => {
  return (
    <Row gutter={9} align="middle" style={{ width: 592, position: 'relative' }}>
      <Col style={{ position: 'relative' }}>
        <DropdownFilter
          label="Timeframe:"
          value={timeframe}
          options={timeframeOptions}
          onSelect={key => setTimeframe(timeframeOptions.find(opt => opt.key === key)?.label || "Custom")}
        />
        {showCustomDateRange && setCustomDateRange && (
          <div style={{ marginTop: 8, position: 'absolute', left: 0, width: '100%', zIndex: 10 }}>
            <DatePicker.RangePicker
              value={customDateRange}
              onChange={dates => setCustomDateRange(dates as [Dayjs | null, Dayjs | null])}
              allowClear
              style={{ background: "#23272f", color: "#fff", width: '100%' }}
              format="YYYY-MM-DD"
              getPopupContainer={trigger => trigger.parentElement}
            />
          </div>
        )}
      </Col>
      <Col>
        <DropdownFilter
          label="Events:"
          value={events}
          options={eventsOptions}
          onSelect={key => setEvents(eventsOptions.find(opt => opt.key === key)?.label || "All")}
        />
      </Col>
      <Col>
        <DropdownFilter
          label="Players:"
          value={players}
          options={playersOptions}
          onSelect={key => setPlayers(playersOptions.find(opt => opt.key === key)?.label || "All")}
        />
      </Col>
    </Row>
  );
};

export default Frame; 