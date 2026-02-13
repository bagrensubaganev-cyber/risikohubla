
import React from 'react';
import Select from 'react-select';
import { DropdownOption } from '../types';

interface Props {
  options: DropdownOption[];
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, metadata?: any) => void;
  isLoading?: boolean;
}

const AdvancedDropdown: React.FC<Props> = ({ 
  options, 
  label, 
  placeholder = "Pilih...", 
  value, 
  onChange,
  isLoading = false
}) => {
  const selectedOption = options.find(opt => opt.value === value) || (value ? { value, label: value } : null);

  const customStyles = {
    control: (base: any) => ({
      ...base,
      borderColor: '#e2e8f0',
      borderRadius: '0.5rem',
      minHeight: '42px',
      '&:hover': { borderColor: '#3b82f6' }
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
      color: state.isSelected ? 'white' : '#1e293b',
      padding: '10px 12px',
      fontSize: '13px'
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <Select
        options={options}
        value={selectedOption}
        onChange={(opt: any) => onChange(opt?.value || "", opt?.metadata)}
        placeholder={placeholder}
        isLoading={isLoading}
        styles={customStyles}
        noOptionsMessage={() => "Data tidak ditemukan"}
        className="text-sm"
        isClearable
        menuPortalTarget={document.body} // Solusi dropdown terpotong
        menuPosition="fixed"
      />
    </div>
  );
};

export default AdvancedDropdown;
