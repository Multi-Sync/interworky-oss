'use client';

import { useReducer, useEffect } from 'react';
import { getOrganization } from '../utils/localStorage';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../utils/swrFetcher';
import toast from 'react-hot-toast';

const initialState = {
  capabilityInfo: {
    name: { header: 'Capability name', body: '' },
    description: { header: 'Capability description', body: '' },
    whenToUse: { header: 'When to use capability', body: '' },
  },
  capabilityField: {
    type: '',
    name: '',
    description: '',
  },
  currentCapabilityInfo: null,
  currentCapabilityField: null,
  capabilities: [],
  isUpdating: false,
  capabilityFields: [],
};

const customCapabilityReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ORGANIZATION_ID':
      return { ...state, organizationId: action.payload };
    case 'SET_CAPABILITY_INFO':
      return {
        ...state,
        capabilityInfo: {
          ...state.capabilityInfo,
          [action.payload.id]: {
            ...state.capabilityInfo[action.payload.id],
            body: action.payload.value,
          },
        },
      };
    case 'SET_CAPABILITY_FIELD':
      return { ...state, capabilityField: { ...state.capabilityField, ...action.payload } };
    case 'SET_CURRENT_CAPABILITY_INFO':
      return { ...state, currentCapabilityInfo: action.payload };
    case 'SET_CURRENT_CAPABILITY_FIELD':
      return { ...state, currentCapabilityField: action.payload };
    case 'SET_CAPABILITIES':
      return {
        ...state,
        capabilities: action.payload.map(cap => ({
          ...cap,
          fields: cap.fields || [],
        })),
      };
    case 'SET_UPDATING':
      return { ...state, isUpdating: action.payload };
    case 'RESET_CAPABILITY_FIELD':
      return {
        ...state,
        capabilityField: initialState.capabilityField,
        currentCapabilityField: null,
      };
    case 'RESET_CAPABILITY_INFO':
      return {
        ...state,
        capabilityInfo: initialState.capabilityInfo,
        currentCapabilityInfo: null,
      };
    case 'ADD_CAPABILITY_FIELD':
      return {
        ...state,
        capabilityFields: [...state.capabilityFields, action.payload],
      };
    case 'UPDATE_CAPABILITY_FIELD':
      return {
        ...state,
        capabilityFields: state.capabilityFields.map((field, index) =>
          index === action.payload.index ? { ...field, ...action.payload.field } : field,
        ),
      };
    case 'REMOVE_CAPABILITY_FIELD':
      return {
        ...state,
        capabilityFields: state.capabilityFields.filter((_, index) => index !== action.payload),
      };
    default:
      return state;
  }
};

const useCustomCapability = () => {
  const [state, dispatch] = useReducer(customCapabilityReducer, initialState);

  // Safely get organization ID with null checks
  const organization = getOrganization();
  const orgId = organization?.organization?.id || null;

  const {
    data: customCapabilitiesData,
    error: customCapabilitiesError,
    isLoading: isLoadingCustomCapabilitiesData,
    mutate: mutateCustomCapabilities,
  } = useSWR(orgId ? `/api/models/organization-methods/organization/${orgId}` : null, fetcher);

  useEffect(() => {
    if (customCapabilitiesData) {
      dispatch({ type: 'SET_CAPABILITIES', payload: customCapabilitiesData });
    }
  }, [customCapabilitiesData]);

  const createCapability = async capability => {
    if (!orgId) {
      toast.error('Organization ID not found');
      return;
    }

    try {
      dispatch({ type: 'SET_UPDATING', payload: true });
      const response = await fetch(`/api/models/organization-methods/organization/${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(capability),
      });
      if (!response.ok) throw new Error('Failed to create capability');
      await mutateCustomCapabilities();
      toast.success('Capability created successfully');
    } catch (error) {
      console.error('Error creating capability:', error);
      toast.error('Failed to create capability');
    } finally {
      dispatch({ type: 'SET_UPDATING', payload: false });
    }
  };

  const updateCapability = async (capabilityId, updatedCapability) => {
    try {
      dispatch({ type: 'SET_UPDATING', payload: true });
      const response = await fetch(`/api/models/organization-methods/${capabilityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCapability),
      });
      if (!response.ok) throw new Error('Failed to update capability');
      await mutateCustomCapabilities();
      toast.success('Capability updated successfully');
    } catch (error) {
      console.error('Error updating capability:', error);
      toast.error('Failed to update capability');
    } finally {
      dispatch({ type: 'SET_UPDATING', payload: false });
    }
  };

  return {
    state,
    dispatch,
    customCapabilitiesError,
    isLoadingCustomCapabilitiesData,
    mutateCustomCapabilities,
    createCapability,
    updateCapability,
  };
};

export default useCustomCapability;
