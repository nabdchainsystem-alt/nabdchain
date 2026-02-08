import React, { useState, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, MagnifyingGlass, NavigationArrow, Copy, Check } from 'phosphor-react';
import { useLanguage } from '../../../../../../contexts/LanguageContext';
import { boardLogger } from '@/utils/logger';

// =============================================================================
// LOCATION PICKER - PLACEHOLDER COMPONENT
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

export interface LocationValue {
  address: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  city?: string;
  country?: string;
}

interface LocationPickerProps {
  value: LocationValue | null;
  onSelect: (value: LocationValue | null) => void;
  onClose: () => void;
  triggerRect?: DOMRect;
}

// Sample locations for demo (would be replaced with actual geocoding API)
const SAMPLE_LOCATIONS = [
  { address: 'New York, NY, USA', city: 'New York', country: 'USA', lat: 40.7128, lng: -74.006 },
  { address: 'London, UK', city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { address: 'Tokyo, Japan', city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { address: 'Paris, France', city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { address: 'Sydney, Australia', city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
];

export const LocationPicker: React.FC<LocationPickerProps> = memo(({ value, onSelect, onClose, triggerRect }) => {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const MENU_WIDTH = 320;
  const MENU_HEIGHT = 400;
  const PADDING = 16;

  const positionStyle = useMemo(() => {
    if (!triggerRect) return { position: 'fixed' as const, display: 'none' };

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const spaceBelow = windowHeight - triggerRect.bottom;
    const wouldOverflowRight = triggerRect.left + MENU_WIDTH > windowWidth - PADDING;

    let left: number | undefined;
    let right: number | undefined;

    if (wouldOverflowRight) {
      right = PADDING;
    } else {
      left = Math.max(PADDING, triggerRect.left);
    }

    const openUp = spaceBelow < MENU_HEIGHT + PADDING && triggerRect.top > spaceBelow;

    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      width: MENU_WIDTH,
    };

    if (openUp) {
      return {
        ...baseStyle,
        bottom: windowHeight - triggerRect.top + 4,
        ...(isRtl
          ? right !== undefined
            ? { right: PADDING }
            : { left: PADDING }
          : left !== undefined
            ? { left }
            : { right }),
      };
    }
    return {
      ...baseStyle,
      top: triggerRect.bottom + 4,
      ...(isRtl
        ? right !== undefined
          ? { right: PADDING }
          : { left: PADDING }
        : left !== undefined
          ? { left }
          : { right }),
    };
  }, [triggerRect, isRtl]);

  const filteredLocations = searchQuery
    ? SAMPLE_LOCATIONS.filter(
        (loc) =>
          loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.city.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : SAMPLE_LOCATIONS;

  const handleSelectLocation = (location: (typeof SAMPLE_LOCATIONS)[0]) => {
    onSelect({
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      city: location.city,
      country: location.country,
    });
    onClose();
  };

  const handleManualEntry = () => {
    if (searchQuery.trim()) {
      // Future: geocode address to lat/lng via a maps API
      boardLogger.debug('[Location] Manual address entry (no geocoding)', { searchQuery });
      onSelect({
        address: searchQuery,
      });
      onClose();
    }
  };

  const handleCopyCoordinates = async () => {
    if (value?.lat && value?.lng) {
      await navigator.clipboard.writeText(`${value.lat}, ${value.lng}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenInMaps = () => {
    if (value?.lat && value?.lng) {
      window.open(`https://www.google.com/maps?q=${value.lat},${value.lng}`, '_blank', 'noopener,noreferrer');
    } else if (value?.address) {
      window.open(
        `https://www.google.com/maps/search/${encodeURIComponent(value.address)}`,
        '_blank',
        'noopener,noreferrer',
      );
    }
  };

  const content = (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
        style={positionStyle}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
          <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span
              className={`text-xs font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <MapPin size={14} />
              {t('location')}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
              BETA
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-stone-100 dark:border-stone-800">
          <div className="relative">
            <MagnifyingGlass
              size={14}
              className={`absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 text-stone-400`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_locations')}
              className={`w-full ${isRtl ? 'pr-8 pl-3 text-right' : 'pl-8 pr-3'} py-2 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800`}
              autoFocus
            />
          </div>
        </div>

        {/* Current Value */}
        {value && (
          <div className="p-3 border-b border-stone-100 dark:border-stone-800 bg-blue-50 dark:bg-blue-900/20">
            <div
              className={`text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase mb-1 ${isRtl ? 'text-right' : ''}`}
            >
              {t('current_location')}
            </div>
            <div className={`text-sm text-stone-700 dark:text-stone-300 font-medium ${isRtl ? 'text-right' : ''}`}>
              {value.address}
            </div>
            {value.lat && value.lng && (
              <div className={`text-xs text-stone-500 mt-1 font-mono ${isRtl ? 'text-right' : ''}`}>
                {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
              </div>
            )}
            <div className={`flex gap-2 mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={handleOpenInMaps}
                className={`flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                <NavigationArrow size={12} />
                {t('open_in_maps')}
              </button>
              {value.lat && value.lng && (
                <button
                  onClick={handleCopyCoordinates}
                  className={`flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  {copied ? t('copied') : t('copy_coordinates')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Map Placeholder */}
        <div className="h-32 bg-stone-100 dark:bg-stone-800 flex items-center justify-center border-b border-stone-200 dark:border-stone-700">
          <div className="text-center">
            <MapPin size={32} className="mx-auto text-stone-400 mb-1" />
            <span className="text-xs text-stone-400">{t('map_view_coming_soon') || 'Map view coming soon'}</span>
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex-1 overflow-y-auto max-h-[150px]">
          <div className={`px-3 py-2 text-[10px] font-medium text-stone-500 uppercase ${isRtl ? 'text-right' : ''}`}>
            {searchQuery ? t('search_results') : t('suggestions')}
          </div>
          <div className="px-2 pb-2 space-y-1">
            {filteredLocations.map((location, index) => (
              <button
                key={index}
                onClick={() => handleSelectLocation(location)}
                className={`w-full flex items-start gap-2 px-2 py-2 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-lg transition-colors ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
              >
                <MapPin size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm text-stone-700 dark:text-stone-300">{location.address}</div>
                  <div className="text-[10px] text-stone-400">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                </div>
              </button>
            ))}
            {searchQuery && filteredLocations.length === 0 && (
              <button
                onClick={handleManualEntry}
                className={`w-full flex items-center gap-2 px-2 py-2 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-lg transition-colors ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
              >
                <MapPin size={14} className="text-stone-400 flex-shrink-0" />
                <div>
                  <div className="text-sm text-stone-700 dark:text-stone-300">
                    {t('use')} "{searchQuery}"
                  </div>
                  <div className="text-[10px] text-stone-400">{t('add_as_custom_location')}</div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Clear Button */}
        <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            className="w-full py-1.5 text-xs text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            {t('clear_cell')}
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
});

// Inline display for table cells
export const LocationDisplay: React.FC<{
  value: LocationValue | null;
  onClick?: () => void;
}> = memo(({ value, onClick, showIcon = true }) => {
  const { t, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  if (!value) {
    return (
      <button
        onClick={onClick}
        className={`text-stone-400 hover:text-stone-600 text-sm ${isRtl ? 'text-right w-full' : ''}`}
      >
        + {t('location')}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-sm text-stone-600 dark:text-stone-400 hover:text-blue-500 truncate max-w-[200px] ${isRtl ? 'flex-row-reverse' : ''}`}
    >
      {showIcon && <MapPin size={12} className="text-red-500 flex-shrink-0" />}
      <span className="truncate">{value.city || value.address}</span>
    </button>
  );
});

export default LocationPicker;
