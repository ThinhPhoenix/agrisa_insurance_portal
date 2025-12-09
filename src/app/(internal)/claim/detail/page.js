"use client";

import ClaimDetailsCards from "@/components/layout/claim/detail/ClaimDetailsCards";
import ClaimHeader from "@/components/layout/claim/detail/ClaimHeader";
import ClaimModals from "@/components/layout/claim/detail/ClaimModals";
import ClaimStatusSection from "@/components/layout/claim/detail/ClaimStatusSection";
import PayoutQRModal from "@/components/payout-qr-modal";
import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import useClaim from "@/services/hooks/claim/use-claim";
import usePayout from "@/services/hooks/payout/use-payout";
import {
  getClaimErrorMessage,
  CLAIM_SUCCESS_MESSAGES,
} from "@/utils/claim-messages";
import { Form, Layout, message, Row, Spin, Typography } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import "../../policy/policy.css";

const { Text } = Typography;

export default function ClaimDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimId = searchParams.get("id");
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const {
    claimDetail,
    claimDetailLoading,
    claimDetailError,
    fetchClaimDetail,
    validateClaim,
    createClaimRejection,
    fetchRejectionByClaim,
  } = useClaim();

  const { payoutsByPolicy, payoutsByPolicyLoading, fetchPayoutsByPolicy } =
    usePayout();

  // States for related data
  const [policy, setPolicy] = useState(null);
  const [farm, setFarm] = useState(null);
  const [basePolicy, setBasePolicy] = useState(null);
  const [allDataLoaded, setAllDataLoaded] = useState(false);

  // Rejection state
  const [rejection, setRejection] = useState(null);
  const [rejectionLoading, setRejectionLoading] = useState(false);

  // Modal states
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Payment modal states
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [qrData, setQrData] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!claimId) return;

      try {
        await fetchClaimDetail(claimId);
      } catch (error) {
        console.error("Error fetching claim detail:", error);
      }
    };

    fetchAllData();
  }, [claimId, fetchClaimDetail]);

  // Fetch related data when claimDetail is loaded
  useEffect(() => {
    const fetchRelatedData = async () => {
      if (!claimDetail) return;

      setAllDataLoaded(false);

      try {
        const promises = [];

        // Fetch policy detail
        if (claimDetail.registered_policy_id) {
          promises.push(
            axiosInstance
              .get(
                endpoints.policy.policy.detail(claimDetail.registered_policy_id)
              )
              .then((response) => {
                if (response.data.success) {
                  setPolicy(response.data.data);
                  return response.data.data;
                }
                return null;
              })
              .catch((error) => {
                console.error("Error fetching policy:", error);
                return null;
              })
          );
        }

        // Fetch farm detail
        if (claimDetail.farm_id) {
          promises.push(
            axiosInstance
              .get(endpoints.applications.detail(claimDetail.farm_id))
              .then((response) => {
                if (response.data.success) {
                  setFarm(response.data.data);
                }
                return null;
              })
              .catch((error) => {
                console.error("Error fetching farm:", error);
                return null;
              })
          );
        }

        const results = await Promise.all(promises);
        const policyData = results[0];

        // Fetch base policy detail after we have policy data
        if (claimDetail.base_policy_id && policyData?.insurance_provider_id) {
          try {
            const basePolicyUrl = endpoints.policy.base_policy.get_detail(
              claimDetail.base_policy_id,
              {
                provider_id: policyData.insurance_provider_id,
              }
            );
            const basePolicyResponse = await axiosInstance.get(basePolicyUrl);
            if (basePolicyResponse.data.success) {
              setBasePolicy(basePolicyResponse.data.data.base_policy);
            }
          } catch (error) {
            console.error("Error fetching base policy:", error);
          }
        }

        // Fetch rejection if status is rejected
        if (claimDetail.status === "rejected") {
          setRejectionLoading(true);
          try {
            const rejectionResult = await fetchRejectionByClaim(claimDetail.id);
            if (rejectionResult.success) {
              setRejection(rejectionResult.data);
            }
          } catch (error) {
            console.error("Error fetching rejection:", error);
          } finally {
            setRejectionLoading(false);
          }
        }

        // Fetch payouts if status is approved or paid
        if (
          claimDetail.status === "approved" ||
          claimDetail.status === "paid"
        ) {
          if (claimDetail.registered_policy_id) {
            await fetchPayoutsByPolicy(claimDetail.registered_policy_id);
          }
        }
      } finally {
        setAllDataLoaded(true);
      }
    };

    fetchRelatedData();
  }, [claimDetail, fetchRejectionByClaim, fetchPayoutsByPolicy]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Handle approve claim
  const handleApprove = () => {
    setApproveModalVisible(true);
  };

  // Handle reject claim
  const handleReject = () => {
    setRejectModalVisible(true);
  };

  // Submit approve form
  const onApproveSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        registered_policy_id: claimDetail.registered_policy_id,
        status: "approved",
        partner_decision: "approved", // Hard code "approved"
        partner_notes: values.partner_notes,
      };

      const result = await validateClaim(claimDetail.id, payload);

      if (result.success) {
        message.success(CLAIM_SUCCESS_MESSAGES.APPROVE);
        setApproveModalVisible(false);
        approveForm.resetFields();
        await fetchClaimDetail(claimId);
      } else {
        const errorMsg = getClaimErrorMessage(result);
        message.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = getClaimErrorMessage(error);
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit reject form
  const onRejectSubmit = async (values) => {
    setSubmitting(true);
    try {
      let reasonEvidence = {};

      if (values.event_date) {
        reasonEvidence.event_date = values.event_date.format("YYYY-MM-DD");
      }
      if (values.policy_clause)
        reasonEvidence.policy_clause = values.policy_clause;
      if (values.evidence_documents) {
        reasonEvidence.evidence_documents = values.evidence_documents
          .split(",")
          .map((doc) => doc.trim())
          .filter((doc) => doc);
      }
      if (values.blackout_period_start) {
        reasonEvidence.blackout_period_start =
          values.blackout_period_start.format("YYYY-MM-DD");
      }
      if (values.blackout_period_end) {
        reasonEvidence.blackout_period_end =
          values.blackout_period_end.format("YYYY-MM-DD");
      }

      const validatePayload = {
        registered_policy_id: claimDetail.registered_policy_id,
        status: "rejected",
        partner_decision: "rejected", // Hard code "rejected"
        partner_notes: values.validation_notes,
      };

      const rejectionPayload = {
        claim_id: claimDetail.id,
        validation_timestamp: Math.floor(Date.now() / 1000),
        claim_rejection_type: values.claim_rejection_type,
        reason: values.reason,
        validated_by: values.validated_by,
        validation_notes: values.validation_notes,
      };

      if (Object.keys(reasonEvidence).length > 0) {
        rejectionPayload.reason_evidence = reasonEvidence;
      }

      const [validateResult, rejectionResult] = await Promise.all([
        validateClaim(claimDetail.id, validatePayload),
        createClaimRejection(rejectionPayload),
      ]);

      if (validateResult.success && rejectionResult.success) {
        message.success(CLAIM_SUCCESS_MESSAGES.REJECT);
        setRejectModalVisible(false);
        rejectForm.resetFields();
        await fetchClaimDetail(claimId);
      } else if (validateResult.success && !rejectionResult.success) {
        message.warning(
          "Đã cập nhật trạng thái từ chối nhưng chưa lưu chi tiết lý do"
        );
        setRejectModalVisible(false);
        rejectForm.resetFields();
        await fetchClaimDetail(claimId);
      } else if (!validateResult.success && rejectionResult.success) {
        message.warning(
          "Đã lưu chi tiết lý do nhưng chưa cập nhật trạng thái từ chối"
        );
      } else {
        const errorMsg = getClaimErrorMessage(validateResult);
        message.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = getClaimErrorMessage(error);
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle payment initiation
  const handlePayment = async (payout) => {
    setSelectedPayout(payout);
    setPaymentLoading(true);
    setPaymentModalVisible(true);

    try {
      const userId = payout.farmer_id || "test_id";

      // Fetch bank info for the user
      const bankInfoResponse = await axiosInstance.post(
        endpoints.profile.bank_info,
        {
          user_ids: [userId],
        }
      );

      let bankCode = "970423"; // Default bank code
      let accountNumber = "09073016692"; // Default account number

      // Extract bank info from response
      if (bankInfoResponse.data?.success && bankInfoResponse.data?.data?.length > 0) {
        const userBankInfo = bankInfoResponse.data.data[0];
        bankCode = userBankInfo.bank_code || bankCode;
        accountNumber = userBankInfo.account_number || accountNumber;
      }

      // Build payment request with new structure
      const paymentRequest = {
        amount: payout.payout_amount,
        bank_code: bankCode,
        account_number: accountNumber,
        user_id: userId,
        description: "Chi trả bảo hiểm",
        type: "policy_payout_payment",
        items: [
          {
            item_id: payout.registered_policy_id,
            name: `chi tra ${
              policy?.policy_number || claimDetail?.claim_number || ""
            }`,
            price: payout.payout_amount,
          },
        ],
      };

      const response = await axiosInstance.post(
        endpoints.payment.createPayout,
        paymentRequest
      );

      if (response.data.success) {
        const payoutData = response.data.data?.data || response.data.data;
        setQrData(payoutData);
      } else {
        const errorMsg = getClaimErrorMessage(response);
        message.error(errorMsg);
        setPaymentModalVisible(false);
      }
    } catch (error) {
      console.error("Error creating payout:", error);
      const errorMsg = getClaimErrorMessage(error);
      message.error(errorMsg);
      setPaymentModalVisible(false);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle payment verification
  const handleVerifyPayment = async () => {
    if (!qrData || !qrData.verify_hook) {
      message.error("Không tìm thấy thông tin xác thực");
      return;
    }

    setPaymentLoading(true);
    try {
      const response = await axiosInstance.get(qrData.verify_hook);

      if (response.data.success) {
        message.success("Xác nhận thanh toán thành công!");
        setPaymentModalVisible(false);
        setQrData(null);
        setSelectedPayout(null);
        if (claimDetail.registered_policy_id) {
          await fetchPayoutsByPolicy(claimDetail.registered_policy_id);
        }
      } else {
        const errorMsg = getClaimErrorMessage(response);
        message.error(errorMsg);
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      const errorMsg = getClaimErrorMessage(error);
      message.error(errorMsg);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle close payment modal
  const handleClosePaymentModal = () => {
    setPaymentModalVisible(false);
    setQrData(null);
    setSelectedPayout(null);
  };

  if (claimDetailLoading || !allDataLoaded) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Spin size="large" tip="Đang tải thông tin bồi thường..." />
        </div>
      </Layout.Content>
    );
  }

  if (claimDetailError) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Text type="danger">Lỗi: {claimDetailError}</Text>
        </div>
      </Layout.Content>
    );
  }

  if (!claimDetail) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Text type="secondary">Không tìm thấy thông tin bồi thường</Text>
        </div>
      </Layout.Content>
    );
  }

  return (
    <Layout.Content className="insurance-content">
      <div className="insurance-space">
        {/* Header and Summary Cards */}
        <ClaimHeader
          claimDetail={claimDetail}
          onBack={() => router.back()}
          onApprove={handleApprove}
          onReject={handleReject}
          submitting={submitting}
        />

        <Row gutter={[16, 16]}>
          {/* Status Section: Rejection, Payout, Evidence */}
          <ClaimStatusSection
            claimDetail={claimDetail}
            rejection={rejection}
            rejectionLoading={rejectionLoading}
            payoutsByPolicy={payoutsByPolicy}
            payoutsByPolicyLoading={payoutsByPolicyLoading}
            onPayment={handlePayment}
          />

          {/* Details Cards: Policy, Timeline, Partner Review */}
          <ClaimDetailsCards
            claimDetail={claimDetail}
            policy={policy}
            basePolicy={basePolicy}
            farm={farm}
          />
        </Row>
      </div>

      {/* Payment QR Modal */}
      <PayoutQRModal
        visible={paymentModalVisible}
        onCancel={handleClosePaymentModal}
        onVerify={handleVerifyPayment}
        loading={paymentLoading}
        qrData={qrData}
        selectedPayout={selectedPayout}
        claimNumber={claimDetail.claim_number}
        formatCurrency={formatCurrency}
      />

      {/* Modals for Approve/Reject */}
      <ClaimModals
        approveModalVisible={approveModalVisible}
        rejectModalVisible={rejectModalVisible}
        approveForm={approveForm}
        rejectForm={rejectForm}
        submitting={submitting}
        onApproveSubmit={onApproveSubmit}
        onRejectSubmit={onRejectSubmit}
        onApproveCancel={() => {
          setApproveModalVisible(false);
          approveForm.resetFields();
        }}
        onRejectCancel={() => {
          setRejectModalVisible(false);
          rejectForm.resetFields();
        }}
      />
    </Layout.Content>
  );
}
