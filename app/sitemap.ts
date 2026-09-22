/* eslint-disable @typescript-eslint/consistent-type-imports */
import { MetadataRoute } from 'next';
import { featureFlags } from '@/lib/feature-flags';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://centurypadelid.com';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${baseUrl}/booking`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9
    },
    {
      url: `${baseUrl}/membership`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8
    },
    ...(featureFlags.tournaments
      ? [
          {
            url: `${baseUrl}/tournaments`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.5
          }
        ]
      : [])
  ];
}
