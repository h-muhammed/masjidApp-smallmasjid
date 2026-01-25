import { useDeletePayment, useEditPayment } from "@/api/areaApi";
import { PaymentType } from "@/types/types";
import {
  formatLocalDateTime,
  MONTHS,
  PAYMENT_STATUSES,
} from "@/utils/commonUtils";
import React, { useEffect, useState } from "react";
import Select from "react-select";

interface Props {
  payment: PaymentType;
}

const UserPaymentRow = ({ payment }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(payment);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timeout = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [toastMessage]);

  const editUserMutation = useEditPayment(
    () => {
      setIsEditing(false);
      setToastMessage("Payment Updated Successfully!");
    },
    () => alert("Failed to update payment")
  );
  const deleteUserMutation = useDeletePayment(
    () => setToastMessage("Payment Deleted Successfully!"),
    () => setToastMessage("Failed to delete payment")
  );

  const handleEdit = () => setIsEditing(true);

  const handleSave = () => {
    editUserMutation.mutate({
      paymentId: payment.id as string,
      updatedData: editFormData,
    });
  };

  const handleDelete = () => {
    deleteUserMutation.mutate({
      paymentId: payment?.id as string,
      userId: payment?.userId as string,
    });
    setIsDeleteModalOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  return (
    <tr>
      {toastMessage && (
        <div className="toast toast-top toast-end">
          <div
            className={`text-white alert ${
              toastMessage.includes("Successfully")
                ? "alert-success"
                : "alert-error"
            }`}
          >
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      {isEditing ? (
        <>
          <td>
            <input
              type="text"
              name="year"
              value={editFormData.year}
              onChange={handleChange}
              className="input input-bordered w-24"
            />
          </td>
          <td>
            <Select
              isMulti
              options={MONTHS}
              value={MONTHS.filter((month) =>
                editFormData.month.includes(month.value)
              )}
              onChange={(selectedOptions) =>
                setEditFormData({
                  ...editFormData,
                  month: selectedOptions.map((option) => option.value),
                })
              }
              className="w-full"
              menuPlacement="auto"
              menuPortalTarget={document.body}
            />
          </td>
          <td>
            <input
              type="number"
              name="amount"
              value={editFormData.amount}
              onChange={handleChange}
              className="input input-bordered"
            />
          </td>
          <td>
            <Select
              options={PAYMENT_STATUSES}
              value={PAYMENT_STATUSES.filter((status) =>
                editFormData.status.includes(status.value)
              )}
              onChange={(selectedOptions) =>
                setEditFormData({
                  ...editFormData,
                  status: selectedOptions?.value || "",
                })
              }
              className="w-full"
              menuPlacement="auto"
              menuPortalTarget={document.body}
            />
          </td>
          <td>
            <input
              type="datetime-local"
              name="paymentDate"
              value={formatLocalDateTime(editFormData.paidAt.toDate())}
              onChange={handleChange}
              className="input input-bordered"
            />
          </td>
          <td className="flex flex-col gap-2">
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              Save
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </td>
        </>
      ) : (
        <>
          <td>{payment?.year}</td>
          <td>
            {payment?.month?.map((month: string, index: number) => (
              <div key={index}>{month}</div>
            ))}
          </td>
          <td>{payment?.amount}</td>
          <td>{payment.paidAt.toDate().toLocaleString()}</td>
          <td>{payment?.status}</td>

          <td className="table-cell align-middle text-center space-x-2">
            <button
              className="p-2 text-blue-500 hover:text-blue-700"
              onClick={handleEdit}
            >
              Edit
            </button>
            <button
              className="p-2 text-red-500 hover:text-red-700"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete
            </button>
          </td>
        </>
      )}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold text-gray-800">
              Confirm Deletion
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </tr>
  );
};

export default UserPaymentRow;
