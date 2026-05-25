import React, { useState } from "react";
import Image from "next/image";
import { masjidConfig } from "@/config/masjid";
import { useSubmitRegistration } from "@/api/registrationApi";
import { ChildFormType, SpouseFormType } from "@/types/types";

const emptyChild = (): ChildFormType => ({
  name: "",
  dateOfBirth: "",
  grade: "",
  school: "",
  gender: "",
});

const RegistrationForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeSpouse, setIncludeSpouse] = useState(false);

  const [name, setName] = useState("");
  const [NIC, setNIC] = useState("");
  const [address, setAddress] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [spouse, setSpouse] = useState<SpouseFormType>({
    name: "",
    NIC: "",
    contactNo: "",
    occupation: "",
  });
  const [children, setChildren] = useState<ChildFormType[]>([]);

  const { mutate: submit, isPending } = useSubmitRegistration();

  const updateChild = (index: number, field: keyof ChildFormType, value: string) => {
    setChildren((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (website.trim()) return; // bot honeypot

    if (!name.trim() || !NIC.trim() || !address.trim() || !contactNo.trim()) {
      setError("Please fill all required fields for the head of household.");
      return;
    }

    if (includeSpouse && !spouse.name.trim()) {
      setError("Spouse name is required when spouse section is enabled.");
      return;
    }

    submit(
      {
        name: name.trim(),
        NIC: NIC.trim(),
        address: address.trim(),
        contactNo: contactNo.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        spouse: includeSpouse ? spouse : null,
        children,
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err: Error) =>
          setError(err.message || "Submission failed. Please try again."),
      }
    );
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl text-white"
            style={{ backgroundColor: masjidConfig.primaryColor }}
          >
            ✓
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Registration submitted
          </h1>
          <p className="text-slate-600 text-sm">
            Thank you. The masjid administration will review your application and
            contact you after approval.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Image
            src={masjidConfig.logoPath}
            alt={masjidConfig.name}
            width={80}
            height={80}
            className="rounded-full mx-auto mb-4 border-2 border-slate-200"
          />
          <h1 className="text-2xl font-bold text-slate-900">
            {masjidConfig.name}
          </h1>
          {masjidConfig.tagline ? (
            <p className="text-slate-500 text-sm mt-1">{masjidConfig.tagline}</p>
          ) : null}
          <p className="text-slate-600 mt-4">Member registration form</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-8"
        >
          {/* Honeypot */}
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
          />

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Head of household
            </h2>
            <div className="grid gap-4">
              <input
                className="input input-bordered w-full"
                placeholder="Full name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                className="input input-bordered w-full"
                placeholder="NIC *"
                value={NIC}
                onChange={(e) => setNIC(e.target.value)}
                required
              />
              <input
                className="input input-bordered w-full"
                placeholder="Contact number *"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                required
              />
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Address *"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
              <input
                className="input input-bordered w-full"
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Additional notes (optional)"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </section>

          <section>
            <label className="flex items-center gap-2 cursor-pointer mb-4">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={includeSpouse}
                onChange={(e) => setIncludeSpouse(e.target.checked)}
              />
              <span className="text-sm font-medium text-slate-700">
                Include spouse details
              </span>
            </label>
            {includeSpouse && (
              <div className="grid gap-4 pl-0">
                <input
                  className="input input-bordered w-full"
                  placeholder="Spouse name *"
                  value={spouse.name}
                  onChange={(e) =>
                    setSpouse({ ...spouse, name: e.target.value })
                  }
                />
                <input
                  className="input input-bordered w-full"
                  placeholder="Spouse NIC (optional)"
                  value={spouse.NIC}
                  onChange={(e) =>
                    setSpouse({ ...spouse, NIC: e.target.value })
                  }
                />
                <input
                  className="input input-bordered w-full"
                  placeholder="Spouse contact (optional)"
                  value={spouse.contactNo}
                  onChange={(e) =>
                    setSpouse({ ...spouse, contactNo: e.target.value })
                  }
                />
                <input
                  className="input input-bordered w-full"
                  placeholder="Occupation (optional)"
                  value={spouse.occupation}
                  onChange={(e) =>
                    setSpouse({ ...spouse, occupation: e.target.value })
                  }
                />
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Children
              </h2>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setChildren((prev) => [...prev, emptyChild()])}
              >
                + Add child
              </button>
            </div>
            {children.length === 0 ? (
              <p className="text-sm text-slate-500">
                No children added. Click &quot;Add child&quot; if applicable.
              </p>
            ) : (
              <div className="space-y-4">
                {children.map((child, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-500">
                        Child {index + 1}
                      </span>
                      <button
                        type="button"
                        className="text-xs text-red-600"
                        onClick={() =>
                          setChildren((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      className="input input-bordered w-full input-sm"
                      placeholder="Name *"
                      value={child.name}
                      onChange={(e) =>
                        updateChild(index, "name", e.target.value)
                      }
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="input input-bordered input-sm"
                        placeholder="Date of birth"
                        value={child.dateOfBirth}
                        onChange={(e) =>
                          updateChild(index, "dateOfBirth", e.target.value)
                        }
                      />
                      <input
                        className="input input-bordered input-sm"
                        placeholder="Gender"
                        value={child.gender}
                        onChange={(e) =>
                          updateChild(index, "gender", e.target.value)
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="input input-bordered input-sm"
                        placeholder="Grade"
                        value={child.grade}
                        onChange={(e) =>
                          updateChild(index, "grade", e.target.value)
                        }
                      />
                      <input
                        className="input input-bordered input-sm"
                        placeholder="School"
                        value={child.school}
                        onChange={(e) =>
                          updateChild(index, "school", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-lg font-semibold text-white !bg-main border-0 disabled:opacity-60"
          >
            {isPending ? "Submitting…" : "Submit registration"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;
