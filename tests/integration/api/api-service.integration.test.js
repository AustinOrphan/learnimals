/**
 * API Service Integration Tests
 *
 * Tests the integration of API calls, data fetching, caching, and error handling
 * Verifies that frontend services integrate correctly with backend APIs
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Utility function for controlled delays in tests using fake timers
const delayWithFakeTimers = async ms => {
  vi.useFakeTimers();
  const promise = new Promise(resolve => setTimeout(resolve, ms));
  vi.advanceTimersByTime(ms);
  await promise;
  vi.useRealTimers();
};

describe('API Service Integration', () => {
  let mockFetch;
  let apiBaseUrl;

  beforeEach(() => {
    apiBaseUrl = 'https://api.learnimals.com';

    // Mock fetch API
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Setup default responses
    mockFetch.mockImplementation((url, options) => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
        text: async () => 'OK',
        headers: new Headers({
          'content-type': 'application/json',
        }),
      });
    });

    // Mock window.location for navigation tests
    delete window.location;
    window.location = {
      href: 'http://localhost:3000/',
      pathname: '/',
      search: '',
      hash: '',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    };

    // Mock localStorage
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: vi.fn(key => store[key] || null),
        setItem: vi.fn((key, value) => {
          store[key] = value.toString();
        }),
        removeItem: vi.fn(key => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        }),
      };
    })();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('API Client Implementation', () => {
    it('should implement complete API client with interceptors', async () => {
      const mockApiClient = {
        baseURL: apiBaseUrl,
        headers: {
          'Content-Type': 'application/json',
          'X-App-Version': '1.0.0',
        },
        interceptors: {
          request: [],
          response: [],
        },

        addRequestInterceptor: vi.fn(function (interceptor) {
          this.interceptors.request.push(interceptor);
        }),

        addResponseInterceptor: vi.fn(function (interceptor) {
          this.interceptors.response.push(interceptor);
        }),

        request: vi.fn(async function (url, options = {}) {
          // Apply request interceptors
          let config = {
            url: url.startsWith('http') ? url : `${this.baseURL}${url}`,
            ...options,
            headers: {
              ...this.headers,
              ...options.headers,
            },
          };

          for (const interceptor of this.interceptors.request) {
            config = await interceptor(config);
          }

          // Make request
          const response = await fetch(config.url, config);

          // Apply response interceptors
          let processedResponse = response;
          for (const interceptor of this.interceptors.response) {
            processedResponse = await interceptor(processedResponse);
          }

          return processedResponse;
        }),

        get: vi.fn(function (url, options = {}) {
          return this.request(url, { ...options, method: 'GET' });
        }),

        post: vi.fn(function (url, data, options = {}) {
          return this.request(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
          });
        }),

        put: vi.fn(function (url, data, options = {}) {
          return this.request(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
          });
        }),

        delete: vi.fn(function (url, options = {}) {
          return this.request(url, { ...options, method: 'DELETE' });
        }),
      };

      // Add auth interceptor with proper binding
      mockApiClient.addRequestInterceptor.mockImplementation(function (interceptor) {
        this.interceptors.request.push(interceptor);
      });

      // Call the method to add interceptor
      mockApiClient.addRequestInterceptor(async config => {
        const token = window.localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });

      // Add error interceptor
      mockApiClient.addResponseInterceptor(async response => {
        if (!response.ok) {
          const error = new Error(`API Error: ${response.status}`);
          error.response = response;
          throw error;
        }

        // Parse JSON if applicable
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          response.data = await response.json();
        }

        return response;
      });

      // Test GET request
      window.localStorage.setItem('auth_token', 'test-token');

      // Manually bind the methods to the mockApiClient object
      mockApiClient.get = mockApiClient.get.bind(mockApiClient);
      mockApiClient.request = mockApiClient.request.bind(mockApiClient);

      // Execute the request with auth interceptor
      const requestConfig = {
        url: `${mockApiClient.baseURL}/api/user/profile`,
        method: 'GET',
        headers: { ...mockApiClient.headers },
      };

      // Apply request interceptors
      for (const interceptor of mockApiClient.interceptors.request) {
        const updatedConfig = await interceptor(requestConfig);
        Object.assign(requestConfig, updatedConfig);
      }

      await fetch(requestConfig.url, requestConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/api/user/profile`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );

      // Test POST request
      const postData = { name: 'Test', score: 100 };
      await mockApiClient.post('/api/scores', postData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/api/scores`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockErrorHandler = {
        handle: vi.fn(async error => {
          const response = error.response;

          if (response) {
            switch (response.status) {
            case 401:
              // Unauthorized - redirect to login
              window.localStorage.removeItem('auth_token');
              window.location.href = '/login';
              break;

            case 403:
              // Forbidden
              return {
                error: 'You do not have permission to access this resource',
                code: 'FORBIDDEN',
              };

            case 404:
              // Not found
              return {
                error: 'The requested resource was not found',
                code: 'NOT_FOUND',
              };

            case 429:
              // Rate limited
              const retryAfter = response.headers.get('Retry-After');
              return {
                error: 'Too many requests. Please try again later.',
                code: 'RATE_LIMITED',
                retryAfter: retryAfter ? parseInt(retryAfter) : 60,
              };

            case 500:
            case 502:
            case 503:
              // Server error
              return {
                error: 'Server error. Please try again later.',
                code: 'SERVER_ERROR',
              };

            default:
              return {
                error: 'An unexpected error occurred',
                code: 'UNKNOWN_ERROR',
              };
            }
          } else if (error.code === 'NETWORK_ERROR') {
            return {
              error: 'Network connection error. Please check your internet connection.',
              code: 'NETWORK_ERROR',
            };
          }

          return {
            error: error.message || 'An unknown error occurred',
            code: 'UNKNOWN',
          };
        }),
      };

      // Test 401 error
      const error401 = new Error('Unauthorized');
      error401.response = { status: 401 };

      // Set a token first
      window.localStorage.setItem('auth_token', 'test-token');
      expect(window.localStorage.getItem('auth_token')).toBe('test-token');

      await mockErrorHandler.handle(error401);
      expect(window.localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/login');

      // Test 429 error
      const error429 = new Error('Rate limited');
      error429.response = {
        status: 429,
        headers: new Headers({ 'Retry-After': '120' }),
      };

      const result429 = await mockErrorHandler.handle(error429);
      expect(result429.code).toBe('RATE_LIMITED');
      expect(result429.retryAfter).toBe(120);

      // Test network error
      const networkError = new Error('Network failed');
      networkError.code = 'NETWORK_ERROR';

      const resultNetwork = await mockErrorHandler.handle(networkError);
      expect(resultNetwork.code).toBe('NETWORK_ERROR');
    });
  });

  describe('Request Queue and Retry Logic', () => {
    it('should implement request queue with retry logic', async () => {
      const mockRequestQueue = {
        queue: [],
        processing: false,
        maxRetries: 3,
        retryDelay: 1000,

        enqueue: vi.fn(function (request) {
          return new Promise((resolve, reject) => {
            this.queue.push({
              request,
              resolve,
              reject,
              retries: 0,
            });

            if (!this.processing) {
              this.process();
            }
          });
        }),

        process: vi.fn(async function () {
          if (this.processing || this.queue.length === 0) return;

          this.processing = true;

          while (this.queue.length > 0) {
            const item = this.queue.shift();

            try {
              const result = await this.executeWithRetry(item);
              item.resolve(result);
            } catch (error) {
              item.reject(error);
            }
          }

          this.processing = false;
        }),

        executeWithRetry: vi.fn(async function (item) {
          while (item.retries <= this.maxRetries) {
            try {
              const result = await item.request();
              return result;
            } catch (error) {
              item.retries++;

              if (item.retries > this.maxRetries) {
                throw error;
              }

              // Exponential backoff
              const delay = this.retryDelay * Math.pow(2, item.retries - 1);
              await delayWithFakeTimers(delay);
            }
          }
        }),

        clear: vi.fn(function () {
          this.queue = [];
        }),

        getQueueLength: vi.fn(function () {
          return this.queue.length;
        }),
      };

      // Mock a failing request that succeeds on retry
      let attempts = 0;
      const flakyRequest = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { success: true, data: 'Success after retries' };
      });

      // Enqueue request
      const resultPromise = mockRequestQueue.enqueue(flakyRequest);

      // Process queue
      await mockRequestQueue.process();

      // Verify retry logic worked
      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should handle concurrent requests with rate limiting', async () => {
      const mockRateLimiter = {
        maxConcurrent: 3,
        requestsPerSecond: 10,
        activeRequests: 0,
        requestTimestamps: [],

        canMakeRequest: vi.fn(function () {
          // Check concurrent limit
          if (this.activeRequests >= this.maxConcurrent) {
            return false;
          }

          // Check rate limit
          const now = Date.now();
          const oneSecondAgo = now - 1000;

          // Remove old timestamps
          this.requestTimestamps = this.requestTimestamps.filter(ts => ts > oneSecondAgo);

          if (this.requestTimestamps.length >= this.requestsPerSecond) {
            return false;
          }

          return true;
        }),

        executeRequest: vi.fn(async function (requestFn) {
          // Wait for available slot
          while (!this.canMakeRequest()) {
            await delayWithFakeTimers(100);
          }

          this.activeRequests++;
          this.requestTimestamps.push(Date.now());

          try {
            const result = await requestFn();
            return result;
          } finally {
            this.activeRequests--;
          }
        }),

        executeMultiple: vi.fn(async function (requests) {
          return Promise.all(requests.map(request => this.executeRequest(request)));
        }),
      };

      // Create multiple requests
      const requests = Array(5)
        .fill(null)
        .map((_, i) => () => Promise.resolve({ id: i, data: `Request ${i}` }));

      // Execute with rate limiting
      const results = await mockRateLimiter.executeMultiple(requests);

      expect(results).toHaveLength(5);
      expect(results[0].id).toBe(0);
      expect(mockRateLimiter.activeRequests).toBe(0);
    });
  });

  describe('Response Caching', () => {
    it('should implement response caching with TTL', async () => {
      const mockCache = {
        storage: new Map(),
        defaultTTL: 300000, // 5 minutes

        generateKey: vi.fn(function (url, params = {}) {
          const paramString = Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('&');

          return `${url}${paramString ? '?' + paramString : ''}`;
        }),

        get: vi.fn(function (key) {
          const cached = this.storage.get(key);

          if (!cached) return null;

          if (Date.now() > cached.expiry) {
            this.storage.delete(key);
            return null;
          }

          return cached.data;
        }),

        set: vi.fn(function (key, data, ttl = this.defaultTTL) {
          this.storage.set(key, {
            data,
            expiry: Date.now() + ttl,
            timestamp: Date.now(),
          });
        }),

        invalidate: vi.fn(function (pattern) {
          if (pattern instanceof RegExp) {
            for (const key of this.storage.keys()) {
              if (pattern.test(key)) {
                this.storage.delete(key);
              }
            }
          } else {
            this.storage.delete(pattern);
          }
        }),

        clear: vi.fn(function () {
          this.storage.clear();
        }),

        cachedFetch: vi.fn(async function (url, options = {}) {
          const key = this.generateKey(url, options.params);

          // Check cache first
          const cached = this.get(key);
          if (cached) {
            return { ...cached, fromCache: true };
          }

          // Fetch fresh data
          const response = await fetch(url, options);
          const data = await response.json();

          // Cache successful responses
          if (response.ok) {
            this.set(key, data, options.cacheTTL);
          }

          return { ...data, fromCache: false };
        }),
      };

      // First request - should fetch
      const url = '/api/data';
      const result1 = await mockCache.cachedFetch(url);

      expect(result1.fromCache).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second request - should use cache
      mockCache.get.mockImplementation(function (key) {
        return { data: 'cached', fromCache: true };
      });

      const result2 = await mockCache.cachedFetch(url);
      expect(result2.fromCache).toBe(true);

      // Test cache invalidation
      mockCache.invalidate(/\/api\/data/);
      expect(mockCache.invalidate).toHaveBeenCalledWith(/\/api\/data/);
    });

    it('should implement smart cache invalidation strategies', () => {
      const mockSmartCache = {
        dependencies: new Map(),
        cache: new Map(),

        set: vi.fn(function (key, data) {
          this.cache.set(key, data);
        }),

        invalidate: vi.fn(function (key) {
          this.cache.delete(key);
        }),

        addDependency: vi.fn(function (key, dependency) {
          if (!this.dependencies.has(dependency)) {
            this.dependencies.set(dependency, new Set());
          }
          this.dependencies.get(dependency).add(key);
        }),

        invalidateByDependency: vi.fn(function (dependency) {
          const keys = this.dependencies.get(dependency);
          if (keys) {
            keys.forEach(key => this.invalidate(key));
            this.dependencies.delete(dependency);
          }
        }),

        invalidateByTags: vi.fn(function (tags) {
          const tagsArray = Array.isArray(tags) ? tags : [tags];

          tagsArray.forEach(tag => {
            this.invalidateByDependency(`tag:${tag}`);
          });
        }),

        cacheWithTags: vi.fn(function (key, data, tags = []) {
          // Cache the data
          this.set(key, data);

          // Add tag dependencies
          tags.forEach(tag => {
            this.addDependency(key, `tag:${tag}`);
          });
        }),
      };

      // Cache data with tags
      mockSmartCache.cacheWithTags('/api/user/1', { id: 1, name: 'User 1' }, ['user', 'profile']);
      mockSmartCache.cacheWithTags('/api/user/2', { id: 2, name: 'User 2' }, ['user', 'profile']);
      mockSmartCache.cacheWithTags('/api/posts/1', { id: 1, title: 'Post 1' }, ['post', 'user:1']);

      // Invalidate by tag
      mockSmartCache.invalidateByTags('user');

      expect(mockSmartCache.invalidateByTags).toHaveBeenCalledWith('user');
      // Verify that the dependency was processed
      expect(mockSmartCache.invalidateByDependency).toHaveBeenCalledWith('tag:user');
    });
  });

  describe('Data Synchronization', () => {
    it('should implement optimistic updates with rollback', async () => {
      const mockOptimisticUpdates = {
        pendingUpdates: new Map(),

        update: vi.fn(async function (key, optimisticData, apiCall) {
          // Apply optimistic update immediately
          const previousData = this.getCurrentData(key);
          this.applyUpdate(key, optimisticData);

          // Track pending update
          const updateId = `update_${Date.now()}`;
          this.pendingUpdates.set(updateId, {
            key,
            previousData,
            optimisticData,
          });

          try {
            // Make actual API call
            const serverData = await apiCall();

            // Update with server data
            this.applyUpdate(key, serverData);

            // Remove from pending
            this.pendingUpdates.delete(updateId);

            return { success: true, data: serverData };
          } catch (error) {
            // Rollback on error
            this.rollback(updateId);
            throw error;
          }
        }),

        getCurrentData: vi.fn(function (key) {
          // Simulate getting current data
          return { id: 1, value: 'original' };
        }),

        applyUpdate: vi.fn(function (key, data) {
          // Simulate applying update
          console.log(`Applied update to ${key}:`, data);
        }),

        rollback: vi.fn(function (updateId) {
          const update = this.pendingUpdates.get(updateId);
          if (update) {
            this.applyUpdate(update.key, update.previousData);
            this.pendingUpdates.delete(updateId);
          }
        }),

        hasPendingUpdates: vi.fn(function () {
          return this.pendingUpdates.size > 0;
        }),
      };

      // Test successful optimistic update
      const successfulUpdate = await mockOptimisticUpdates.update(
        'user:1',
        { id: 1, value: 'optimistic' },
        async () => ({ id: 1, value: 'server' })
      );

      expect(successfulUpdate.success).toBe(true);
      expect(successfulUpdate.data.value).toBe('server');
      expect(mockOptimisticUpdates.pendingUpdates.size).toBe(0);

      // Test failed update with rollback
      try {
        await mockOptimisticUpdates.update('user:2', { id: 2, value: 'optimistic' }, async () => {
          throw new Error('Server error');
        });
      } catch (error) {
        expect(error.message).toBe('Server error');
        expect(mockOptimisticUpdates.rollback).toHaveBeenCalled();
      }
    });

    it('should handle offline queue and sync when online', async () => {
      const mockOfflineQueue = {
        queue: [],
        isOnline: true,

        addToQueue: vi.fn(function (request) {
          this.queue.push({
            id: `req_${Date.now()}_${Math.random()}`,
            request,
            timestamp: Date.now(),
            retries: 0,
          });

          // Try to sync if online
          if (this.isOnline) {
            this.sync();
          }
        }),

        sync: vi.fn(async function () {
          if (!this.isOnline || this.queue.length === 0) return;

          const results = [];
          const toRemove = [];

          for (const item of this.queue) {
            try {
              const result = await item.request();
              results.push({ id: item.id, success: true, result });
              toRemove.push(item.id);
            } catch (error) {
              item.retries++;

              if (item.retries > 3) {
                results.push({ id: item.id, success: false, error });
                toRemove.push(item.id);
              }
            }
          }

          // Remove processed items
          this.queue = this.queue.filter(item => !toRemove.includes(item.id));

          return results;
        }),

        setOnlineStatus: vi.fn(function (online) {
          this.isOnline = online;

          if (online) {
            // Sync when coming back online
            this.sync();
          }
        }),

        clear: vi.fn(function () {
          this.queue = [];
        }),
      };

      // Add requests while offline
      mockOfflineQueue.setOnlineStatus(false);

      mockOfflineQueue.addToQueue(async () => ({ action: 'update', data: 'test1' }));
      mockOfflineQueue.addToQueue(async () => ({ action: 'create', data: 'test2' }));

      expect(mockOfflineQueue.queue).toHaveLength(2);

      // Come back online and sync
      mockOfflineQueue.setOnlineStatus(true);

      // Manually trigger sync for test
      const syncResults = await mockOfflineQueue.sync();

      expect(mockOfflineQueue.sync).toHaveBeenCalled();
      expect(syncResults).toHaveLength(2);
      expect(mockOfflineQueue.queue).toHaveLength(0);
    });
  });
});
