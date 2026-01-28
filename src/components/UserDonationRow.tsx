import { useDeleteDonation, useEditDonation } from "@/api/areaApi";
import { DonationType } from "@/types/types";
import { getDonationTypeConfig, DONATION_TYPES } from "@/utils/donationTypes";
import React, { useEffect, useState } from "react";
import Select from "react-select";
import { formatLocalDateTime } from "@/utils/commonUtils";
import { Timestamp } from "firebase/firestore";

interface Props {
  donation: DonationType;
}

const UserDonationRow = ({ donation }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(donation);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timeout = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [toastMessage]);

  const editDonationMutation = useEditDonation(
    () => {
      setIsEditing(false);
      setToastMessage("Donation Updated Successfully!");
    },
    () => setToastMessage("Failed to update donation")
  );
  const deleteDonationMutation = useDeleteDonation(
    () => setToastMessage("Donation Deleted Successfully!"),
    () => setToastMessage("Failed to delete donation")
  );

  const handleEdit = () => setIsEditing(true);

  const handleSave = () => {
    editDonationMutation.mutate({
      donationId: donation.id as string,
      updatedData: editFormData,
    });
  };

  const handleDelete = () => {
    deleteDonationMutation.mutate({
      donationId: donation?.id as string,
      userId: donation?.userId as string,
    });
    setIsDeleteModalOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const donationTypeConfig = getDonationTypeConfig(donation.donationType);
  const selectedDonationType = DONATION_TYPES.find(
    (type) => type.value === editFormData.donationType
  );

  return (
    <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
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
          <td className="py-3">
            <Select
              options={DONATION_TYPES}
              value={selectedDonationType || null}
              onChange={(selected) =>
                setEditFormData({
                  ...editFormData,
                  donationType: selected?.value || "",
                })
              }
              className="w-full text-sm"
              menuPlacement="auto"
              menuPortalTarget={document.body}
            />
          </td>
          <td className="py-3">
            <input
              type="datetime-local"
              name="givenAt"
              value={formatLocalDateTime(editFormData.givenAt.toDate())}
              onChange={(e) => {
                const date = new Date(e.target.value);
                setEditFormData({
                  ...editFormData,
                  givenAt: Timestamp.fromDate(date),
                });
              }}
              className="input input-bordered text-sm"
            />
          </td>
          <td className="py-3">
            {donationTypeConfig?.needsAmount && (
              <input
                type="number"
                name="amount"
                value={editFormData.amount || ""}
                onChange={handleChange}
                className="input input-bordered text-sm"
              />
            )}
            {donationTypeConfig?.needsQuantity && (
              <input
                type="number"
                name="quantity"
                value={editFormData.quantity || ""}
                onChange={handleChange}
                className="input input-bordered text-sm"
              />
            )}
          </td>
          <td className="py-3">
            <textarea
              name="description"
              value={editFormData.description || ""}
              onChange={handleChange}
              className="textarea textarea-bordered text-sm"
              rows={2}
            />
          </td>
          <td className="py-3">
            <div className="flex flex-col gap-2">
              <button
                className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </td>
        </>
      ) : (
        <>
          <td className="py-3">
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-md">
              {DONATION_TYPES.find((t) => t.value === donation.donationType)?.label || donation.donationType}
            </span>
          </td>
          <td className="text-sm text-gray-600 py-3 whitespace-nowrap">
            {donation.givenAt.toDate().toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </td>
          <td className="py-3">
            {donationTypeConfig?.needsAmount && donation.amount && (
              <span className="font-semibold text-green-600">
                Rs. {donation.amount.toLocaleString()}
              </span>
            )}
            {donationTypeConfig?.needsQuantity && donation.quantity && (
              <span className="font-semibold text-blue-600">
                {donation.quantity} {donation.quantity === 1 ? "unit" : "units"}
              </span>
            )}
            {!donation.amount && !donation.quantity && (
              <span className="text-gray-400 text-sm">-</span>
            )}
          </td>
          <td className="text-sm text-gray-600 py-3 max-w-xs truncate">
            {donation.description || "-"}
          </td>
          <td className="table-cell align-middle text-center space-x-2 py-3">
            <button
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              onClick={handleEdit}
            >
              Edit
            </button>
            <button
              className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors ml-2"
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
              Are you sure you want to delete this donation? This action cannot be
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

export default UserDonationRow;
