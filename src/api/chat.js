import useSWR, { mutate } from 'swr';
import { useMemo } from 'react';
import { fetcher, fetcherPost } from 'utils/axios';

// Updated endpoints to match your backend routes
export const endpoints = {
  // Fetch all users from GET /api/users
  users: '/api/chat/users',
  // Filter chat by user with POST /api/chat/filter
  filter: '/api/chat/filter',
  // Insert a new chat with POST /api/chat
  insertChat: '/api/chat'
};

/**
 * Fetch the list of users from GET /api/users
 */
export function useGetUsers() {
  // Directly call endpoints.users => '/api/users'
  const { data, isLoading, error, isValidating } = useSWR(endpoints.users, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  // Memoize to avoid unnecessary re-renders
  const memoizedValue = useMemo(
    () => ({
      users: data?.users || [],
      usersLoading: isLoading,
      usersError: error,
      usersValidating: isValidating,
      usersEmpty: !isLoading && !data?.users?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

/**
 * Fetch chat for a given user using POST /api/chat/filter
 * We use the SWR key as an array: [endpoint, body]
 */
export function useGetUserChat(userId) {
  // If userName is empty, return null to skip fetching
  const key = userId ? [endpoints.filter, { user: userId }] : null;

  const { data, isLoading, error, isValidating } = useSWR(key, fetcherPost, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(
    () => ({
      chat: data || [],
      chatLoading: isLoading,
      chatError: error,
      chatValidating: isValidating,
      chatEmpty: !isLoading && !data?.length
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

/**
 * Insert a new chat message with POST /api/chat
 * Also does an optimistic update of the local cache.
 */
export async function insertChat(userId, newChat) {
  // The same SWR key used in `useGetUserChat` to store chat for userName
  const swrKey = [endpoints.filter, { user: userId }];

  // 1) Optimistically update local cache
  mutate(
    swrKey,
    (currentChat = []) => {
      return [...currentChat, newChat];
    },
    false
  );

  // 2) Make an actual POST to the server
  // newChat should have { id, from, to, text, time } based on your backend
  await fetcherPost([endpoints.insertChat, newChat]);

  // 3) (Optional) Re-validate to ensure we have fresh data from server
  mutate(swrKey);
}
