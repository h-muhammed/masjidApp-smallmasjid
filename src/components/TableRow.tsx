import { useDeleteUser, useEditUser } from "@/api/areaApi";
import { UserType } from "@/types/types";
import { useRouter } from "next/router";
import { createPortal } from "react-dom";

import React, { useState, useEffect } from "react";

interface Props {
  user: UserType;
}

const TableRow = ({ user }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(user);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const router = useRouter();

  // Update editFormData when user prop changes
  useEffect(() => {
    setEditFormData(user);
  }, [user]);

  const editUserMutation = useEditUser(
    () => {
      setIsEditing(false);
      // Reset form data to updated user data
      setEditFormData(user);
    },
    (error) => {
      console.error("Failed to update user:", error);
      alert("Failed to update user. Please try again.");
    }
  );
  const deleteUserMutation = useDeleteUser(
    () => alert("User deleted"),
    (error) => {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user. Please try again.");
    }
  );

  const handleEdit = () => setIsEditing(true);

  const handleSave = () => {
    // Filter out fields that shouldn't be updated (uid, areaId, areaCode)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { uid, areaId, areaCode, ...updatableFields } = editFormData;
    editUserMutation.mutate({ 
      userId: user.uid, 
      updatedData: updatableFields,
      currentAreaCode: user.areaCode || user.areaId // Pass current areaCode for query invalidation
    });
  };

  const handleDelete = () => {
    deleteUserMutation.mutate({
      userId: user.uid,
      currentAreaCode: user.areaCode || user.areaId,
    });
    setIsDeleteModalOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <tr>
        {isEditing ? (
          <>
            <td>
              <input
                type="text"
                name="refNo"
                value={editFormData.refNo}
                onChange={handleChange}
                className="input input-bordered w-14"
              />
            </td>
            <td>
              <input
                type="text"
                name="name"
                value={editFormData.name}
                onChange={handleChange}
                className="input input-bordered"
              />
            </td>
            <td>
              <input
                type="text"
                name="NIC"
                value={editFormData.NIC}
                onChange={handleChange}
                className="input input-bordered"
              />
            </td>
            <td>
              <input
                type="text"
                name="contactNo"
                value={editFormData.contactNo}
                onChange={handleChange}
                className="input input-bordered"
              />
            </td>
            <td>
              <input
                type="text"
                name="subscription"
                value={editFormData.subscription}
                onChange={handleChange}
                className="input input-bordered w-28"
              />
            </td>
            <td>
              <input
                type="text"
                name="address"
                value={editFormData.address}
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
            <td>{user.refNo}</td>
            <td
              onClick={() => router.push(`/user/${user?.uid}`)}
              className="cursor-pointer hover:font-bold hover:underline hover:underline-offset-2"
            >
              {user.name}
            </td>
            <td>{user.NIC}</td>
            <td>{user.contactNo}</td>
            <td>{user.subscription}</td>
            <td>{user.address}</td>
            <td className="flex items-center space-x-2">
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
      </tr>

      {/* Delete Confirmation Modal - Rendered outside table using Portal */}
      {isDeleteModalOpen &&
        typeof window !== "undefined" &&
        createPortal(
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
          </div>,
          document.body
        )}
    </>
  );
};

export default TableRow;
