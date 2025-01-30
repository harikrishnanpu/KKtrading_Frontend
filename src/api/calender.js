import useSWR, { mutate } from 'swr';
import { useMemo } from 'react';
import { v4 as UIDV4 } from 'uuid';

// Our axios-based fetcher
import { fetcher } from 'pages/api';
import api from 'pages/api';

export const endpoints = {
  // The key we use for SWR
  key: '/api/calendar/events',    // <-- The route on your server that returns all events
  
  // Specific server endpoints for CRUD
  add: '/api/calendar/events/add',
  update: '/api/calendar/events/update',
  delete: '/api/calendar/events/delete'
};

// --------------------------------------------
// useGetEvents - SWR hook to fetch all events
// --------------------------------------------
export function useGetEvents() {
  const { data, isLoading, error, isValidating } = useSWR(endpoints.key, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      events: data?.events || [], // If `data` is undefined, fallback to empty array
      eventsLoading: isLoading,
      eventsError: error,
      eventsValidating: isValidating,
      eventsEmpty: !isLoading && (!data || data.events?.length === 0)
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// --------------------------------------------
// createEvent - Add a new event (with optimistic update)
// --------------------------------------------
export async function createEvent(newEvent) {
  // 1) Optimistically update the local SWR cache.
  mutate(
    endpoints.key,
    (currentData) => {
      if (!currentData || !currentData.events) return currentData;
      const addedEvents = [
        ...currentData.events,
        { ...newEvent, id: UIDV4() } // Give a local ID
      ];
      return { ...currentData, events: addedEvents };
    },
    false
  );

  // 2) Send request to the server to actually create it in DB.
  try {
    await api.post(endpoints.add, newEvent);
    // 3) Revalidate so we get the fresh data from the server
    mutate(endpoints.key);
  } catch (error) {
    console.error(error);
    // Optionally revert local mutation if server fails
    mutate(endpoints.key);
  }
}

// --------------------------------------------
// updateEvent - Update an existing event (with optimistic update)
// --------------------------------------------
export async function updateEvent(eventId, updatedEvent) {
  // 1) Optimistically update the local SWR cache.
  mutate(
    endpoints.key,
    (currentData) => {
      if (!currentData || !currentData.events) return currentData;
      const updatedEvents = currentData.events.map((evt) =>
        evt.id === eventId ? { ...evt, ...updatedEvent } : evt
      );
      return { ...currentData, events: updatedEvents };
    },
    false
  );

  // 2) Send request to the server to actually update in DB.
  try {
    await api.post(endpoints.update, { id: eventId, ...updatedEvent });
    // 3) Revalidate so we get the fresh data
    mutate(endpoints.key);
  } catch (error) {
    console.error(error);
    // Revert local changes if desired
    mutate(endpoints.key);
  }
}

// --------------------------------------------
// deleteEvent - Remove an event (with optimistic update)
// --------------------------------------------
export async function deleteEvent(eventId) {
  // 1) Optimistically update the local SWR cache.
  mutate(
    endpoints.key,
    (currentData) => {
      if (!currentData || !currentData.events) return currentData;
      const filteredEvents = currentData.events.filter((evt) => evt.id !== eventId);
      return { ...currentData, events: filteredEvents };
    },
    false
  );

  // 2) Send request to the server to actually delete in DB.
  try {
    await api.post(endpoints.delete, { id: eventId });
    // 3) Revalidate so we get the fresh data
    mutate(endpoints.key);
  } catch (error) {
    console.error(error);
    // Revert local changes if desired
    mutate(endpoints.key);
  }
}
