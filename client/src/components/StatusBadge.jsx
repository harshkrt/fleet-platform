import { STATUS_LABEL, STATUS_COLOR } from "../rideLifecycle";

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[status] || "bg-gray-100 text-gray-700"}`}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}
