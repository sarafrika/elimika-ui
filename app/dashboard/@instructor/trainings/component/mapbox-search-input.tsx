import { SearchBox } from '@mapbox/search-js-react';

interface Props {
  onSelect: (place: { name: string; latitude: number; longitude: number }) => void;
}

export default function MapboxSearchInput({ onSelect }: Props) {
  return (
    <div className='w-full'>
      {/*  @ts-ignore */}
      <SearchBox
        accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN!}
        placeholder='Search for a location'
        onRetrieve={res => {
          const feature = res.features?.[0];
          const [lng, lat] = feature.geometry.coordinates;
          const name = feature?.properties?.full_address;

          onSelect({
            name: name || 'Unknown location',
            latitude: lat,
            longitude: lng,
          });
        }}
        // @ts-ignore
        className='rounded-md border p-2'
      />
    </div>
  );
}
