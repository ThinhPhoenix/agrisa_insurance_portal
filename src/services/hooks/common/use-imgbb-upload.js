"use client";

import axios from "axios";

/**
 * Hook for uploading images to ImgBB
 * ImgBB provides free image hosting with API access
 */
export function useImgBBUpload() {
  const apiKey = process.env.NEXT_PUBLIC_IMG_API_KEY;

  /**
   * Upload a single image file to ImgBB
   * @param {File} file - The image file to upload
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  const uploadImageToImgBB = async (file) => {
    try {
      // Validation
      if (!file) {
        return {
          success: false,
          error: "Không có file nào được chọn."
        };
      }

      if (!apiKey) {
        console.error("ImgBB API key not found in environment variables");
        return {
          success: false,
          error: "Lỗi cấu hình hệ thống. Vui lòng liên hệ quản trị viên.",
        };
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return {
          success: false,
          error: `Định dạng file không được hỗ trợ. Vui lòng chọn file ảnh (JPG, PNG, GIF, WebP).`,
        };
      }

      // Check file size (ImgBB free tier: 32MB limit)
      const maxSize = 32 * 1024 * 1024; // 32MB in bytes
      if (file.size > maxSize) {
        return {
          success: false,
          error: `Kích thước file quá lớn. Vui lòng chọn ảnh nhỏ hơn 32MB. (File hiện tại: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        };
      }

      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append("image", file);

      // Upload to ImgBB API
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${apiKey}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      if (response.data.success && response.data.data?.url) {
        return {
          success: true,
          url: response.data.data.url,
          data: response.data.data, // Full response data if needed
        };
      } else {
        throw new Error("Invalid response from ImgBB API");
      }
    } catch (error) {
      console.error("Error uploading image to ImgBB:", error);

      // Handle specific error cases with Vietnamese messages

      // Timeout error
      if (error.code === "ECONNABORTED") {
        return {
          success: false,
          error: "Tải ảnh lên bị quá thời gian. Vui lòng kiểm tra kết nối mạng và thử lại.",
        };
      }

      // Network error (no response from server)
      if (error.code === "ERR_NETWORK" || !error.response) {
        return {
          success: false,
          error: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.",
        };
      }

      // HTTP status errors
      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;

        switch (status) {
          case 400:
            // Bad request - usually invalid file or parameters
            if (responseData?.error?.message) {
              // Try to translate common ImgBB error messages
              const msg = responseData.error.message.toLowerCase();
              if (msg.includes("invalid") && msg.includes("image")) {
                return {
                  success: false,
                  error: "File ảnh không hợp lệ. Vui lòng chọn file ảnh khác.",
                };
              }
              if (msg.includes("file size")) {
                return {
                  success: false,
                  error: "Kích thước file vượt quá giới hạn cho phép.",
                };
              }
            }
            return {
              success: false,
              error: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại file ảnh.",
            };

          case 403:
            return {
              success: false,
              error: "Không có quyền truy cập. Vui lòng liên hệ quản trị viên.",
            };

          case 429:
            return {
              success: false,
              error: "Đã vượt quá giới hạn số lần tải ảnh. Vui lòng thử lại sau ít phút.",
            };

          case 500:
          case 502:
          case 503:
            return {
              success: false,
              error: "Lỗi máy chủ ImgBB. Vui lòng thử lại sau.",
            };

          default:
            return {
              success: false,
              error: `Lỗi không xác định (Mã lỗi: ${status}). Vui lòng thử lại.`,
            };
        }
      }

      // Generic error fallback
      return {
        success: false,
        error: "Không thể tải ảnh lên. Vui lòng thử lại sau.",
      };
    }
  };

  /**
   * Upload multiple images to ImgBB
   * @param {File[]} files - Array of image files to upload
   * @returns {Promise<{success: boolean, urls?: string[], errors?: string[]}>}
   */
  const uploadMultipleImages = async (files) => {
    try {
      const uploadPromises = files.map((file) => uploadImageToImgBB(file));
      const results = await Promise.all(uploadPromises);

      const urls = [];
      const errors = [];

      results.forEach((result, index) => {
        if (result.success) {
          urls.push(result.url);
        } else {
          errors.push(`File ${index + 1}: ${result.error}`);
        }
      });

      return {
        success: errors.length === 0,
        urls,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error("Error uploading multiple images:", error);
      return {
        success: false,
        errors: [error.message || "Failed to upload images"],
      };
    }
  };

  return {
    uploadImageToImgBB,
    uploadMultipleImages,
  };
}
