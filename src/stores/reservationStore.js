import { create } from 'zustand';

const useReservationStore = create((set, get) => ({
  reservations: [],
  availability: [],
  selectedComputerId: null,
  selectedDate: null,
  selectedSlot: null,
  loading: false,
  error: null,

  setReservations: (reservations) => set({ reservations }),
  setAvailability: (availability) => set({ availability }),
  setSelectedComputerId: (computerId) => set({ selectedComputerId: computerId }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addReservation: (reservation) => set({ reservations: [...get().reservations, reservation] }),
  updateReservation: (reservationId, updates) =>
    set({
      reservations: get().reservations.map((reservation) =>
        reservation.id === reservationId ? { ...reservation, ...updates } : reservation
      )
    }),
  removeReservation: (reservationId) =>
    set({
      reservations: get().reservations.filter((reservation) => reservation.id !== reservationId)
    }),

  loadReservations: async (loaderFn, params) => {
    set({ loading: true, error: null });

    try {
      const reservations = await loaderFn(params);
      set({ reservations, loading: false });
      return reservations;
    } catch (error) {
      console.error('Failed to load reservations:', error);
      set({ loading: false, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },

  loadAvailability: async (loaderFn, params) => {
    set({ loading: true, error: null });

    try {
      const availability = await loaderFn(params);
      set({ availability, loading: false });
      return availability;
    } catch (error) {
      console.error('Failed to load availability:', error);
      set({ loading: false, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}));

export default useReservationStore;
