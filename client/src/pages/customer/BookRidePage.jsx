import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRide } from "../../api/rides";
import { ApiError } from "../../api/client";

const BASE_FARE = 50;
const FARE_PER_KM = 10;

const emptyForm = {
  pickupLocation: "",
  dropLocation: "",
  requestedTime: "",
  estimatedDistance: "",
  notes: "",
};

export default function BookRidePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});//frontend error
  const [submitError, setSubmitError] = useState("");//backend error
  const [submitting, setSubmitting] = useState(false);//duplicate submission

  const distance = Number(form.estimatedDistance);
  const estimatedFare = distance > 0 ? BASE_FARE + distance * FARE_PER_KM : null;

  const updateField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    const next = {};

    //frontend validation
    if (!form.pickupLocation.trim()) next.pickupLocation = "Pickup location is required";
    if (!form.dropLocation.trim()) next.dropLocation = "Destination is required";
    if (!form.requestedTime) next.requestedTime = "Pickup date and time are required";
    if (!form.estimatedDistance || distance <= 0)
      next.estimatedDistance = "Enter a distance greater than 0";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    //prevent double submission
    if (submitting) return;

    //if validation fails we stop
    if (!validate()) return;

    setSubmitError("");
    setSubmitting(true);
    try {
      await createRide({
        pickupLocation: form.pickupLocation.trim(),
        dropLocation: form.dropLocation.trim(),
        estimatedDistance: distance,
        requestedTime: new Date(form.requestedTime).toISOString(),
        notes: form.notes.trim() || undefined,
      });
      navigate("/customer/rides");
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not create the ride. Please retry.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-lg font-semibold text-gray-900">Book a ride</h1>
      <p className="mt-1 text-sm text-gray-500">Enter your trip details below.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <Field label="Pickup location" error={errors.pickupLocation}>
          <input
            value={form.pickupLocation}
            onChange={updateField("pickupLocation")}
            className="input"
            placeholder="e.g. Tezpur University"
          />
        </Field>

        <Field label="Destination" error={errors.dropLocation}>
          <input
            value={form.dropLocation}
            onChange={updateField("dropLocation")}
            className="input"
            placeholder="e.g. Railway Station"
          />
        </Field>

        <Field label="Requested pickup date and time" error={errors.requestedTime}>
          <input
            type="datetime-local"
            value={form.requestedTime}
            onChange={updateField("requestedTime")}
            className="input"
          />
        </Field>

        <Field label="Estimated distance (km)" error={errors.estimatedDistance}>
          <input
            type="number"
            min="0"
            step="0.1"
            value={form.estimatedDistance}
            onChange={updateField("estimatedDistance")}
            className="input"
            placeholder="e.g. 12"
          />
        </Field>

        <Field label="Notes (optional)">
          <textarea
            value={form.notes}
            onChange={updateField("notes")}
            className="input"
            rows={2}
            placeholder="Anything the driver should know"
          />
        </Field>

        {estimatedFare !== null && (
          <p className="text-sm text-gray-600">
            Estimated fare: <span className="font-medium text-gray-900">₹{estimatedFare.toFixed(2)}</span>
          </p>
        )}

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Booking..." : "Book ride"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}