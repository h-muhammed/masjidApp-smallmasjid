import { Timestamp } from "firebase/firestore";
import React, { useEffect, useState, useMemo } from "react";
import Modal from "./Modal";
import { useAddBatchPayments, useGetPaymentsOfArea, useGetUsersByArea } from "@/api/areaApi";
import Select from "react-select";
import { MONTHS, MonthOption, formatLocalDateTime, PAYMENT_STATUSES } from "@/utils/commonUtils";
import { UserType, PaymentType } from "@/types/types";

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  areaCode: string;
}

interface PaymentEntry {
  userId: string;
  amount: number;
  userName?: string;
  userRefNo?: string;
}

const BulkPayment = ({ isModalOpen, onClose, areaCode }: Props) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);
  const [paidAt, setPaidAt] = useState<string>(formatLocalDateTime(new Date()));
  const [status, setStatus] = useState<string>("completed");

  const { data: usersData } = useGetUsersByArea(areaCode);
  const { data: paymentData } = useGetPaymentsOfArea(areaCode);
  const { mutate: addBatchPayments, isPending } = useAddBatchPayments(
    () => {
      setToastMessage("Payments added successfully!");
      setPaymentEntries([]);
      setTimeout(() => {
        onClose();
        setToastMessage(null);
      }, 1500);
    },
    () => {
      setToastMessage("Failed to add payments. Please try again.");
    }
  );

  useEffect(() => {
    if (toastMessage) {
      const timeout = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [toastMessage]);

  // Get non-paid users for selected year and month
  const nonPaidUsers = useMemo(() => {
    if (!usersData || !paymentData || !selectedMonth) return [];

    // Get all user IDs who have paid for the selected year and month
    const paidUserIds = new Set<string>();
    paymentData.forEach((payment: PaymentType) => {
      if (
        payment.year === selectedYear &&
        payment.month.includes(selectedMonth)
      ) {
        paidUserIds.add(payment.userId);
      }
    });

    // Filter out users who have already paid
    return usersData.filter((user: UserType) => !paidUserIds.has(user.uid));
  }, [usersData, paymentData, selectedYear, selectedMonth]);

  // Initialize payment entries when non-paid users change
  useEffect(() => {
    if (nonPaidUsers.length > 0 && paymentEntries.length === 0) {
      setPaymentEntries(
        nonPaidUsers.map((user: UserType) => ({
          userId: user.uid,
          amount: 0,
          userName: user.name,
          userRefNo: user.refNo,
        }))
      );
    }
  }, [nonPaidUsers]);

  const handleCloseModal = () => {
    setPaymentEntries([]);
    setSelectedMonth("");
    setPaidAt(formatLocalDateTime(new Date()));
    setStatus("completed");
    onClose();
  };

  const handleAmountChange = (userId: string, amount: number) => {
    setPaymentEntries((prev) =>
      prev.map((entry) =>
        entry.userId === userId ? { ...entry, amount } : entry
      )
    );
  };

  const handleUserIdChange = (index: number, userId: string) => {
    const user = usersData?.find((u: UserType) => u.uid === userId);
    setPaymentEntries((prev) =>
      prev.map((entry, i) =>
        i === index
          ? {
              ...entry,
              userId,
              userName: user?.name || "",
              userRefNo: user?.refNo || "",
            }
          : entry
      )
    );
  };

  const handleAddEntry = () => {
    setPaymentEntries((prev) => [
      ...prev,
      { userId: "", amount: 0, userName: "", userRefNo: "" },
    ]);
  };

  const handleRemoveEntry = (index: number) => {
    setPaymentEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMonth) {
      setToastMessage("Please select a month");
      return;
    }

    // Filter entries with valid userId and amount > 0
    const validEntries = paymentEntries.filter(
      (entry) => entry.userId && entry.amount > 0
    );

    if (validEntries.length === 0) {
      setToastMessage("Please add at least one payment entry with amount > 0");
      return;
    }

    // Prepare all payments
    const payments: PaymentType[] = validEntries.map((entry) => ({
      userId: entry.userId,
      areaId: areaCode,
      amount: entry.amount,
      month: [selectedMonth],
      year: selectedYear,
      paidAt: Timestamp.fromDate(new Date(paidAt)),
      status: status,
    }));

    // Submit all payments as a batch
    addBatchPayments(payments);
  };

  const availableUsers = usersData || [];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <>
      {toastMessage && (
        <div className="toast toast-top toast-end z-50">
          <div
            className={`text-white alert ${
              toastMessage.includes("successfully")
                ? "alert-success"
                : "alert-error"
            }`}
          >
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Bulk Payment Entry"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Year and Month Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text font-semibold">Year</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setPaymentEntries([]);
                }}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">
                <span className="label-text font-semibold">Month</span>
              </label>
              <Select<MonthOption>
                options={MONTHS}
                placeholder="Select Month"
                classNamePrefix="select"
                value={
                  selectedMonth
                    ? MONTHS.find((m) => m.value === selectedMonth)
                    : null
                }
                onChange={(selected) => {
                  setSelectedMonth(selected?.value || "");
                  setPaymentEntries([]);
                }}
              />
            </div>
          </div>

          {/* Payment Date and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text font-semibold">Payment Date</span>
              </label>
              <input
                type="datetime-local"
                className="input input-bordered w-full"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text font-semibold">Status</span>
              </label>
              <Select
                options={PAYMENT_STATUSES}
                placeholder="Select Status"
                classNamePrefix="react-select"
                value={
                  status
                    ? PAYMENT_STATUSES.find((opt) => opt.value === status)
                    : null
                }
                onChange={(selected) => setStatus(selected?.value || "")}
              />
            </div>
          </div>

          {/* Non-paid users info */}
          {selectedMonth && (
            <div className="alert alert-info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>
                {nonPaidUsers.length} user(s) haven't paid for{" "}
                {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
              </span>
            </div>
          )}

          {/* Payment Entries */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <label className="label py-0">
                <span className="label-text font-semibold">Payment Entries</span>
              </label>
              <button
                type="button"
                onClick={handleAddEntry}
                className="btn btn-sm btn-primary w-full sm:w-auto"
              >
                + Add Entry
              </button>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <div className="space-y-2 min-w-full">
                {paymentEntries.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {selectedMonth
                      ? "No non-paid users found for selected month/year"
                      : "Please select a month to see non-paid users"}
                  </div>
                ) : (
                  paymentEntries.map((entry, index) => (
                    <div
                      key={index}
                      className="card bg-base-200 p-3 border border-gray-300"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:items-end">
                        <div className="md:col-span-2">
                          <label className="label py-1">
                            <span className="label-text text-sm">User ID</span>
                          </label>
                          <Select
                            options={availableUsers.map((user: UserType) => ({
                              value: user.uid,
                              label: `${user.refNo} - ${user.name}`,
                            }))}
                            placeholder="Select User"
                            classNamePrefix="select"
                            value={
                              entry.userId
                                ? {
                                    value: entry.userId,
                                    label: `${entry.userRefNo || ""} - ${
                                      entry.userName || ""
                                    }`,
                                  }
                                : null
                            }
                            onChange={(selected) =>
                              handleUserIdChange(index, selected?.value || "")
                            }
                          />
                        </div>
                        <div>
                          <label className="label py-1">
                            <span className="label-text text-sm">Amount</span>
                          </label>
                          <input
                            type="number"
                            className="input input-bordered w-full"
                            placeholder="Amount"
                            value={entry.amount || ""}
                            onChange={(e) =>
                              handleAmountChange(
                                entry.userId,
                                Number(e.target.value)
                              )
                            }
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="flex justify-end md:justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveEntry(index)}
                            className="btn btn-sm btn-error w-full md:w-auto"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn btn-ghost w-full sm:w-auto"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary w-full sm:w-auto"
              disabled={isPending || paymentEntries.length === 0}
            >
              {isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Processing...
                </>
              ) : (
                `Submit ${paymentEntries.filter((e) => e.userId && e.amount > 0).length} Payment(s)`
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default BulkPayment;

