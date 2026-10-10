import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promotionApi } from '../api/promotionApi';
import { apiClient } from '../services/apiClient';

describe('HinchMart Active Video Banner Promotion API (/api/promotions/video/active)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. GET /api/promotions/video/active - returns active video banner data when configured', async () => {
    const mockBackendResponse = {
      success: true,
      message: 'Active promotional video found',
      data: {
        id: 1,
        videoUrl: 'https://cdn.hinchmart.com/banners/promo_steel_showcase.mp4',
        posterUrl: 'https://cdn.hinchmart.com/banners/promo_steel_poster.jpg',
        title: 'Fast 24-Hour Industrial Supply Dispatch',
        subtitle: 'Order certified steel and pipes with real-time tracking directly to your site.',
        badge: '24-HOUR DISPATCH',
        ctaText: 'Explore 24H Catalog',
        targetScreen: '/catalog/24-hour-dispatch',
        isActive: true,
      },
      timestamp: '2026-10-10T17:15:00',
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockBackendResponse,
    } as any);

    const result = await promotionApi.getActiveVideo();

    expect(getSpy).toHaveBeenCalledWith('/promotions/video/active');
    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
    expect(result?.videoUrl).toBe('https://cdn.hinchmart.com/banners/promo_steel_showcase.mp4');
    expect(result?.posterUrl).toBe('https://cdn.hinchmart.com/banners/promo_steel_poster.jpg');
    expect(result?.title).toBe('Fast 24-Hour Industrial Supply Dispatch');
    expect(result?.badge).toBe('24-HOUR DISPATCH');
    expect(result?.ctaText).toBe('Explore 24H Catalog');
    expect(result?.targetScreen).toBe('/catalog/24-hour-dispatch');
    expect(result?.isActive).toBe(true);
  });

  it('2. GET /api/promotions/video/active - returns null when no active video is currently configured', async () => {
    const mockBackendResponse = {
      success: true,
      message: 'No active promotional video available',
      data: null,
      timestamp: '2026-10-10T17:15:00',
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockBackendResponse,
    } as any);

    const result = await promotionApi.getActiveVideo();

    expect(getSpy).toHaveBeenCalledWith('/promotions/video/active');
    expect(result).toBeNull();
  });

  it('3. GET /api/promotions/video/active - returns null gracefully on network failure or 500 error', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Network error'));

    const result = await promotionApi.getActiveVideo();

    expect(result).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
});
