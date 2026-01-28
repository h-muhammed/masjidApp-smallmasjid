import { Timestamp } from "firebase/firestore";
import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { useAddDonation } from "@/api/areaApi";
import Select from "react-select";
import { formatLocalDateTime } from "@/utils/commonUtils";
import { DONATION_TYPES, getDonationTypeConfig } from "@/utils/donationTypes";

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  areaId: string;
  userId: string;
}

interface FormValues {
  donationType: string;
  givenAt: string;
  amount?: number;
  quantity?: number;
  description?: string;
  givenBy?: string;
}

const AddDonation = ({ isModalOpen, onClose, areaId, userId }: Props) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timeout = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [toastMessage]);

  const showSuccessToast = () => setToastMessage("Donation added Successfully!");
  const showErrorToast = () => setToastMessage("Oops, something went wrong!");

  const handleCloseModal = () => {
    formik.resetForm();
    onClose();
  };

  const { mutate: addDonation } = useAddDonation(
    showSuccessToast,
    showErrorToast
  );

  const initialValues: FormValues = {
    donationType: "",
    givenAt: formatLocalDateTime(new Date()),
    amount: undefined,
    quantity: undefined,
    description: "",
    givenBy: "",
  };

  const onSubmit = (values: FormValues) => {
    const donationTypeConfig = getDonationTypeConfig(values.donationType);
    
    // Validate based on donation type requirements
    if (donationTypeConfig?.needsAmount && !values.amount) {
      formik.setFieldError("amount", "Amount is required for this donation type");
      return;
    }
    
    if (donationTypeConfig?.needsQuantity && !values.quantity) {
      formik.setFieldError("quantity", "Quantity is required for this donation type");
      return;
    }

    const formattedValues = {
      userId,
      areaId,
      donationType: values.donationType,
      givenAt: Timestamp.fromDate(new Date(values.givenAt)),
      amount: values.amount,
      quantity: values.quantity,
      description: values.description || undefined,
      givenBy: values.givenBy || undefined,
    };
    
    addDonation(formattedValues);
    formik.resetForm();
    onClose();
  };

  const formik = useFormik({
    initialValues,
    onSubmit,
    validateOnChange: true,
    validateOnBlur: true,
    validate: (values) => {
      const errors: Partial<Record<keyof FormValues, string>> = {};

      if (!values.donationType) {
        errors.donationType = "Donation type is required";
      }

      if (!values.givenAt) {
        errors.givenAt = "Date is required";
      }

      const donationTypeConfig = getDonationTypeConfig(values.donationType);
      if (donationTypeConfig?.needsAmount && (!values.amount || Number(values.amount) <= 0)) {
        errors.amount = "Please enter a valid amount";
      }

      if (donationTypeConfig?.needsQuantity && (!values.quantity || Number(values.quantity) <= 0)) {
        errors.quantity = "Please enter a valid quantity";
      }

      return errors;
    },
  });

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
  } = formik;

  const selectedDonationType = DONATION_TYPES.find(
    (type) => type.value === values.donationType
  );
  const donationTypeConfig = getDonationTypeConfig(values.donationType);

  return (
    <>
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
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add Donation"
      >
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5">
            <div>
              <Select
                name="donationType"
                options={DONATION_TYPES}
                placeholder="Select Donation Type"
                className={`${
                  errors.donationType && touched.donationType ? "select-error" : ""
                }`}
                classNamePrefix="react-select"
                value={selectedDonationType || null}
                onChange={(selected) => {
                  setFieldValue("donationType", selected?.value || "");
                  // Reset amount and quantity when type changes
                  setFieldValue("amount", undefined);
                  setFieldValue("quantity", undefined);
                }}
                onBlur={handleBlur}
              />
              {errors.donationType && touched.donationType && (
                <span className="text-error text-sm">{errors.donationType}</span>
              )}
            </div>

            <div>
              <input
                type="datetime-local"
                name="givenAt"
                placeholder="Given On"
                className={`input input-bordered w-full ${
                  errors.givenAt && touched.givenAt ? "input-error" : ""
                }`}
                onChange={handleChange}
                value={values.givenAt}
                onBlur={handleBlur}
              />
              {errors.givenAt && touched.givenAt && (
                <span className="text-error text-sm">{errors.givenAt}</span>
              )}
            </div>

            {donationTypeConfig?.needsAmount && (
              <div>
                <input
                  type="number"
                  name="amount"
                  placeholder="Amount (Rs.)"
                  className={`input input-bordered w-full ${
                    errors.amount && touched.amount ? "input-error" : ""
                  }`}
                  onChange={handleChange}
                  value={values.amount || ""}
                  onBlur={handleBlur}
                />
                {errors.amount && touched.amount && (
                  <span className="text-error text-sm">{errors.amount}</span>
                )}
              </div>
            )}

            {donationTypeConfig?.needsQuantity && (
              <div>
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantity"
                  className={`input input-bordered w-full ${
                    errors.quantity && touched.quantity ? "input-error" : ""
                  }`}
                  onChange={handleChange}
                  value={values.quantity || ""}
                  onBlur={handleBlur}
                />
                {errors.quantity && touched.quantity && (
                  <span className="text-error text-sm">{errors.quantity}</span>
                )}
              </div>
            )}

            <div>
              <textarea
                name="description"
                placeholder="Description (Optional)"
                className="textarea textarea-bordered w-full"
                onChange={handleChange}
                value={values.description}
                onBlur={handleBlur}
                rows={3}
              />
            </div>

            <div>
              <input
                type="text"
                name="givenBy"
                placeholder="Given By (Optional)"
                className="input input-bordered w-full"
                onChange={handleChange}
                value={values.givenBy}
                onBlur={handleBlur}
              />
            </div>

            <button
              type="submit"
              className="btn bg-main text-white mb-2"
              disabled={formik.isSubmitting}
            >
              Submit
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AddDonation;
