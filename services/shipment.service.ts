import { apiClient } from "@/lib/axios";
import {
  ShipmentInput,
  ShipmentPatchInput,
  TripInput,
  TripPatchInput,
  TripLogInput,
} from "@/lib/validations";

// ─── Trip types ───────────────────────────────────────────────────────────────

export interface Trip {
  id: string;
  name: string;
  vesselId?: string | null;
  vessel?: { id: string; name: string; imo: string; type: string } | null;
  origin?: string | null;
  destination?: string | null;
  departureDate?: string | null;
  arrivalDate?: string | null;
  status: "pending" | "in_transit" | "delivered" | "failed";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripDetail extends Trip {
  shipments: Shipment[];
  logs: TripLog[];
}

export interface TripLog {
  id: string;
  tripId: string;
  status: string;
  location?: string | null;
  address?: string | null;
  message: string;
  timestamp: string;
  createdAt: string;
  trip?: {
    name: string;
  };
}

// ─── Shipment types ───────────────────────────────────────────────────────────

export interface Shipment {
  id: string;
  trackingNumber: string;
  chassisNumber: string;
  shipmentType: "international" | "local";
  itemName: string;
  itemWeight?: string | null;
  status: string;
  tripId?: string | null;
  trip?: {
    id: string;
    name: string;
    vessel?: { id: string; name: string; imo: string; type: string } | null;
  } | null;
  sender: { id: string; name: string; email: string; city: string };
  receiver: { id: string; name: string; email: string; city: string };
  createdAt: string;
}

export interface ShipmentDetail extends Shipment {
  itemDescription?: string | null;
  itemImage?: string | null;
  itemDimensions?: string | null;
  shippingCost: string;
  estimatedDelivery?: string | null;
  actualDelivery?: string | null;
  tripId?: string | null;
  trip?: {
    id: string;
    name: string;
    vessel?: { id: string; name: string; imo: string; type: string } | null;
    logs?: Array<{
      id: string;
      tripId: string;
      status: string;
      location?: string | null;
      address?: string | null;
      message: string;
      timestamp: string;
      createdAt: string;
    }>;
  } | null;
  sender: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  receiver: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
}

export interface TrackingResult {
  trackingNumber: string;
  chassisNumber: string;
  status: string;
  itemName: string;
  itemDescription?: string | null;
  itemImage?: string | null;
  tripName?: string | null;
  vesselName?: string | null;
  vesselImo?: string | null;
  sender: { name: string; email: string; phone: string };
  receiver: { name: string; email: string; phone: string };
  logs: Array<{
    id: string;
    status: string;
    location?: string | null;
    message: string;
    timestamp: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalShipments: number;
  deliveredShipments: number;
  inTransitShipments: number;
  failedShipments: number;
  totalTrips: number;
  totalTripLogs: number;
  clientTrackingViews: number;
  resendEmailsSent: number;
  resendEmailFailures: number;
  deliverySuccessRate: number;
}

// ─── Vessel types ─────────────────────────────────────────────────────────────

export interface Vessel {
  id: string;
  name: string;
  imo: string;
  type: string;
  lastKnownLat?: number | null;
  lastKnownLon?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VesselUpdateInput
  extends Partial<
    Pick<Vessel, "name" | "imo" | "type" | "lastKnownLat" | "lastKnownLon" | "isActive">
  > {}

export interface ActiveShipmentMarker {
  shipmentId: string;
  trackingNumber: string;
  chassisNumber: string;
  status: string;
  itemName: string;
  tripName?: string | null;
  vesselName?: string | null;
  latitude: number;
  longitude: number;
}

export interface ShipmentReceipt {
  receiptNumber: string;
  issuedAt: string;
  shipment: {
    id: string;
    trackingNumber: string;
    chassisNumber: string;
    itemName: string;
    itemWeight?: string | null;
    status: string;
    createdAt: string;
    shippingCost: string;
  };
  sender: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  receiver: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  shipmentId: string;
  senderId: string;
  receiverId: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  issuedAt: string;
  dueDate?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  shipment?: Shipment;
  sender?: { id: string; name: string; email: string; city: string };
  receiver?: { id: string; name: string; email: string; city: string };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const shipmentService = {
  // ── Shipments ──────────────────────────────────────────────────────────────

  getShipments: async (
    page = 1,
    pageSize = 10,
    search = "",
    startDate?: string,
    endDate?: string,
    tripId?: string,
  ): Promise<PaginatedResponse<Shipment>> => {
    const response = await apiClient.get("/api/dashboard/shipments", {
      params: { page, pageSize, search, startDate, endDate, tripId },
    });
    return response.data;
  },

  getShipment: async (id: string): Promise<ShipmentDetail> => {
    const response = await apiClient.get(`/api/dashboard/shipments/${id}`);
    return response.data.shipment;
  },

  createShipment: async (data: ShipmentInput): Promise<Shipment> => {
    const response = await apiClient.post("/api/dashboard/shipments", data);
    return response.data.shipment;
  },

  trackShipment: async (trackingNumber: string): Promise<TrackingResult> => {
    const response = await apiClient.post("/api/track", { trackingNumber });
    return response.data;
  },

  updateShipment: async (id: string, data: ShipmentPatchInput): Promise<ShipmentDetail> => {
    const response = await apiClient.patch(`/api/dashboard/shipments/${id}`, data);
    return response.data.shipment;
  },

  deleteShipment: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/dashboard/shipments/${id}`);
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get("/api/dashboard/stats");
    return response.data;
  },

  getActiveShipmentsMap: async (): Promise<ActiveShipmentMarker[]> => {
    const response = await apiClient.get("/api/dashboard/shipments/active-map");
    return response.data.data;
  },

  createReceipt: async (shipmentId: string): Promise<ShipmentReceipt> => {
    const response = await apiClient.post(`/api/dashboard/shipments/${shipmentId}/receipt`);
    return response.data.receipt;
  },

  resendNotification: async (shipmentId: string): Promise<void> => {
    await apiClient.post(`/api/dashboard/shipments/${shipmentId}/resend-notification`);
  },

  bulkAssignTrip: async (shipmentIds: string[], tripId: string | null): Promise<{ updated: number }> => {
    const response = await apiClient.post("/api/dashboard/shipments/bulk-assign", { shipmentIds, tripId });
    return response.data;
  },

  // ── Trips ──────────────────────────────────────────────────────────────────

  getTrips: async (
    page = 1,
    pageSize = 20,
    search = "",
  ): Promise<PaginatedResponse<Trip>> => {
    const response = await apiClient.get("/api/dashboard/trips", {
      params: { page, pageSize, search },
    });
    return response.data;
  },

  getTrip: async (id: string): Promise<TripDetail> => {
    const response = await apiClient.get(`/api/dashboard/trips/${id}`);
    return response.data.trip;
  },

  createTrip: async (data: TripInput): Promise<Trip> => {
    const response = await apiClient.post("/api/dashboard/trips", data);
    return response.data.trip;
  },

  updateTrip: async (id: string, data: TripPatchInput): Promise<Trip> => {
    const response = await apiClient.patch(`/api/dashboard/trips/${id}`, data);
    return response.data.trip;
  },

  deleteTrip: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/dashboard/trips/${id}`);
  },

  // ── Trip Logs ──────────────────────────────────────────────────────────────

  addTripLog: async (data: TripLogInput): Promise<TripLog> => {
    const response = await apiClient.post("/api/dashboard/trip-logs", data);
    return response.data.log;
  },

  getTripLogs: async (
    page = 1,
    pageSize = 10,
    tripId?: string,
    startDate?: string,
    endDate?: string,
    status?: string,
    search?: string,
  ): Promise<PaginatedResponse<TripLog>> => {
    const response = await apiClient.get("/api/dashboard/trip-logs", {
      params: { page, pageSize, tripId, startDate, endDate, status, search },
    });
    return response.data;
  },

  // ── Vessels ────────────────────────────────────────────────────────────────

  getVessels: async (
    page = 1,
    pageSize = 50,
    search = "",
  ): Promise<PaginatedResponse<Vessel>> => {
    const response = await apiClient.get("/api/dashboard/vessels", {
      params: { page, pageSize, search },
    });
    return response.data;
  },

  createVessel: async (
    data: Pick<Vessel, "name" | "imo" | "type"> & {
      lastKnownLat?: number;
      lastKnownLon?: number;
      isActive?: boolean;
    },
  ): Promise<Vessel> => {
    const response = await apiClient.post("/api/dashboard/vessels", data);
    return response.data.vessel;
  },

  updateVessel: async (id: string, data: VesselUpdateInput): Promise<Vessel> => {
    const response = await apiClient.patch(`/api/dashboard/vessels/${id}`, data);
    return response.data.vessel;
  },

  deleteVessel: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/dashboard/vessels/${id}`);
  },

  cleanupOperationalData: async (): Promise<void> => {
    await apiClient.post("/api/dashboard/system/cleanup");
  },

  // ── Invoices ───────────────────────────────────────────────────────────────

  getInvoices: async (
    page = 1,
    pageSize = 10,
    search = "",
    status?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<PaginatedResponse<Invoice>> => {
    const response = await apiClient.get("/api/dashboard/invoices", {
      params: { page, pageSize, search, status, startDate, endDate },
    });
    return response.data;
  },
};
