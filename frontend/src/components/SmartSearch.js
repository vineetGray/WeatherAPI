import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './SmartSearch.css';

const SmartSearch = ({ onLocationSelect, loading }) => {
  const [searchType, setSearchType] = useState('city'); // 'city', 'country', 'coordinates'
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);

  // Popular countries for quick selection
  const popularCountries = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'CN', name: 'China', flag: '🇨🇳' }
  ];

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('recentWeatherSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Fetch suggestions based on search type
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        let endpoint = '';
        let params = {};

        if (searchType === 'city') {
          endpoint = '/api/suggestions';
          params = { query: `${query}${country ? ',' + country : ''}${state ? ',' + state : ''}` };
        }

        const response = await axios.get(`http://localhost:5000${endpoint}`, { params });
        
        if (searchType === 'city') {
          setSuggestions(response.data);
        }
        
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query, searchType, country, state]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion) => {
    if (searchType === 'city') {
      setCity(suggestion.name);
      setCountry(suggestion.country);
      setState(suggestion.state || '');
      setQuery(suggestion.displayName);
    }
    setShowSuggestions(false);
  };

  const handleCountrySelect = (countryObj) => {
    setCountry(countryObj.code);
    setQuery('');
    setCity('');
    setState('');
    setSearchType('city');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (searchType === 'city' && city) {
      const location = {
        name: city,
        country: country,
        state: state,
        displayName: `${city}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`
      };
      onLocationSelect(location);
      saveToRecentSearches(location);
    } else if (searchType === 'coordinates' && query) {
      // Handle coordinate search (e.g., "40.7128,-74.0060")
      const [lat, lon] = query.split(',').map(coord => coord.trim());
      if (lat && lon) {
        onLocationSelect({ lat: parseFloat(lat), lon: parseFloat(lon) });
      }
    } else if (query) {
      // General search
      onLocationSelect({ name: query });
      saveToRecentSearches({ displayName: query });
    }
  };

  const saveToRecentSearches = (location) => {
    const newSearch = {
      name: location.displayName || `${location.city || location.name}, ${location.country || ''}`,
      timestamp: new Date().toISOString(),
      type: searchType
    };
    
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.name !== newSearch.name);
      const updated = [newSearch, ...filtered].slice(0, 6);
      localStorage.setItem('recentWeatherSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearSearch = () => {
    setQuery('');
    setCity('');
    setState('');
    setCountry('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleRecentSearchClick = (search) => {
    setQuery(search.name);
    setShowSuggestions(false);
    onLocationSelect({ name: search.name });
  };

  const getPlaceholder = () => {
    switch (searchType) {
      case 'city':
        return `Enter city name${country ? ' in ' + popularCountries.find(c => c.code === country)?.name : ''}...`;
      case 'coordinates':
        return 'Enter coordinates (e.g., 40.7128,-74.0060)...';
      default:
        return 'Search for any location...';
    }
  };

  return (
    <div className="smart-search-container" ref={searchRef}>
      {/* Search Type Selector */}
      <div className="search-type-selector">
        <button
          className={`search-type-btn ${searchType === 'city' ? 'active' : ''}`}
          onClick={() => setSearchType('city')}
        >
          🌆 City Search
        </button>
        <button
          className={`search-type-btn ${searchType === 'coordinates' ? 'active' : ''}`}
          onClick={() => setSearchType('coordinates')}
        >
          📍 Coordinates
        </button>
      </div>

      {/* Country Quick Select */}
      {searchType === 'city' && (
        <div className="country-selector">
          <div className="selector-label">Quick Country Select:</div>
          <div className="country-buttons">
            {popularCountries.map(countryObj => (
              <button
                key={countryObj.code}
                className={`country-btn ${country === countryObj.code ? 'active' : ''}`}
                onClick={() => handleCountrySelect(countryObj)}
              >
                {countryObj.flag} {countryObj.code}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Form */}
      <form onSubmit={handleSearch} className="smart-search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={getPlaceholder()}
            className="smart-search-input"
            onFocus={() => setShowSuggestions(true)}
          />
          
          {query && (
            <button type="button" onClick={clearSearch} className="clear-button">
              ✕
            </button>
          )}
          
          <button 
            type="submit" 
            disabled={loading || !query.trim()} 
            className="search-submit-btn"
          >
            {loading ? '⏳' : '🔍'} Search
          </button>
        </div>

        {/* Selected Location Display */}
        {(city || country) && searchType === 'city' && (
          <div className="selected-location">
            <span className="selected-label">Searching in: </span>
            {city && <span className="location-tag">{city}</span>}
            {state && <span className="location-tag">{state}</span>}
            {country && (
              <span className="location-tag">
                {popularCountries.find(c => c.code === country)?.flag} {country}
              </span>
            )}
          </div>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
        <div className="suggestions-panel">
          {/* Recent Searches */}
          {recentSearches.length > 0 && query.length === 0 && (
            <div className="suggestions-section">
              <div className="section-header">
                <span>🕒 Recent Searches</span>
                <button 
                  onClick={() => setRecentSearches([])} 
                  className="clear-history-btn"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <div
                  key={index}
                  className="suggestion-item recent-item"
                  onClick={() => handleRecentSearchClick(search)}
                >
                  <div className="suggestion-icon">
                    {search.type === 'coordinates' ? '📍' : '🌆'}
                  </div>
                  <div className="suggestion-content">
                    <div className="suggestion-name">{search.name}</div>
                    <div className="suggestion-time">
                      {new Date(search.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="suggestions-section">
              <div className="section-header">
                📍 Matching Locations
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="suggestion-icon">🏙️</div>
                  <div className="suggestion-content">
                    <div className="suggestion-name">{suggestion.name}</div>
                    <div className="suggestion-location">
                      {suggestion.state && `${suggestion.state}, `}{suggestion.country}
                    </div>
                  </div>
                  <div className="suggestion-coordinates">
                    {suggestion.lat?.toFixed(2)}, {suggestion.lon?.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search Tips */}
          {query.length > 0 && suggestions.length === 0 && (
            <div className="search-tips">
              <div className="tips-header">💡 Search Tips:</div>
              <div className="tip-item">• Try different spellings</div>
              <div className="tip-item">• Use format: "City, Country"</div>
              <div className="tip-item">• Or use coordinates: "lat,lon"</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;