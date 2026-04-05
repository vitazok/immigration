'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FormField } from './form-field';

interface FormSectionsProps {
  applicant: Record<string, unknown> | null;
  trip: Record<string, unknown> | null;
  formFields: Record<string, string>;
  onFieldChange: (key: string, value: string) => void;
  onSave: () => void;
  saving: boolean;
}

interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'date' | 'select';
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

interface SectionDefinition {
  title: string;
  fields: FieldDefinition[];
}

const SECTIONS: SectionDefinition[] = [
  {
    title: 'Personal Details',
    fields: [
      { key: 'applicant.surname', label: 'Surname', type: 'text', placeholder: 'As in passport' },
      { key: 'applicant.givenNames', label: 'Given names', type: 'text', placeholder: 'As in passport' },
      { key: 'applicant.dateOfBirth', label: 'Date of birth', type: 'date' },
      { key: 'applicant.placeOfBirth', label: 'Place of birth', type: 'text' },
      {
        key: 'applicant.sex',
        label: 'Sex',
        type: 'select',
        options: ['Male', 'Female'],
      },
      {
        key: 'applicant.maritalStatus',
        label: 'Marital status',
        type: 'select',
        options: ['Single', 'Married', 'Separated', 'Divorced', 'Widowed', 'Other'],
      },
    ],
  },
  {
    title: 'Passport',
    fields: [
      { key: 'applicant.passportNumber', label: 'Passport number', type: 'text' },
      { key: 'applicant.passportIssueDate', label: 'Date of issue', type: 'date' },
      { key: 'applicant.passportExpiryDate', label: 'Date of expiry', type: 'date' },
      { key: 'applicant.passportIssuingAuthority', label: 'Issuing authority', type: 'text' },
    ],
  },
  {
    title: 'Travel Plans',
    fields: [
      { key: 'trip.mainDestination', label: 'Main destination', type: 'text', placeholder: 'e.g. France' },
      { key: 'trip.arrivalDate', label: 'Arrival date', type: 'date' },
      { key: 'trip.departureDate', label: 'Departure date', type: 'date' },
      {
        key: 'trip.purpose',
        label: 'Purpose of travel',
        type: 'select',
        options: ['Tourism', 'Business', 'Visiting family', 'Cultural', 'Sports', 'Official', 'Medical', 'Study', 'Transit', 'Other'],
      },
      {
        key: 'trip.entriesRequested',
        label: 'Entries requested',
        type: 'select',
        options: ['Single', 'Double', 'Multiple'],
      },
      {
        key: 'trip.accommodationType',
        label: 'Accommodation type',
        type: 'select',
        options: ['Hotel', 'Private', 'Other'],
      },
      { key: 'trip.accommodationName', label: 'Accommodation name', type: 'text', placeholder: 'Hotel or host name' },
    ],
  },
  {
    title: 'Employment & Finances',
    fields: [
      { key: 'applicant.occupation', label: 'Occupation', type: 'text' },
      { key: 'applicant.employerName', label: 'Employer name', type: 'text', placeholder: 'If employed' },
      { key: 'applicant.bankName', label: 'Bank name', type: 'text', helpText: 'The bank from which you will provide a statement' },
    ],
  },
  {
    title: 'Travel History',
    fields: [
      {
        key: 'applicant.previousSchengenVisas',
        label: 'Previous Schengen visas',
        type: 'select',
        options: ['Yes', 'No'],
      },
      {
        key: 'applicant.fingerprintsPreviouslyCollected',
        label: 'Fingerprints previously collected',
        type: 'select',
        options: ['Yes', 'No'],
        helpText: 'Have your fingerprints been collected for a previous Schengen visa application?',
      },
    ],
  },
  {
    title: 'Ties to Home',
    fields: [
      {
        key: 'applicant.propertyOwnership',
        label: 'Property ownership',
        type: 'select',
        options: ['Yes', 'No'],
        helpText: 'Do you own property in your home country?',
      },
      {
        key: 'applicant.familyDependents',
        label: 'Family dependents',
        type: 'select',
        options: ['Yes — spouse/children', 'Yes — parents/other', 'No dependents'],
        helpText: 'Family members who depend on you financially',
      },
    ],
  },
];

function resolveInitialValue(
  key: string,
  applicant: Record<string, unknown> | null,
  trip: Record<string, unknown> | null,
): string {
  const [source, field] = key.split('.');
  if (!source || !field) return '';
  const record = source === 'applicant' ? applicant : source === 'trip' ? trip : null;
  if (!record) return '';
  const raw = record[field];
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
  if (Array.isArray(raw)) return raw.length > 0 ? 'Yes' : 'No';
  return String(raw);
}

function determineSource(
  key: string,
  currentValue: string,
  applicant: Record<string, unknown> | null,
  trip: Record<string, unknown> | null,
): 'extraction' | 'manual' | null {
  if (!currentValue) return null;
  const initialValue = resolveInitialValue(key, applicant, trip);
  if (initialValue && initialValue === currentValue) return 'extraction';
  return 'manual';
}

export function FormSections({
  applicant,
  trip,
  formFields,
  onFieldChange,
  onSave,
  saving,
}: FormSectionsProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleSection(title: string) {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  function getFieldValue(key: string): string {
    const saved = formFields[key];
    if (saved !== undefined) return saved;
    return resolveInitialValue(key, applicant, trip);
  }

  function countFilled(fields: FieldDefinition[]): number {
    return fields.filter((f) => getFieldValue(f.key).trim() !== '').length;
  }

  return (
    <div className="space-y-4">
      {SECTIONS.map((section) => {
        const isCollapsed = collapsed[section.title] ?? false;
        const filled = countFilled(section.fields);
        const total = section.fields.length;

        return (
          <div key={section.title} className="border border-gray-200 rounded-md">
            <button
              type="button"
              onClick={() => toggleSection(section.title)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-semibold text-black">{section.title}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {filled} of {total} filled
                </span>
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                )}
              </span>
            </button>

            {!isCollapsed && (
              <div className="border-t border-gray-200 px-4 py-4 space-y-4">
                {section.fields.map((field) => (
                  <FormField
                    key={field.key}
                    fieldKey={field.key}
                    label={field.label}
                    value={getFieldValue(field.key)}
                    onChange={(val) => onFieldChange(field.key, val)}
                    type={field.type}
                    options={field.options}
                    source={determineSource(field.key, getFieldValue(field.key), applicant, trip)}
                    placeholder={field.placeholder}
                    helpText={field.helpText}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-colors bg-black text-white hover:bg-gray-900 px-6 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && (
            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
          Save progress
        </button>
      </div>
    </div>
  );
}
