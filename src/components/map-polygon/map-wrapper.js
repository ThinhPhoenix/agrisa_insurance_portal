"use client";

import dynamic from "next/dynamic";
import { Spin } from "antd";

// Dynamically import the map component with SSR disabled
const OpenStreetMapWithPolygon = dynamic(
  () => import("./map-component"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          height: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Spin size="large" tip="Đang tải bản đồ..." />
      </div>
    ),
  }
);

export default OpenStreetMapWithPolygon;
