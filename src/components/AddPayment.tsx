import { Timestamp } from "firebase/firestore";
import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { useAddPayment } from "@/api/areaApi";
import Select from "react-select";
import {
  formatLocalDateTime,
  MonthOption,
  MONTHS,
  PAYMENT_STATUSES,
} from "@/utils/commonUtils";

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  areaCode: string;
  userId: string;
}

interface FormValues {
  userId: string;
  areaId: string;
  amount: number;
  month: string[];
  year: number;
  paidAt: string;
  status: string;
}

const AddPayment = ({ isModalOpen, onClose, areaCode, userId }: Props) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timeout = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [toastMessage]);

  const showSuccessToast = () => setToastMessage("Payment added Successfully!");
  const showErrorToast = () => setToastMessage("Oops, something went wrong!");

  const handleCloseModal = () => {
    formik.resetForm();
    onClose();
  };

  const { mutate: addPayment } = useAddPayment(
    showSuccessToast,
    showErrorToast
  );

  const initialValues: FormValues = {
    year: new Date().getFullYear(),
    month: [],
    amount: 0,
    paidAt: formatLocalDateTime(new Date()),
    status: "",
    userId: "",
    areaId: ""
  };

  const onSubmit = (values: FormValues) => {
    const formattedValues = {
      ...values,
      paidAt: Timestamp.fromDate(new Date(values.paidAt)), // Timestamp matches Firebase
      areaId: areaCode, // Matches string type for areaCode
      userId, // Matches string type for userId
      amount: values.amount,
      year: values.year 
    };
    addPayment(formattedValues);
    formik.resetForm();
    onClose();
  };
  
  

  const formik = useFormik({
    initialValues,
    onSubmit,
    validateOnChange: true,
    validateOnBlur: true,
    validate: (values) => {
      const errors: Partial<Record<keyof FormValues, string | string[]>> = {};

      if (!values.year) {
        errors.year = "Year is required";
      }

      if (!values.month.length) {
        errors.month = ["At least one month must be selected"];
      }
      if (!values.amount || Number(values.amount) <= 0) {
        errors.amount = "Please enter a valid amount";
      }
      if (!values.paidAt) {
        errors.paidAt = "Paid date is required";
      }

      if (!values.status) {
        errors.status = "Payment status is required";
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

  const selectedMonths = MONTHS.filter((month) =>
    values.month.includes(month.value)
  );

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
        title="Add Payment"
      >
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5">
            <div>
              <input
                type="number"
                name="year"
                placeholder="Year"
                className={`input input-bordered w-full ${
                  errors.year && touched.year ? "input-error" : ""
                }`}
                onChange={handleChange}
                value={values.year}
                onBlur={handleBlur}
              />
              {errors.year && touched.year && (
                <span className="text-error text-sm">{errors.year}</span>
              )}
            </div>
            <div>
              <Select<MonthOption, true>
                isMulti
                name="month"
                options={MONTHS}
                placeholder="Select Month"
                className={`${
                  errors.month && touched.month ? "select-error" : ""
                }`}
                classNamePrefix="select"
                value={selectedMonths}
                onChange={(selected) => {
                  setFieldValue(
                    "month",
                    selected ? selected.map((option) => option.value) : []
                  );
                }}
                onBlur={handleBlur}
              />
              {errors.month && touched.month && (
                <span className="text-error text-sm">{errors.month[0]}</span>
              )}
            </div>
            <div>
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                className={`input input-bordered w-full ${
                  errors.amount && touched.amount ? "input-error" : ""
                }`}
                onChange={handleChange}
                value={values.amount}
                onBlur={handleBlur}
              />
              {errors.amount && touched.amount && (
                <span className="text-error text-sm">{errors.amount}</span>
              )}
            </div>
            <div>
              <input
                type="datetime-local"
                name="paidAt"
                placeholder="Paid On"
                className={`input input-bordered w-full ${
                  errors.paidAt && touched.paidAt ? "input-error" : ""
                }`}
                onChange={handleChange}
                value={values.paidAt}
                onBlur={handleBlur}
              />
              {errors.paidAt && touched.paidAt && (
                <span className="text-error text-sm">{errors.paidAt}</span>
              )}
            </div>
            <div>
              <Select
                name="status"
                options={PAYMENT_STATUSES}
                placeholder="Select Status"
                className={`${
                  errors.status && touched.status ? "select-error" : ""
                }`}
                classNamePrefix="react-select"
                value={
                  values.status
                    ? PAYMENT_STATUSES.find(
                        (opt) => opt.value === values.status
                      )
                    : null
                }
                onChange={(selected) =>
                  setFieldValue("status", selected?.value || "")
                }
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

export default AddPayment;
