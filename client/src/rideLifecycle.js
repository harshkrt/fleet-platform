//for the driver
export const NEXT_STATUS = {
  REQUESTED: "ACCEPTED",
  ACCEPTED: "DRIVER_ARRIVING",
  DRIVER_ARRIVING: "STARTED",
  STARTED: "COMPLETED",
};

export const STATUS_LABEL = {
  REQUESTED: "Requested",
  ACCEPTED: "Accepted",
  DRIVER_ARRIVING: "Driver arriving",
  STARTED: "Started",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const STATUS_COLOR = {
  REQUESTED: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  DRIVER_ARRIVING: "bg-indigo-100 text-indigo-800",
  STARTED: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

export const isCancellable = (status) =>
  status === "REQUESTED" ||
  status === "ACCEPTED" ||
  status === "DRIVER_ARRIVING";
