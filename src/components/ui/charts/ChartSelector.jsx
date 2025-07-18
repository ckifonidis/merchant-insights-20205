import React from 'react';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import { CHART_CONFIG } from '../../../utils/constants';
import { getAvailableTimelines } from '../../../utils/timelineHelpers';

/**
 * Reusable chart selector component for chart type and timeline selection
 * Consolidates the repeated Select component patterns
 */
const ChartSelector = ({
  type = 'chartType', // 'chartType' or 'timeline'
  value,
  onChange,
  options, // Custom options override
  className = '',
  placeholder,
  isDisabled = false,
  size = 'sm', // 'sm', 'md', 'lg'
  availableOptions = null, // NEW: Filter available options (for timeline filtering)
  dateRange = null // NEW: Date range for timeline availability calculation
}) => {
  const { t } = useTranslation();

  // Default options based on type
  const getDefaultOptions = () => {
    if (type === 'timeline') {
      return CHART_CONFIG.timelines.map(timeline => ({
        value: timeline.value,
        label: t(timeline.labelKey)
      }));
    }
    
    // Default to chart types
    return CHART_CONFIG.types.map(chartType => ({
      value: chartType.value,
      label: t(chartType.labelKey)
    }));
  };

  const selectOptions = options || getDefaultOptions();
  
  // Apply filtering based on availability (for timeline filtering)
  const getFilteredOptions = () => {
    if (type === 'timeline' && dateRange) {
      // Get available timelines based on date range
      const availableTimelines = getAvailableTimelines(dateRange.start, dateRange.end);
      return selectOptions.filter(option => availableTimelines.includes(option.value));
    }
    
    if (availableOptions) {
      // Filter based on provided available options
      return selectOptions.filter(option => availableOptions.includes(option.value));
    }
    
    return selectOptions;
  };
  
  const finalOptions = getFilteredOptions();
  
  // Size-based styling
  const sizeClasses = {
    sm: 'text-sm min-w-32',
    md: 'text-base min-w-40',
    lg: 'text-lg min-w-48'
  };

  // Find current value object
  const currentValue = finalOptions.find(option => option.value === value) || null;

  // Custom styles for react-select
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: size === 'sm' ? '32px' : size === 'lg' ? '44px' : '36px',
      fontSize: size === 'sm' ? '14px' : size === 'lg' ? '16px' : '15px',
      borderColor: state.isFocused ? '#007B85' : provided.borderColor,
      boxShadow: state.isFocused ? '0 0 0 1px #007B85' : provided.boxShadow,
      '&:hover': {
        borderColor: '#007B85'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#007B85' 
        : state.isFocused 
        ? '#f0f9ff' 
        : provided.backgroundColor,
      color: state.isSelected ? 'white' : provided.color,
      fontSize: size === 'sm' ? '14px' : size === 'lg' ? '16px' : '15px'
    }),
    singleValue: (provided) => ({
      ...provided,
      fontSize: size === 'sm' ? '14px' : size === 'lg' ? '16px' : '15px'
    })
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <Select
        value={currentValue}
        onChange={(selectedOption) => onChange(selectedOption?.value)}
        options={finalOptions}
        isSearchable={false}
        isDisabled={isDisabled}
        placeholder={placeholder}
        styles={customStyles}
        classNamePrefix="select"
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
    </div>
  );
};

export default ChartSelector;