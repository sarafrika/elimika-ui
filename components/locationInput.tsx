import { GeocoderProps } from '@mapbox/search-js-react/dist/components/Geocoder';
import dynamic from 'next/dynamic';
import { ForwardRefExoticComponent, RefAttributes } from 'react';
const Geocoder = dynamic(
  () =>
    import('@mapbox/search-js-react').then(mod => mod.Geocoder) as Promise<
      ForwardRefExoticComponent<GeocoderProps & RefAttributes<unknown>>
    >,
  { ssr: false }
);

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;
export default function LocationInput({ ...props }: Omit<GeocoderProps, 'accessToken'>) {
  return (
    <Geocoder
      {...props}
      accessToken={mapboxToken}
      options={{
        language: 'en',
      }}
    />
  );
}
