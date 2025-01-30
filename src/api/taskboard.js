// taskboardService.js
import api, { fetcher } from 'pages/api'; // Your configured Axios instance & fetcher
import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { initialBacklogs } from 'utils/initialData'; // Your local fallback data
import { openSnackbar } from 'api/snackbar'; // If you use a global snackbar

// Initial local state for master
const initialState = {
  selectedItem: false
};

// API Endpoints
export const endpoints = {
  key: '/api/taskboard', // Base key for SWR
  master: '/api/taskboard/master',
  list: '/api/taskboard', // GET
  addColumn: '/api/taskboard/add-column',
  editColumn: '/api/taskboard/edit-column',
  updateColumnOrder: '/api/taskboard/update-column-order',
  deleteColumn: '/api/taskboard/delete-column',
  addItem: '/api/taskboard/add-item',
  editItem: '/api/taskboard/edit-item',
  updateColumnItemOrder: '/api/taskboard/update-column-item-order',
  addItemComment: '/api/taskboard/add-item-comment',
  deleteItem: '/api/taskboard/delete-item',
  addStory: '/api/taskboard/add-story',
  editStory: '/api/taskboard/edit-story',
  updateStoryOrder: '/api/taskboard/update-story-order',
  updateStoryItemOrder: '/api/taskboard/update-storyitem-order',
  addStoryComment: '/api/taskboard/add-story-comment',
  deleteStory: '/api/taskboard/delete-story',
  users: '/api/taskboard/users', // GET
  deleteItemComment: '/api/taskboard/delete-item-comment',
  deleteStoryComment: '/api/taskboard/delete-story-comment'
};

/* ==============================
   HOOKS
   ============================== */

// 1. Hook to fetch all users
export function useGetUsers() {
  const { data, error, isValidating } = useSWR(endpoints.users, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    fallbackData: []
  });

  const isLoading = !data && !error;

  return useMemo(
    () => ({
      users: data || [],
      usersLoading: isLoading,
      usersError: error,
      usersValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );
}

// 2. Hook to fetch Backlogs (all columns, items, etc.)
export function useGetBacklogs() {
  const { data, error, isValidating } = useSWR(endpoints.list, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    fallbackData: null
  });

  const isLoading = !data && !error;

  return useMemo(
    () => ({
      backlogs: data || null,
      backlogsLoading: isLoading,
      backlogsError: error,
      backlogsValidating: isValidating
    }),
    [data, error, isLoading, isValidating]
  );
}

// 3. Hook to get Taskboard Master (e.g., selectedItem)
export function useGetTaskboardMaster() {
  const { data, isLoading, error } = useSWR(endpoints.master, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    fallbackData: initialState
  });

  return useMemo(
    () => ({
      taskboardMaster: data,
      taskboardMasterLoading: isLoading,
      taskboardMasterError: error
    }),
    [data, isLoading, error]
  );
}

/* ==============================
   MASTER OPERATIONS
   ============================== */

// A. Update selected item
const updateSelectedItem = async (selectedItem) => {
  const response = await api.post(endpoints.master, { selectedItem });
  // Expecting { success: boolean, data: { ... } } in response
  return response.data;
};


export async function handleTaskboardDialog(selectedItem) {
  // to update local state based on key
  const response = await api.post(endpoints.master, { selectedItem }).then(()=>{

    mutate(
     endpoints.master,
      (currentKanbanMaster) => {
        return { ...currentKanbanMaster, selectedItem };
      },
      false
    );
  })

}

/* ==============================
   COLUMN OPERATIONS
   ============================== */

export async function addColumn(newColumn) {
  // Optimistic UI Update
  mutate(
    endpoints.list,
    (current) => {
      if (!current) {
        return {
          ...current,
          columns: [newColumn],
          columnsOrder: [newColumn.id],
          items: [],
          userStory: [],
          userStoryOrder: [],
          comments: []
        };
      }

      const columns = [...current.columns, newColumn];
      const columnsOrder = [...current.columnsOrder, newColumn.id];
      return { ...current, columns, columnsOrder };
    },
    false
  );

  try {
    const response = await api.post(endpoints.addColumn, { column: newColumn });
    // Revalidate
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to add column:', error);
    mutate(endpoints.list);
    throw error;
  }
}

export async function editColumn(newColumn) {
  // Optimistic
  mutate(
    endpoints.list,
    (current) => {
      if (!current) return current;
      const columns = current.columns.map((col) =>
        col.id === newColumn.id ? newColumn : col
      );
      return { ...current, columns };
    },
    false
  );

  try {
    const response = await api.post(endpoints.editColumn, { column: newColumn });
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to edit column:', error);
    mutate(endpoints.list);
    throw error;
  }
}

export async function updateColumnOrder(columnsOrder) {
  // Optimistic
  mutate(
    endpoints.list,
    (current) => {
      if (!current) return current;
      return { ...current, columnsOrder };
    },
    false
  );

  try {
    const response = await api.post(endpoints.updateColumnOrder, { columnsOrder });
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to update column order:', error);
    mutate(endpoints.list);
    throw error;
  }
}

export async function deleteColumn(columnId) {
  // Optimistic
  mutate(
    endpoints.list,
    (current) => {
      if (!current) return current;
      const columns = current.columns.filter((col) => col.id !== columnId);
      const columnsOrder = current.columnsOrder.filter((id) => id !== columnId);
      return { ...current, columns, columnsOrder };
    },
    false
  );

  try {
    const response = await api.post(endpoints.deleteColumn, { columnId });
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to delete column:', error);
    mutate(endpoints.list);
    throw error;
  }
}

/* ==============================
   ITEM OPERATIONS
   ============================== */

export async function addItem(columnId, item, storyId) {
  // Optimistic
  mutate(
    endpoints.list,
    (current) => {
      if (!current) {
        return {
          columns: columnId !== '0' ? [{ id: columnId, itemIds: [item.id] }] : [],
          columnsOrder: [],
          items: [item],
          userStory: storyId !== '0' ? [{ id: storyId, itemIds: [item.id] }] : [],
          userStoryOrder: [],
          comments: []
        };
      }

      const columns = current.columns.map((col) =>
        col.id === columnId
          ? { ...col, itemIds: [...col.itemIds, item.id] }
          : col
      );

      const userStory = current.userStory.map((story) =>
        story.id === storyId
          ? { ...story, itemIds: [...story.itemIds, item.id] }
          : story
      );

      const items = [...current.items, item];
      return { ...current, columns, userStory, items };
    },
    false
  );

  try {
    const response = await api.post(endpoints.addItem, { columnId, item, storyId });
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to add item:', error);
    mutate(endpoints.list);
    throw error;
  }
}

// In api/taskboard.js (or your equivalent)

export async function editItem(columnId, newItem, storyId) {
  // Optimistic UI update
  mutate(
    endpoints.list,
    (current) => {
      if (!current) return current;

      // 1) Update the item in the items array
      const items = current.items.map((it) => (it.id === newItem.id ? newItem : it));

      // 2) Remove from other user stories, then add to target story if needed
      const userStory = current.userStory.map((story) => {
        const filteredItemIds = story.itemIds.filter((id) => id !== newItem.id);

        // If this story matches the new storyId (and storyId != '0'), add the item
        if (storyId && story.id === storyId && storyId !== '0') {
          return { ...story, itemIds: [...filteredItemIds, newItem.id] };
        }
        return { ...story, itemIds: filteredItemIds };
      });

      // 3) Remove from other columns, then add to target column if needed
      const columns = current.columns.map((col) => {
        const filteredIds = col.itemIds.filter((id) => id !== newItem.id);
        if (columnId && col.id === columnId && columnId !== '0') {
          return { ...col, itemIds: [...filteredIds, newItem.id] };
        }
        return { ...col, itemIds: filteredIds };
      });

      return { ...current, items, userStory, columns };
    },
    false
  );

  try {
    const response = await api.post(endpoints.editItem, { columnId, newItem, storyId });
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to edit item:', error);
    // Revalidate to get the server state back if something went wrong
    mutate(endpoints.list);
    throw error;
  }
}


export async function updateColumnItemOrder(columnsData) {
  // Optimistic
  mutate(
    endpoints.list,
    (current) => {
      if (!current) return current;
      // Overwrite columns' itemIds
      const updatedCols = current.columns.map((col) => {
        const newColData = columnsData.find((c) => c.id === col.id);
        return newColData ? { ...col, itemIds: newColData.itemIds } : col;
      });
      return { ...current, columns: updatedCols };
    },
    false
  );

  try {
    const response = await api.post(endpoints.updateColumnItemOrder, { columns: columnsData });
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to update column item order:', error);
    mutate(endpoints.list);
    throw error;
  }
}

export async function addItemComment(itemId, comment) {
  // Optimistic
  mutate(
    endpoints.list,
    (current) => {
      if (!current) {
        return {
          columns: [],
          columnsOrder: [],
          items: [{ id: itemId, commentIds: [comment.id] }],
          userStory: [],
          userStoryOrder: [],
          comments: [comment]
        };
      }

      const items = current.items.map((it) =>
        it.id === itemId
          ? { ...it, commentIds: [...it.commentIds, comment.id] }
          : it
      );
      const comments = [...current.comments, comment];

      return { ...current, items, comments };
    },
    false
  );

  try {
    const response = await api.post(endpoints.addItemComment, { itemId, comment });
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to add item comment:', error);
    mutate(endpoints.list);
    throw error;
  }
}

export async function deleteItem(itemId) {
  // Optimistic
  mutate(
    endpoints.list,
    (current) => {
      if (!current) return current;

      const items = current.items.filter((it) => it.id !== itemId);
      const columns = current.columns.map((col) => ({
        ...col,
        itemIds: col.itemIds.filter((id) => id !== itemId)
      }));
      const userStory = current.userStory.map((story) => ({
        ...story,
        itemIds: story.itemIds.filter((id) => id !== itemId)
      }));

      return { ...current, items, columns, userStory };
    },
    false
  );

  try {
    const response = await api.post(endpoints.deleteItem, { itemId });
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to delete item:', error);
    mutate(endpoints.list);
    throw error;
  }
}

/* ==============================
   USER STORY OPERATIONS
   ============================== */

export async function addStory(newStory) {
  // Optimistic
  mutate(
    endpoints.list,
    (current) => {
      if (!current) {
        return {
          columns: [],
          columnsOrder: [],
          items: [],
          userStory: [newStory],
          userStoryOrder: [newStory.id],
          comments: []
        };
      }

      const userStory = [...current.userStory, newStory];
      const userStoryOrder = [...current.userStoryOrder, newStory.id];
      return { ...current, userStory, userStoryOrder };
    },
    false
  );

  try {
    const response = await api.post(endpoints.addStory, { story: newStory });
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to add story:', error);
    mutate(endpoints.list);
    throw error;
  }
}

// api/taskboard.js
export async function editStory(newStory) {
  // Optimistic UI update
  mutate(
    endpoints.list,
    (current) => {
      if (!current) return current;
      const userStory = current.userStory.map((s) =>
        s.id === newStory.id ? { ...s, ...newStory } : s
      );
      return { ...current, userStory };
    },
    false
  );

  try {
    const response = await api.post(endpoints.editStory, { story: newStory });
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to edit story:', error);
    mutate(endpoints.list);
    throw error;
  }
}


export async function updateStoryOrder(userStoryOrder) {
  // Optimistic
  mutate(
    endpoints.list,
    (current) => {
      if (!current) return current;
      return { ...current, userStoryOrder };
    },
    false
  );

  try {
    const response = await api.post(endpoints.updateStoryOrder, { userStoryOrder });
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to update story order:', error);
    mutate(endpoints.list);
    throw error;
  }
}

export async function updateStoryItemOrder(userStory) {
  // Optimistic
  mutate(
    endpoints.list,
    (current) => {
      if (!current) return current;
      return { ...current, userStory };
    },
    false
  );

  try {
    const response = await api.post(endpoints.updateStoryItemOrder, { userStory });
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to update story item order:', error);
    mutate(endpoints.list);
    throw error;
  }
}

export async function addStoryComment(storyId, comment) {
  // Optimistic
  mutate(
    endpoints.list,
    (current) => {
      if (!current) {
        return {
          columns: [],
          columnsOrder: [],
          items: [],
          userStory: [
            {
              id: storyId,
              commentIds: [comment.id],
              itemIds: [],
              title: ''
            }
          ],
          userStoryOrder: [],
          comments: [comment]
        };
      }

      const userStory = current.userStory.map((s) =>
        s.id === storyId
          ? { ...s, commentIds: [...s.commentIds, comment.id] }
          : s
      );
      const comments = [...current.comments, comment];

      return { ...current, userStory, comments };
    },
    false
  );

  try {
    const response = await api.post(endpoints.addStoryComment, { storyId, comment });
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to add story comment:', error);
    mutate(endpoints.list);
    throw error;
  }
}

export async function deleteStory(storyId) {
  // Optimistic
  mutate(
    endpoints.list,
    (current) => {
      if (!current) return current;
      const userStory = current.userStory.filter((s) => s.id !== storyId);
      const userStoryOrder = current.userStoryOrder.filter((id) => id !== storyId);
      return { ...current, userStory, userStoryOrder };
    },
    false
  );

  try {
    const response = await api.post(endpoints.deleteStory, { storyId });
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to delete story:', error);
    mutate(endpoints.list);
    throw error;
  }
}



export async function deleteItemComment(itemId, commentId) {
  // 1. Optimistic UI update
  mutate(
    endpoints.list,
    (current) => {
      if (!current) return current;

      // Remove from comments[]
      const updatedComments = current.comments.filter((c) => c.id !== commentId);

      // Remove from the item's commentIds[]
      const updatedItems = current.items.map((it) =>
        it.id === itemId
          ? { ...it, commentIds: it.commentIds.filter((id) => id !== commentId) }
          : it
      );

      return { ...current, items: updatedItems, comments: updatedComments };
    },
    false
  );

  // 2. Call your backend
  try {
    const response = await api.delete(endpoints.deleteItemComment, {
      data: { itemId, commentId }
    });
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to delete item comment:', error);
    mutate(endpoints.list);
    throw error;
  }
}


export async function deleteStoryComment(storyId, commentId) {
  // 1. Optimistic UI update
  mutate(
    endpoints.list,
    (current) => {
      if (!current) return current;

      // Remove the comment from the global "comments" array
      const updatedComments = current.comments.filter((c) => c.id !== commentId);

      // Find the story, remove the commentId from its commentIds
      const updatedUserStory = current.userStory.map((s) =>
        s.id === storyId
          ? { ...s, commentIds: s.commentIds.filter((id) => id !== commentId) }
          : s
      );

      return { ...current, comments: updatedComments, userStory: updatedUserStory };
    },
    false
  );

  // 2. Call the backend route
  try {
    const response = await api.delete(endpoints.deleteStoryComment, {
      data: { storyId, commentId }
    });
    // Re-validate cache
    mutate(endpoints.list);
    return response.data;
  } catch (error) {
    console.error('Failed to delete story comment:', error);
    // Re-validate on error to revert to server data
    mutate(endpoints.list);
    throw error;
  }
}