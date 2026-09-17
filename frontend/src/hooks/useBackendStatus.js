import { useState, useEffect, useCallback } from 'react';
import { nexusApi } from '../services/nexusApi';

/**
 * Hook to continuously monitor Nexus backend connectivity, GPU acceleration,
 * offline model cache, and MongoDB state.
 */
export function useBackendStatus(pollIntervalMs = 25000) {
  const [state, setState] = useState({
    isConnected: false,
    statusText: 'Connecting...',
    device: null,
    modelTier: null,
    mongodbConnected: false,
    loadedModels: [],
    cachedModels: [],
    offlineReady: false,
    languageCount: 0,
    lastChecked: null,
    error: null,
    isLoading: true
  });

  const checkStatus = useCallback(async () => {
    try {
      const [health, models] = await Promise.all([
        nexusApi.checkHealth().catch(() => null),
        nexusApi.getModelsStatus().catch(() => null)
      ]);

      if (health && health.status === 'healthy') {
        setState({
          isConnected: true,
          statusText: 'Online',
          device: health.device || 'cpu',
          modelTier: health.model_tier || 'compact',
          mongodbConnected: Boolean(health.mongodb_connected),
          loadedModels: health.loaded_models || [],
          cachedModels: models?.locally_cached_models || [],
          offlineReady: Boolean(models?.offline_ready),
          languageCount: health.supported_languages_count || 27,
          lastChecked: new Date(),
          error: null,
          isLoading: false
        });
      } else {
        setState(prev => ({
          ...prev,
          isConnected: false,
          statusText: 'Offline (Demo Mode)',
          device: null,
          lastChecked: new Date(),
          error: 'Backend is unreachable',
          isLoading: false
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        statusText: 'Offline (Demo Mode)',
        device: null,
        lastChecked: new Date(),
        error: err.message,
        isLoading: false
      }));
    }
  }, []);

  useEffect(() => {
    checkStatus();
    if (pollIntervalMs > 0) {
      const timer = setInterval(checkStatus, pollIntervalMs);
      return () => clearInterval(timer);
    }
  }, [checkStatus, pollIntervalMs]);

  return {
    ...state,
    recheck: checkStatus
  };
}
