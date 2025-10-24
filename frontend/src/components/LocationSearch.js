import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LocationSearch.css';

const API_BASE_URL = 'https://weatherapi-t7rv.onrender.com/api';

const LocationSearch = ({ onLocationSelect, loading }) => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Load countries when component starts
  useEffect(() => {
    const getCountries = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/countries`);
        setCountries(response.data);
      } catch (error) {
        console.log('Error loading countries');
      }
    };
    getCountries();
  }, []);

  // Load states when country is selected
  useEffect(() => {
    const getStates = async () => {
      if (selectedCountry) {
        try {
          const response = await axios.get(`${API_BASE_URL}/states/${selectedCountry}`);
          setStates(response.data);
          setSelectedState('');
          setCities([]);
          setSelectedCity('');
        } catch (error) {
          setStates([]);
        }
      } else {
        setStates([]);
      }
    };
    getStates();
  }, [selectedCountry]);

  // Load cities when state is selected
  useEffect(() => {
    const getCities = async () => {
      if (selectedCountry && selectedState) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/cities/${selectedCountry}/${selectedState}`
          );
          setCities(response.data);
          setSelectedCity('');
        } catch (error) {
          setCities([]);
        }
      } else {
        setCities([]);
      }
    };
    getCities();
  }, [selectedCountry, selectedState]);

  const handleCountryChange = (e) => {
    setSelectedCountry(e.target.value);
  };

  const handleStateChange = (e) => {
    setSelectedState(e.target.value);
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    if (city) {
      onLocationSelect({ name: city });
    }
  };

  const resetSearch = () => {
    setSelectedCountry('');
    setSelectedState('');
    setSelectedCity('');
    setStates([]);
    setCities([]);
  };

  return (
    <div className="location-search">
      <div className="search-header">
        <h3>Find Weather by Location</h3>
        <button onClick={resetSearch} className="reset-btn">
          Reset
        </button>
      </div>

      <div className="dropdowns-container">
        <div className="dropdown-group">
          <label>Select Country</label>
          <select 
            value={selectedCountry} 
            onChange={handleCountryChange}
            className="location-dropdown"
          >
            <option value="">Choose a country</option>
            {countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="dropdown-group">
          <label>Select State</label>
          <select 
            value={selectedState} 
            onChange={handleStateChange}
            disabled={!selectedCountry}
            className="location-dropdown"
          >
            <option value="">Choose a state</option>
            {states.map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div className="dropdown-group">
          <label>Select City</label>
          <select 
            value={selectedCity} 
            onChange={handleCityChange}
            disabled={!selectedState}
            className="location-dropdown"
          >
            <option value="">Choose a city</option>
            {cities.map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCity && (
        <div className="selected-location">
          <span>Selected: </span>
          <span className="location-text">
            {selectedCity}, {selectedState}, {countries.find(c => c.code === selectedCountry)?.name}
          </span>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;