import React from "react";
import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";

const theme = {
  token: {
    colorPrimary: "#18573f",
    colorBgContainer: "#fefcf5",
    borderRadius: 6,
    fontFamily: "Bricolage Grotesque, sans-serif",
    fontSize: 14,
    lineHeight: 1.5714285714285714,
    margin: 16,
    padding: 16,
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 32,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 32,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 32,
    },
    Table: {
      borderRadius: 6,
    },
    Card: {
      borderRadius: 8,
    },
    Modal: {
      borderRadius: 8,
    },
    Drawer: {
      borderRadius: 8,
    },
  },
};

const AntdConfigProvider = ({ children }) => {
  return (
    <ConfigProvider
      locale={enUS}
      theme={theme}
      componentSize="middle"
      form={{
        validateMessages: {
          required: "${label} is required",
          types: {
            email: "${label} is not a valid email",
            number: "${label} is not a valid number",
          },
          number: {
            range: "${label} must be between ${min} and ${max}",
          },
        },
      }}
      table={{
        size: "middle",
      }}
      modal={{
        centered: true,
      }}
      drawer={{
        placement: "right",
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default AntdConfigProvider;
