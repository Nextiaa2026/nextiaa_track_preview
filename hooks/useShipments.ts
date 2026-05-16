import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentService } from "@/services/shipment.service";
import {
  ShipmentInput,
  ShipmentPatchInput,
  TripInput,
  TripPatchInput,
  TripLogInput,
} from "@/lib/validations";

// ─── Shipments ────────────────────────────────────────────────────────────────

export const useShipments = (
  page = 1,
  pageSize = 10,
  search = "",
  startDate?: string,
  endDate?: string,
  tripId?: string,
) => {
  return useQuery({
    queryKey: ["shipments", page, pageSize, search, startDate, endDate, tripId],
    queryFn: () => shipmentService.getShipments(page, pageSize, search, startDate, endDate, tripId),
  });
};

export const useShipment = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["shipment", id],
    queryFn: () => shipmentService.getShipment(id),
    enabled: options?.enabled ?? !!id,
  });
};

export const useCreateShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ShipmentInput) => shipmentService.createShipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
};

export const useUpdateShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShipmentPatchInput }) =>
      shipmentService.updateShipment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["shipment", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["active-shipments-map"] });
    },
  });
};

export const useDeleteShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shipmentService.deleteShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
};

export const useTrackShipment = () => {
  return useMutation({
    mutationFn: (trackingNumber: string) => shipmentService.trackShipment(trackingNumber),
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => shipmentService.getDashboardStats(),
  });
};

export const useActiveShipmentsMap = () => {
  return useQuery({
    queryKey: ["active-shipments-map"],
    queryFn: () => shipmentService.getActiveShipmentsMap(),
    refetchInterval: 60000,
  });
};

export const useCreateReceipt = () => {
  return useMutation({
    mutationFn: (shipmentId: string) => shipmentService.createReceipt(shipmentId),
  });
};

export const useResendNotification = () => {
  return useMutation({
    mutationFn: (shipmentId: string) => shipmentService.resendNotification(shipmentId),
  });
};

export const useBulkAssignTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shipmentIds, tripId }: { shipmentIds: string[]; tripId: string | null }) =>
      shipmentService.bulkAssignTrip(shipmentIds, tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
};

// ─── Trips ────────────────────────────────────────────────────────────────────

export const useTrips = (page = 1, pageSize = 20, search = "") => {
  return useQuery({
    queryKey: ["trips", page, pageSize, search],
    queryFn: () => shipmentService.getTrips(page, pageSize, search),
  });
};

export const useTrip = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["trip", id],
    queryFn: () => shipmentService.getTrip(id),
    enabled: options?.enabled ?? !!id,
  });
};

export const useCreateTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TripInput) => shipmentService.createTrip(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
};

export const useUpdateTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TripPatchInput }) =>
      shipmentService.updateTrip(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trip", id] });
      // Status cascade: invalidate all shipment queries so UI reflects new status
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["shipment"] }); // all individual shipment queries
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const useDeleteTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shipmentService.deleteTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
};

// ─── Trip Logs ────────────────────────────────────────────────────────────────

export const useAddTripLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TripLogInput) => shipmentService.addTripLog(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trip", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["trip-logs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
};

export const useTripLogs = (
  page = 1,
  pageSize = 10,
  tripId?: string,
  startDate?: string,
  endDate?: string,
  status?: string,
  search?: string,
) => {
  return useQuery({
    queryKey: ["trip-logs", page, pageSize, tripId, startDate, endDate, status, search],
    queryFn: () => shipmentService.getTripLogs(page, pageSize, tripId, startDate, endDate, status, search),
  });
};

// ─── Vessels ──────────────────────────────────────────────────────────────────

export const useVessels = (page = 1, pageSize = 50, search = "") => {
  return useQuery({
    queryKey: ["vessels", page, pageSize, search],
    queryFn: () => shipmentService.getVessels(page, pageSize, search),
  });
};

export const useCreateVessel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shipmentService.createVessel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessels"] });
    },
  });
};

export const useUpdateVessel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof shipmentService.updateVessel>[1];
    }) => shipmentService.updateVessel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessels"] });
    },
  });
};

export const useDeleteVessel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shipmentService.deleteVessel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessels"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
};

export const useCleanupOperationalData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => shipmentService.cleanupOperationalData(),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const useInvoices = (
  page = 1,
  pageSize = 10,
  search = "",
  status?: string,
  startDate?: string,
  endDate?: string,
) => {
  return useQuery({
    queryKey: ["invoices", page, pageSize, search, status, startDate, endDate],
    queryFn: () => shipmentService.getInvoices(page, pageSize, search, status, startDate, endDate),
  });
};
