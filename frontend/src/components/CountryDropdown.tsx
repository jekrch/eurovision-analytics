import React, { useState } from 'react';
import classNames from 'classnames'

interface Country {
  id: string;
  name: string;
}

interface CountryDropdownProps {
  countries: Country[];
  selectedCountry: string;
  onCountryChange: (countryName: string) => void;
  className: string;
}

const CountryDropdown: React.FC<CountryDropdownProps> = ({ countries, selectedCountry, onCountryChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCountryChange = (countryName: string) => {
    onCountryChange(countryName);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={classNames(className)}>
      <button
        id="country-select"
        className="text-white shadow-sm bg-slate-600 hover:bg-slate-700 focus:ring-4 focus:outline-none focus:ring-slate-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-slate-500 dark:hover:bg-slate-500 dark:focus:ring-slate-600"
        type="button"
        onClick={toggleDropdown}
      >
        {selectedCountry}
        <svg
          className={`w-2.5 h-2.5 ml-3 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 10 6"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m1 1 4 4 4-4"
          />
        </svg>
      </button>

      <div
        id="dropdown"
        className={`z-10 absolute top-12 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-slate-500 ${
          isOpen ? 'block' : 'hidden'
        } max-h-60 overflow-y-auto`}
      >
        <ul
          className="py-2 text-sm text-gray-700 dark:text-gray-200"
          aria-labelledby="country-select"
        >
          {countries.map((country) => (
            <li key={country.name}>
              <a
                href="#"
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                onClick={() => handleCountryChange(country.name)}
              >
                {country.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CountryDropdown;