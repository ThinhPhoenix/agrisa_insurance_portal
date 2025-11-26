"use client";
import { Layout, Spin } from "antd";
import { Leaf, Sprout, TreePine } from "lucide-react";
import { useEffect, useState } from "react";

const AuthLoading = () => {
  const [iconIndex, setIconIndex] = useState(0);
  const icons = [
    <Sprout key="sprout" size={48} className="text-green-500" />,
    <Leaf key="leaf" size={48} className="text-green-600" />,
    <TreePine key="tree" size={48} className="text-green-700" />,
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % icons.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout.Content className="insurance-content">
      <div className="insurance-space">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="mb-6 animate-bounce">
            {icons[iconIndex]}
          </div>
          <Spin size="large" />
          <div className="mt-4 text-gray-600 text-base">
            Đang xác thực...
          </div>
          <div className="mt-2 text-gray-400 text-sm">
            Vui lòng đợi trong giây lát
          </div>
        </div>
      </div>
    </Layout.Content>
  );
};

export default AuthLoading;
