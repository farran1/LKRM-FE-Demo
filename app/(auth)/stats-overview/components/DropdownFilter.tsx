import React from "react";
import { DownOutlined } from "@ant-design/icons";
import { Dropdown, Menu } from "antd";

interface DropdownFilterProps {
  label: string;
  value: string;
  options: { key: string; label: string }[];
  onSelect?: (key: string) => void;
}

const DropdownFilter: React.FC<DropdownFilterProps> = ({ label, value, options, onSelect }) => {
  const menu = {
    items: options.map(opt => ({
      key: opt.key,
      label: opt.label,
      onClick: () => onSelect && onSelect(opt.key),
    })),
  };

  return (
    <Dropdown menu={menu} trigger={["click"]}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          background: "#ffffff1a",
          borderRadius: 7,
          minWidth: 170,
          minHeight: 48,
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", borderRadius: 20 }}>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#ffffffb2" }}>{label} </span>
            <span style={{ color: "white" }}>{value}</span>
          </p>
        </div>
        <div style={{ width: 23.7, height: 24, position: "relative" }}>
          <DownOutlined
            style={{
              fontSize: 24,
              color: "white",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      </div>
    </Dropdown>
  );
};

export default DropdownFilter; 