import { Card, Col, Image, Pagination, Row, Space, Tag, Typography } from "antd";
import { useState } from "react";

const { Text } = Typography;

const formatUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `https://${url}`;
};

const QUALITY_LABELS = {
  excellent: "Xuất sắc",
  good: "Tốt",
  fair: "Trung bình",
  poor: "Kém",
};

export default function ImagesTab({ farm }) {
  const [currentPhotoPage, setCurrentPhotoPage] = useState(1);
  const photosPerPage = 12;

  // Pagination logic
  const indexOfLastPhoto = currentPhotoPage * photosPerPage;
  const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
  const currentPhotos =
    farm?.farm_photos?.slice(indexOfFirstPhoto, indexOfLastPhoto) || [];

  const handlePageChange = (page) => {
    setCurrentPhotoPage(page);
  };

  return (
    <Space direction="vertical" size="large" className="w-full">
      <Card title="Giấy chứng nhận quyền sử dụng đất">
        {farm?.land_certificate_url ? (
          <Image.PreviewGroup>
            <Row gutter={[16, 16]}>
              {farm.land_certificate_url.split("|").map((url, index) => (
                <Col xs={12} sm={8} md={6} lg={4} key={`cert-${index}`}>
                  <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <Image
                      width="100%"
                      height={150}
                      src={formatUrl(url)}
                      alt={`Giấy chứng nhận ${index + 1}`}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </Image.PreviewGroup>
        ) : (
          <Text type="secondary">Không có giấy chứng nhận</Text>
        )}
      </Card>

      <Card
        title={`Ảnh vệ tinh & thực địa (${
          farm?.farm_photos?.length || 0
        } ảnh)`}
      >
        {farm?.farm_photos && farm.farm_photos.length > 0 ? (
          <>
            <Image.PreviewGroup>
              <Row gutter={[16, 16]}>
                {currentPhotos.map((photo, index) => (
                  <Col xs={12} sm={8} md={6} lg={4} key={photo.id || index}>
                    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                      <div className="relative pt-[75%]">
                        <div className="absolute inset-0">
                          <Image
                            width="100%"
                            height="100%"
                            src={formatUrl(photo.photo_url)}
                            alt={`Ảnh ${photo.photo_type}`}
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                      </div>
                      <div className="p-2 bg-gray-50 border-t border-gray-100">
                        <Tag
                          color={
                            photo.photo_type === "satellite"
                              ? "blue"
                              : "green"
                          }
                          className="mb-1"
                        >
                          {photo.photo_type === "satellite"
                            ? "Vệ tinh"
                            : "Thực địa"}
                        </Tag>
                        {photo.quality_score && (
                          <Tag
                            color={
                              photo.quality_score >= 0.8
                                ? "green"
                                : photo.quality_score >= 0.6
                                ? "gold"
                                : "orange"
                            }
                          >
                            {QUALITY_LABELS[
                              photo.quality_score >= 0.8
                                ? "excellent"
                                : photo.quality_score >= 0.6
                                ? "good"
                                : photo.quality_score >= 0.4
                                ? "fair"
                                : "poor"
                            ] || "N/A"}
                          </Tag>
                        )}
                        {photo.captured_at && (
                          <Text
                            type="secondary"
                            className="text-xs block mt-1"
                          >
                            {new Date(
                              photo.captured_at
                            ).toLocaleDateString("vi-VN")}
                          </Text>
                        )}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Image.PreviewGroup>

            {farm.farm_photos.length > photosPerPage && (
              <div className="mt-4 flex justify-center">
                <Pagination
                  current={currentPhotoPage}
                  total={farm.farm_photos.length}
                  pageSize={photosPerPage}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} của ${total} ảnh`
                  }
                />
              </div>
            )}
          </>
        ) : (
          <Text type="secondary">Không có ảnh vệ tinh hoặc thực địa</Text>
        )}
      </Card>
    </Space>
  );
}
